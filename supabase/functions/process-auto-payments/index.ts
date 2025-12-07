import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper to format currency
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

// Send Telegram message
async function sendTelegramMessage(chatId: number, text: string): Promise<void> {
  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
  if (!botToken) {
    console.log('[AUTO-PAYMENT] No Telegram bot token');
    return;
  }

  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'Markdown'
      })
    });
  } catch (error) {
    console.error('[AUTO-PAYMENT] Error sending Telegram:', error);
  }
}

interface CreditCard {
  id: string;
  nome: string;
  user_id: string;
  saldo_atual: number;
  dia_vencimento: number;
  telegram_chat_id: number | null;
  auto_payment: boolean;
  default_payment_account_id: string | null;
  payment_account_name: string;
  payment_account_balance: number;
}

async function processCardPayment(
  supabase: SupabaseClient,
  card: CreditCard
): Promise<{ success: boolean; message: string; amount?: number }> {
  try {
    const invoiceAmount = Math.abs(card.saldo_atual);

    if (!card.default_payment_account_id) {
      const message = `⚠️ *PAGAMENTO AUTOMÁTICO NÃO CONFIGURADO*\n\n` +
        `💳 ${card.nome}\n` +
        `💰 Fatura: ${formatCurrency(invoiceAmount)}\n\n` +
        `Configure uma conta de pagamento padrão com /config_cartao`;

      if (card.telegram_chat_id) {
        await sendTelegramMessage(card.telegram_chat_id, message);
      }
      return { success: false, message: 'No default payment account' };
    }

    // Check balance
    if (card.payment_account_balance < invoiceAmount) {
      const message = `❌ *SALDO INSUFICIENTE*\n\n` +
        `💳 ${card.nome}\n` +
        `💰 Fatura: ${formatCurrency(invoiceAmount)}\n` +
        `🏦 Saldo em ${card.payment_account_name}: ${formatCurrency(card.payment_account_balance)}\n\n` +
        `Faltam: ${formatCurrency(invoiceAmount - card.payment_account_balance)}\n\n` +
        `Use /pagar para pagar manualmente de outra conta.`;

      if (card.telegram_chat_id) {
        await sendTelegramMessage(card.telegram_chat_id, message);
      }
      return { success: false, message: 'Insufficient balance' };
    }

    // Execute payment
    const { data: result, error } = await supabase.rpc('process_invoice_payment', {
      p_card_account_id: card.id,
      p_payment_account_id: card.default_payment_account_id,
      p_amount: invoiceAmount
    });

    if (error) throw error;

    if (result?.success) {
      const message = `✅ *PAGAMENTO AUTOMÁTICO REALIZADO*\n\n` +
        `💳 ${card.nome}\n` +
        `💰 Valor pago: ${formatCurrency(result.amount_paid)}\n` +
        `🏦 De: ${result.payment_account_name}\n` +
        `📊 Novo saldo: ${formatCurrency(result.new_payment_balance)}`;

      if (card.telegram_chat_id) {
        await sendTelegramMessage(card.telegram_chat_id, message);
      }

      return {
        success: true,
        message: 'Payment processed',
        amount: result.amount_paid
      };
    }

    return { success: false, message: result?.error || 'Unknown error' };

  } catch (error) {
    console.error(`[AUTO-PAYMENT] Error processing ${card.nome}:`, error);

    // Notify error
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    const message = `❌ *ERRO NO PROCESSAMENTO*\n\n` +
      `💳 ${card.nome}\n` +
      `⚠️ Erro técnico ao processar pagamento automático.\n\n` +
      `Por favor, pague manualmente usando /pagar\n` +
      `ou acesse o aplicativo.\n\n` +
      `Erro: ${errorMsg}`;

    if (card.telegram_chat_id) {
      await sendTelegramMessage(card.telegram_chat_id, message);
    }

    return { success: false, message: errorMsg };
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
        dia_vencimento
      `)
      .eq('tipo', 'cartao')
      .eq('dia_vencimento', hoje)
      .lt('saldo_atual', 0);

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
      details: [] as { card_name: string; user_id: string; success: boolean; message: string }[]
    };

    // Processar cada cartão
    for (const card of cards) {
      // Buscar configurações e perfil separadamente
      const { data: settings } = await supabase
        .from('credit_card_settings')
        .select('auto_payment, default_payment_account_id')
        .eq('account_id', card.id)
        .eq('auto_payment', true)
        .single();

      if (!settings?.auto_payment) {
        continue;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('telegram_chat_id')
        .eq('user_id', card.user_id)
        .single();

      let paymentAccountName = 'N/A';
      let paymentAccountBalance = 0;

      if (settings.default_payment_account_id) {
        const { data: paymentAccount } = await supabase
          .from('accounts')
          .select('nome, saldo_atual')
          .eq('id', settings.default_payment_account_id)
          .single();

        if (paymentAccount) {
          paymentAccountName = paymentAccount.nome;
          paymentAccountBalance = paymentAccount.saldo_atual;
        }
      }

      const cardData: CreditCard = {
        id: card.id,
        nome: card.nome,
        user_id: card.user_id,
        saldo_atual: card.saldo_atual,
        dia_vencimento: card.dia_vencimento,
        telegram_chat_id: profile?.telegram_chat_id || null,
        auto_payment: settings.auto_payment,
        default_payment_account_id: settings.default_payment_account_id,
        payment_account_name: paymentAccountName,
        payment_account_balance: paymentAccountBalance
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
