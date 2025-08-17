// supabase/functions/telegram-bot-setup/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from '../_shared/cors.ts'

/**
 * Esta função é chamada uma vez para configurar o seu bot no Telegram.
 * Ela define o webhook (para onde o Telegram deve enviar as mensagens)
 * e o menu de comandos que o utilizador vê.
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const token = Deno.env.get('TELEGRAM_BOT_TOKEN');
    if (!token) throw new Error("TELEGRAM_BOT_TOKEN não está definido nos segredos.");

    // A URL da sua função de webhook
    const webhookUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/telegram-webhook`;

    // 1. Configurar o Webhook
    const setWebhookResponse = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ['message', 'callback_query'], // Aceita mensagens e cliques em botões
      }),
    });
    const webhookResult = await setWebhookResponse.json();
    console.log('Resultado da configuração do Webhook:', webhookResult);

    // 2. Configurar o Menu de Comandos
    const commands = [
      { command: 'saldo', description: 'Ver saldo de todas as contas' },
      { command: 'resumo', description: 'Resumo financeiro do mês' },
      { command: 'metas', description: 'Acompanhar suas metas' },
      { command: 'ajuda', description: 'Ver todos os comandos' },
    ];

    const setCommandsResponse = await fetch(`https://api.telegram.org/bot${token}/setMyCommands`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commands }),
    });
    const commandsResult = await setCommandsResponse.json();
    console.log('Resultado da configuração de Comandos:', commandsResult);

    if (!webhookResult.ok || !commandsResult.ok) {
        throw new Error(`Falha na configuração. Webhook: ${webhookResult.description}. Comandos: ${commandsResult.description}`);
    }

    return new Response(
      JSON.stringify({
        message: "Bot configurado com sucesso!",
        webhook: webhookResult,
        commands: commandsResult,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Erro ao configurar o bot:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
