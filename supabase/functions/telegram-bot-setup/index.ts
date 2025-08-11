import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const telegramToken = Deno.env.get('TELEGRAM_BOT_TOKEN')!;
const webhookUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/telegram-webhook`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Set webhook
    const setWebhookResponse = await fetch(`https://api.telegram.org/bot${telegramToken}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ['message'],
      }),
    });

    const webhookResult = await setWebhookResponse.json();
    console.log('Webhook setup result:', webhookResult);

    // Set bot commands
    const commands = [
      { command: 'saldo', description: 'Ver saldo de todas as contas' },
      { command: 'extrato', description: 'Ver últimas transações' },
      { command: 'resumo', description: 'Resumo financeiro do mês' },
      { command: 'categorias', description: 'Listar categorias' },
    ];

    const setCommandsResponse = await fetch(`https://api.telegram.org/bot${telegramToken}/setMyCommands`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commands }),
    });

    const commandsResult = await setCommandsResponse.json();
    console.log('Commands setup result:', commandsResult);

    return new Response(
      JSON.stringify({
        webhook: webhookResult,
        commands: commandsResult,
        webhookUrl,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error setting up bot:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});