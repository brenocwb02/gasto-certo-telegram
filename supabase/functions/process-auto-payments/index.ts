import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

interface CreditCard {
    id: string;
    nome: string;
    user_id: string;
    saldo_atual: number;
    dia_vencimento: number;
    telegram_chat_id: number;
    auto_payment: boolean;
    default_payment_account_id: string;
    payment_account_name: string;
    payment_account_balance: number;
}

/**
 * Envia mensagem via Telegram
 */
async function sendTelegramMessage(
    chatId: number,
    text: string
): Promise<void> {
    try {
        await fetch(`${TELEGRAM_API}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text,
                parse_mode: 'Markdown'
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
 * Processa pagamento de um cartão específico
 */
async function processCard Payment(
    supabase: any,
    card: CreditCard
): Promise < { success: boolean; message: string } > {
    const fatura = Math.abs(card.saldo_atual);

    try {
        // Chamar função RPC para processar pagamento
        const { data, error } = await supabase.rpc('process_invoice_payment', {
            p_card_account_id: card.id,
            p_payment_account_id: card.default_payment_account_id,
            p_amount: null // null = pagar fatura completa
        });

        if(error) throw error;

        if(data.success) {
    // Sucesso!
    const message =
        `✅ *Fatura Paga Automaticamente!*\n\n` +
        `💳 *${card.nome}*\n` +
        `💰 Valor: *${formatCurrency(data.amount_paid)}*\n` +
        `🏦 De: ${data.payment_account_name}\n\n` +
        `📊 *Novo Saldo*\n` +
        `• ${data.payment_account_name}: ${formatCurrency(data.new_payment_balance)}\n` +
        `• ${card.nome}: ${formatCurrency(data.new_card_balance)}\n\n` +
        `✓ Pagamento processado com sucesso!`;

    await sendTelegramMessage(card.telegram_chat_id, message);

    return { success: true, message: 'Pago com sucesso' };

} else {
    // Falha - saldo insuficiente
    const message =
        `⚠️ *FALHA NO PAGAMENTO AUTOMÁTICO*\n\n` +
        `💳 ${card.nome}\n` +
        `💰 Fatura: ${formatCurrency(data.required)}\n` +
        `🏦 Disponível: ${formatCurrency(data.available)}\n` +
        `❌ Faltam: ${formatCurrency(data.missing)}\n\n` +
        `🔴 *Pagamento automático foi DESATIVADO*\n` +
        `para evitar tentativas repetidas.\n\n` +
        `📲 Quando tiver saldo, use:\n` +
        `• /pagar - para pagar manualmente\n` +
        `• /config_cartao - para reativar automático`;

    await sendTelegramMessage(card.telegram_chat_id, message);

    // Desativar pagamento automático
    await supabase
        .from('credit_card_settings')
        .update({ auto_payment: false })
        .eq('account_id', card.id);

    return {
        success: false,
        message: `Saldo insuficiente. Faltam ${formatCurrency(data.missing)}`
    };
}

  } catch (error) {
    console.error(`Erro ao processar pagamento do cartão ${card.id}:`, error);

    // Notificar erro
    const message =
        `❌ *ERRO NO PROCESSAMENTO*\n\n` +
        `💳 ${card.nome}\n` +
        `⚠️ Erro técnico ao processar pagamento automático.\n\n` +
        `Por favor, pague manualmente usando /pagar\n` +
        `ou acesse o aplicativo.\n\n` +
        `Erro: ${error.message}`;

    await sendTelegramMessage(card.telegram_chat_id, message);

    return { success: false, message: error.message };
}
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

        console.log('[AUTO-PAYMENT] Iniciando processamento automático de faturas...');

        const hoje = new Date().getDate();
        console.log(`[AUTO-PAYMENT] Dia atual: ${hoje}`);

        // Buscar cartões com vencimento hoje + auto_payment ativado
        const { data: cards, error: cardsError } = await supabase
            .from('accounts')
            .select(`
        id,
        nome,
        user_id,
        saldo_atual,
        dia_vencimento,
        profiles!inner(telegram_chat_id),
        credit_card_settings!inner(
          auto_payment,
          default_payment_account_id,
          payment_account:accounts!credit_card_settings_default_payment_account_id_fkey(
            nome,
            saldo_atual
          )
        )
      `)
            .eq('tipo', 'cartao')
            .eq('dia_vencimento', hoje)
            .eq('credit_card_settings.auto_payment', true)
            .lt('saldo_atual', 0); // Apenas cartões com fatura

        if (cardsError) {
            throw cardsError;
        }

        if (!cards || cards.length === 0) {
            console.log('[AUTO-PAYMENT] Nenhum cartão para processar hoje');
            return new Response(
                JSON.stringify({
                    success: true,
                    message: 'Nenhum pagamento automático agendado para hoje'
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        console.log(`[AUTO-PAYMENT] Encontrados ${cards.length} cartão(ões) para processar`);

        const results = {
            processed: 0,
            succeeded: 0,
            failed: 0,
            details: [] as any[]
        };

        // Processar cada cartão
        for (const card of cards) {
            // Transformar estrutura aninhada
            const cardData: CreditCard = {
                id: card.id,
                nome: card.nome,
                user_id: card.user_id,
                saldo_atual: card.saldo_atual,
                dia_vencimento: card.dia_vencimento,
                telegram_chat_id: card.profiles.telegram_chat_id,
                auto_payment: card.credit_card_settings[0].auto_payment,
                default_payment_account_id: card.credit_card_settings[0].default_payment_account_id,
                payment_account_name: card.credit_card_settings[0].payment_account?.nome || 'N/A',
                payment_account_balance: card.credit_card_settings[0].payment_account?.saldo_atual || 0
            };

            console.log(`[AUTO-PAYMENT] Processando ${cardData.nome}...`);

            const result = await processCardPayment(supabase, cardData);

            results.processed++;
            if (result.success) {
                results.succeeded++;
            } else {
                results.failed++;
            }

            results.details.push({
                card_name: cardData.nome,
                user_id: cardData.user_id,
                ...result
            });

            // Delay entre processamentos
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        const finalResult = {
            success: true,
            timestamp: new Date().toISOString(),
            today: hoje,
            ...results
        };

        console.log('[AUTO-PAYMENT] Concluído:', finalResult);

        return new Response(
            JSON.stringify(finalResult),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('[AUTO-PAYMENT] Erro:', error);
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
