import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Edge Function: Due Date Reminders
 * 
 * Envia lembretes de vencimento de contas recorrentes via Telegram.
 * Pode ser chamada via CRON job diariamente.
 */
serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        const today = new Date();
        const results = {
            sent: 0,
            errors: 0,
            details: [] as string[]
        };

        // Buscar transações (despesas) não efetivadas que vencem em 3, 1 ou 0 dias
        const daysToCheck = [0, 1, 3];
        const processedUserIds = new Set<string>();

        // Map para armazenar perfis: userId -> { telegram_chat_id, nome }
        const profilesMap = new Map<string, { telegram_chat_id: number, nome: string }>();

        for (const daysAhead of daysToCheck) {
            const targetDate = new Date(today);
            targetDate.setDate(today.getDate() + daysAhead);
            const targetDateStr = targetDate.toISOString().split('T')[0]; // YYYY-MM-DD

            // Buscar despesas pendentes para esta data
            // Nota: 'efetivada' deve ser false.
            const { data: bills, error: billsError } = await supabase
                .from('transactions')
                .select('id, description:descricao, amount:valor, date:data_transacao, user_id, efetivada') // Alias para compatibilidade ou clareza
                .eq('tipo', 'despesa')
                .eq('efetivada', false)
                .eq('data_transacao', targetDateStr);

            if (billsError) {
                console.error(`Erro ao buscar contas para ${targetDateStr}:`, billsError);
                results.details.push(`Erro DB ${targetDateStr}: ${billsError.message}`);
                continue;
            }

            if (!bills || bills.length === 0) continue;

            // Coletar User IDs para buscar perfis
            bills.forEach((b: any) => processedUserIds.add(b.user_id));
        }

        // Buscar perfis em lote
        if (processedUserIds.size > 0) {
            const { data: profiles, error: profilesError } = await supabase
                .from('profiles')
                .select('user_id, telegram_chat_id, nome')
                .in('user_id', Array.from(processedUserIds));

            if (profiles && !profilesError) {
                profiles.forEach((p: any) => {
                    if (p.telegram_chat_id) {
                        profilesMap.set(p.user_id, { telegram_chat_id: p.telegram_chat_id, nome: p.nome });
                    }
                });
            }
        }

        // Processar envio
        for (const daysAhead of daysToCheck) {
            const targetDate = new Date(today);
            targetDate.setDate(today.getDate() + daysAhead);
            const targetDateStr = targetDate.toISOString().split('T')[0];

            const { data: bills } = await supabase
                .from('transactions')
                .select('id, descricao, valor, user_id')
                .eq('tipo', 'despesa')
                .eq('efetivada', false)
                .eq('data_transacao', targetDateStr);

            if (!bills) continue;

            for (const bill of bills) {
                const profile = profilesMap.get(bill.user_id);

                if (!profile) {
                    results.details.push(`Skip: ${bill.descricao} (sem Telegram)`);
                    continue;
                }

                const chatId = profile.telegram_chat_id;

                // Verificar se já enviamos lembrete hoje para esta conta
                // Chave única: reminder_BILLID_DATE_TYPE
                const reminderKey = `reminder_${bill.id}_${today.toISOString().split('T')[0]}_${daysAhead}d`;

                const { data: existingLog } = await supabase
                    .from('notification_logs')
                    .select('id')
                    .eq('key', reminderKey)
                    .single();

                if (existingLog) {
                    // results.details.push(`Skip: ${bill.descricao} (já notificado)`);
                    continue;
                }

                // Montar mensagem
                let emoji = '📅';
                let urgency = '';

                if (daysAhead === 0) {
                    emoji = '🔴';
                    urgency = '*VENCE HOJE!*';
                } else if (daysAhead === 1) {
                    emoji = '🟡';
                    urgency = 'vence *amanhã*';
                } else {
                    emoji = '🔵';
                    urgency = `vence em *${daysAhead} dias*`;
                }

                const message = `${emoji} *Lembrete de Vencimento*\n\n` +
                    `📌 *${bill.descricao}*\n` +
                    `💰 Valor: R$ ${Number(bill.valor).toFixed(2)}\n` +
                    `📅 ${urgency}\n\n` +
                    `_Acesse o app para marcar como paga._`;

                // Enviar via Telegram
                const sent = await sendTelegramMessage(chatId, message);

                if (sent) {
                    // Registrar log
                    await supabase.from('notification_logs').insert({
                        key: reminderKey,
                        user_id: bill.user_id,
                        type: 'due_date_reminder',
                        metadata: { transaction_id: bill.id, days_ahead: daysAhead }
                    });

                    results.sent++;
                    results.details.push(`✅ Enviado: ${bill.descricao} (${daysAhead}d)`);
                } else {
                    results.errors++;
                    results.details.push(`❌ Erro Telegram: ${bill.descricao}`);
                }
            }
        }

        console.log('Due Date Reminders Result:', results);

        return new Response(
            JSON.stringify({ success: true, ...results }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('Erro em due-date-reminders:', error);
        return new Response(
            JSON.stringify({ error: String(error) }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});

async function sendTelegramMessage(chatId: number, message: string): Promise<boolean> {
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
    if (!botToken) {
        console.error('TELEGRAM_BOT_TOKEN não configurado');
        return false;
    }

    try {
        const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'Markdown'
            })
        });

        if (!response.ok) {
            const err = await response.json();
            console.error('Telegram API error:', err);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Erro ao enviar mensagem Telegram:', error);
        return false;
    }
}
