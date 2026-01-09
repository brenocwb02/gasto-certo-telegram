import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Edge Function: Weekly Summary
 * 
 * Envia resumo semanal automático para todos os usuários via Telegram.
 * Agendado para rodar toda segunda-feira às 08:00 UTC (05:00 BRT).
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

        const results = {
            sent: 0,
            skipped: 0,
            errors: 0,
            details: [] as string[]
        };

        // Buscar todos os usuários com Telegram vinculado
        const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('user_id, telegram_chat_id, nome')
            .not('telegram_chat_id', 'is', null);

        if (profilesError) {
            throw new Error(`Erro ao buscar perfis: ${profilesError.message}`);
        }

        if (!profiles || profiles.length === 0) {
            return new Response(
                JSON.stringify({ success: true, message: 'Nenhum usuário com Telegram vinculado', sent: 0 }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const currentDate = new Date();
        const sevenDaysAgo = new Date(currentDate);
        sevenDaysAgo.setDate(currentDate.getDate() - 7);

        for (const profile of profiles) {
            try {
                // Buscar transações da última semana
                const { data: transactions } = await supabase
                    .from('transactions')
                    .select('tipo, valor, categories(nome)')
                    .eq('user_id', profile.user_id)
                    .gte('data_transacao', sevenDaysAgo.toISOString().split('T')[0])
                    .lte('data_transacao', currentDate.toISOString().split('T')[0]);

                let receitas = 0;
                let despesas = 0;
                const categoriesSpent: { [key: string]: number } = {};

                if (transactions) {
                    transactions.forEach((t: any) => {
                        const value = Number(t.valor);
                        if (t.tipo === 'receita') receitas += value;
                        if (t.tipo === 'despesa') {
                            despesas += value;
                            const categoryName = t.categories?.nome || 'Outros';
                            categoriesSpent[categoryName] = (categoriesSpent[categoryName] || 0) + value;
                        }
                    });
                }

                // Se não houve movimentações, pular
                if (receitas === 0 && despesas === 0) {
                    results.skipped++;
                    continue;
                }

                const saldo = receitas - despesas;
                const topCategories = Object.entries(categoriesSpent)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 3);

                // Montar mensagem motivacional
                let emoji = saldo >= 0 ? '🎉' : '💪';
                let motivacao = saldo >= 0
                    ? 'Você está no caminho certo! Continue assim!'
                    : 'Não desanime! Pequenos ajustes fazem grande diferença.';

                const greeting = profile.nome ? `Olá, ${profile.nome.split(' ')[0]}! ` : '';

                let message = `📅 *Resumo Semanal*\n`;
                message += `(${sevenDaysAgo.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} a ${currentDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })})\n\n`;
                message += `${greeting}${emoji}\n\n`;
                message += `💸 *Despesas:* R$ ${despesas.toFixed(2)}\n`;
                message += `💰 *Receitas:* R$ ${receitas.toFixed(2)}\n`;
                message += `📊 *Saldo:* R$ ${saldo.toFixed(2)}\n\n`;

                if (topCategories.length > 0) {
                    message += `🏆 *Maiores Gastos:*\n`;
                    topCategories.forEach(([cat, val], idx) => {
                        const medals = ['🥇', '🥈', '🥉'];
                        message += `${medals[idx] || '•'} ${cat}: R$ ${val.toFixed(2)}\n`;
                    });
                    message += '\n';
                }

                message += `_${motivacao}_\n\n`;
                message += `Use /resumo para ver seu status completo. 📈`;

                // Enviar mensagem
                const sent = await sendTelegramMessage(profile.telegram_chat_id, message);

                if (sent) {
                    results.sent++;
                    results.details.push(`✅ ${profile.nome || profile.user_id}`);
                } else {
                    results.errors++;
                    results.details.push(`❌ ${profile.nome || profile.user_id}`);
                }

            } catch (innerError) {
                console.error(`Erro ao processar usuário ${profile.user_id}:`, innerError);
                results.errors++;
            }
        }

        console.log('Weekly Summary Result:', results);

        return new Response(
            JSON.stringify({ success: true, ...results }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('Erro em weekly-summary:', error);
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
