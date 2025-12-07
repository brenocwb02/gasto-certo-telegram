import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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
    console.log('No Telegram bot token configured');
    return;
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'Markdown'
      })
    });

    if (!response.ok) {
      console.error('Failed to send Telegram message:', await response.text());
    }
  } catch (error) {
    console.error('Error sending Telegram message:', error);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('[CREDIT-CARD-REMINDERS] Iniciando processamento...');

    const today = new Date();
    const todayDay = today.getDate();

    // Get cards with reminders enabled
    const { data: cardsWithSettings, error: settingsError } = await supabase
      .from('credit_card_settings')
      .select(`
        id,
        account_id,
        send_reminder,
        reminder_days_before,
        user_id
      `)
      .eq('send_reminder', true);

    if (settingsError) throw settingsError;

    if (!cardsWithSettings || cardsWithSettings.length === 0) {
      console.log('[CREDIT-CARD-REMINDERS] Nenhum cartão com lembrete ativo');
      return new Response(
        JSON.stringify({ success: true, message: 'No reminders to send', sent: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = {
      processed: 0,
      sent: 0,
      errors: 0,
      details: [] as { cardId: string; userId: string; status: string }[]
    };

    for (const settings of cardsWithSettings) {
      try {
        // Get card details
        const { data: card, error: cardError } = await supabase
          .from('accounts')
          .select('id, nome, saldo_atual, dia_vencimento')
          .eq('id', settings.account_id)
          .single();

        if (cardError || !card) {
          console.log(`Card not found: ${settings.account_id}`);
          continue;
        }

        // Only process cards with pending invoice
        if (card.saldo_atual >= 0) {
          continue;
        }

        result.processed++;

        // Check if today is reminder day
        const dueDay = card.dia_vencimento || 10;
        const reminderDaysBefore = settings.reminder_days_before || 3;
        
        // Calculate reminder day
        let reminderDay = dueDay - reminderDaysBefore;
        if (reminderDay <= 0) reminderDay += 30;

        if (todayDay !== reminderDay) {
          continue;
        }

        // Get user's Telegram chat ID
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('telegram_chat_id')
          .eq('user_id', settings.user_id)
          .single();

        if (profileError || !profile?.telegram_chat_id) {
          result.details.push({
            cardId: settings.account_id,
            userId: settings.user_id,
            status: 'no_telegram'
          });
          continue;
        }

        // Send reminder
        const invoiceAmount = Math.abs(card.saldo_atual);
        const message = `🔔 *Lembrete de Fatura*\n\n` +
          `💳 *${card.nome}*\n` +
          `💰 Valor: ${formatCurrency(invoiceAmount)}\n` +
          `📅 Vencimento: dia ${dueDay}\n\n` +
          `Use /pagar para pagar agora.`;

        await sendTelegramMessage(profile.telegram_chat_id, message);

        result.sent++;
        result.details.push({
          cardId: settings.account_id,
          userId: settings.user_id,
          status: 'sent'
        });

      } catch (innerError) {
        console.error(`Error processing card ${settings.account_id}:`, innerError);
        result.errors++;
        result.details.push({
          cardId: settings.account_id,
          userId: settings.user_id,
          status: 'error'
        });
      }
    }

    console.log('[CREDIT-CARD-REMINDERS] Concluído:', result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[CREDIT-CARD-REMINDERS] Erro:', error);
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
