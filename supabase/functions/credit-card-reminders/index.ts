import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

interface PendingInvoice {
    account_id: string;
    account_name: string;
    invoice_amount: number;
    due_date: number;
    days_until_due: number;
    has_auto_payment: boolean;
    payment_account_name: string;
    has_sufficient_balance: boolean;
}

interface UserProfile {
    user_id: string;
    telegram_chat_id: number;
    full_name: string;
}

/**
 * Envia mensagem via Telegram
 */
async function sendTelegramMessage(
    chatId: number,
    text: string,
    options: any = {}
): Promise<void> {
    try {
        await fetch(`${TELEGRAM_API}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text,
                parse_mode: 'Markdown',
                ...options
            })
        });
    } catch (error) {
        console.error(`Erro ao enviar mensagem para ${chatId}:`, error);
    }
}

/**
 * Formata valor em reais
 */
function formatCurrency(value: number): string {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
}

/**
 * Processa lembretes para um usuário específico
 */
async function processUserReminders(
    supabase: any,
    profile: UserProfile
): Promise<number> {
    let sentMessages = 0;

    try {
        // Buscar faturas pendentes
        const { data: invoices, error } = await supabase
            .rpc('get_pending_invoices', { p_user_id: profile.user_id });

        if (error) {
            console.error(`Erro ao buscar faturas para ${profile.user_id}:`, error);
            return 0;
        }

        if (!invoices || invoices.length === 0) {
            return 0;
        }

        // Processar cada fatura
        for (const invoice of invoices as PendingInvoice[]) {
            // Buscar configurações do cartão
            const { data: settings } = await supabase
                .from('credit_card_settings')
                .select('*')
                .eq('account_id', invoice.account_id)
                .single();

            // Decidir se deve enviar lembrete
            const shouldSendReminder = settings?.send_reminder &&
                invoice.days_until_due <= (settings?.reminder_days_before || 3) &&
                invoice.days_until_due > 0;

            if (!shouldSendReminder) {
                continue; // Pular esta fatura
            }

            // Montar mensagem
            let message = `⏰ *Lembrete de Fatura*\n\n`;
            message += `💳 *${invoice.account_name}*\n`;
            message += `💰 Valor: *${formatCurrency(invoice.invoice_amount)}*\n`;
            message += `📅 Vence em: *${invoice.days_until_due} dia(s)*\n`;
            message += `📆 Dia: *${invoice.due_date}*\n\n`;

            if (invoice.has_auto_payment) {
                // Modo automático
                message += `🤖 *Pagamento Automático: ATIVADO*\n`;
                message += `🏦 Conta: ${invoice.payment_account_name || 'Não configurada'}\n\n`;

                if (invoice.has_sufficient_balance) {
                    message += `✅ Saldo suficiente disponível\n`;
                    message += `✓ O pagamento será processado automaticamente no vencimento`;
                } else {
                    message += `⚠️ *ATENÇÃO: Saldo insuficiente!*\n`;
                    message += `Para evitar falha no pagamento automático, adicione saldo na conta *${invoice.payment_account_name}*\n\n`;
                    message += `💡 Use /desativar_auto para desativar o pagamento automático`;
                }
            } else {
                // Modo manual
                message += `📲 *Pagamento Manual*\n\n`;
                message += `Para pagar esta fatura:\n`;
                message += `• Use o comando /pagar\n`;
                message += `• Ou acesse o app\n\n`;
                message += `💡 Quer automatizar? Use /config_cartao`;
            }

            // Enviar mensagem
            await sendTelegramMessage(profile.telegram_chat_id, message);
            sentMessages++;

            // Delay para não sobrecarregar API do Telegram
            await new Promise(resolve => setTimeout(resolve, 100));
        }

    } catch (error) {
        console.error(`Erro ao processar lembretes para ${profile.user_id}:`, error);
    }

    return sentMessages;
}

/**
 * Edge Function principal
 */
serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        console.log('[CREDIT-CARD-REMINDERS] Iniciando processamento...');

        // Buscar todos os usuários com Telegram integrado
        const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('user_id, telegram_chat_id, full_name')
            .not('telegram_chat_id', 'is', null);

        if (profilesError) {
            throw profilesError;
        }

        if (!profiles || profiles.length === 0) {
            console.log('[CREDIT-CARD-REMINDERS] Nenhum usuário com Telegram encontrado');
            return new Response(
                JSON.stringify({ success: true, message: 'Nenhum usuário para processar' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        let totalSent = 0;
        let processedUsers = 0;

        // Processar cada usuário
        for (const profile of profiles as UserProfile[]) {
            const sent = await processUserReminders(supabase, profile);
            totalSent += sent;
            if (sent > 0) processedUsers++;
        }

        const result = {
            success: true,
            timestamp: new Date().toISOString(),
            stats: {
                total_users: profiles.length,
                users_with_reminders: processedUsers,
                messages_sent: totalSent
            }
        };

        console.log('[CREDIT-CARD-REMINDERS] Concluído:', result);

        return new Response(
            JSON.stringify(result),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('[CREDIT-CARD-REMINDERS] Erro:', error);
        return new Response(
            JSON.stringify({
                success: false,
                error: error.message
            }),
            {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        );
    }
});
