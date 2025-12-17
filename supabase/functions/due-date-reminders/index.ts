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

        // Buscar transações recorrentes que vencem em 3, 1 ou 0 dias
        const daysToCheck = [0, 1, 3];

        for (const daysAhead of daysToCheck) {
            const targetDate = new Date(today);
            targetDate.setDate(today.getDate() + daysAhead);
            const targetDay = targetDate.getDate();

            // Buscar recorrências ativas que vencem nesse dia
            const { data: recurrences, error: recError } = await supabase
                .from('recurring_transactions')
                .select(`
          id,
          descricao,
          valor,
          dia_vencimento,
          user_id,
          profiles!inner(telegram_chat_id, full_name)
        `)
                .eq('ativa', true)
                .eq('tipo', 'despesa')
                .eq('dia_vencimento', targetDay);

            if (recError) {
                console.error('Erro ao buscar recorrências:', recError);
                continue;
            }

            if (!recurrences || recurrences.length === 0) continue;

            for (const rec of recurrences) {
                const profile = rec.profiles as any;
                const chatId = profile?.telegram_chat_id;

                if (!chatId) {
                    results.details.push(`Skip: ${rec.descricao} (sem Telegram)`);
                    continue;
                }

                // Verificar se já enviamos lembrete hoje para esta recorrência
                const reminderKey = `due_reminder_${rec.id}_${today.toISOString().split('T')[0]}_${daysAhead}`;
                const { data: existingLog } = await supabase
                    .from('notification_logs')
                    .select('id')
                    .eq('key', reminderKey)
                    .single();

                if (existingLog) {
                    results.details.push(`Skip: ${rec.descricao} (já notificado)`);
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
                    `📌 *${rec.descricao}*\n` +
                    `💰 Valor: R$ ${Number(rec.valor).toFixed(2)}\n` +
                    `📅 ${urgency}\n\n` +
                    `_Use /recorrentes para ver todas as suas contas._`;

                // Enviar via Telegram
                const sent = await sendTelegramMessage(chatId, message);

                if (sent) {
                    // Registrar log para evitar duplicatas
                    await supabase.from('notification_logs').insert({
                        key: reminderKey,
                        user_id: rec.user_id,
                        type: 'due_date_reminder',
                        metadata: { recurring_id: rec.id, days_ahead: daysAhead }
                    });

                    results.sent++;
                    results.details.push(`✅ Enviado: ${rec.descricao} (${daysAhead}d)`);
                } else {
                    results.errors++;
                    results.details.push(`❌ Erro: ${rec.descricao}`);
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
