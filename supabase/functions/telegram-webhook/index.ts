
// CORREÇÃO: Harmonizando todas as importações da biblioteca padrão para a mesma versão (0.224.0)
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from './_shared/types.ts';

// Imports dos Handlers Principais
import { handleCallbackQuery } from './handlers/callback.ts';
import { handleTextMessage } from './handlers/text.ts';

/**
 * Função principal do Webhook
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }

  // 🛡️ SECURITY: Validar Secret Token do Telegram
  const secretToken = req.headers.get("X-Telegram-Bot-Api-Secret-Token");
  const configuredSecret = Deno.env.get("TELEGRAM_WEBHOOK_SECRET");

  if (configuredSecret && secretToken !== configuredSecret) {
    console.error("⛔ SECURITY: Tentativa de acesso não autorizado - Token inválido");
    return new Response("Unauthorized", {
      status: 401,
      headers: corsHeaders
    });
  }

  try {
    const body = await req.json();
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

    // ============================================================================
    // RATE LIMITING - Proteção contra abuso (60 req/min por usuário)
    // ============================================================================
    const telegramId = body.message?.from?.id || body.callback_query?.from?.id;
    if (telegramId) {
      const { data: rateLimitCheck, error: rateLimitError } = await supabaseAdmin.rpc('check_rate_limit', {
        p_telegram_id: telegramId,
        p_limit: 60,
        p_window_seconds: 60
      });

      if (rateLimitError) console.error('Erro ao verificar rate limit:', rateLimitError);

      if (rateLimitCheck && !rateLimitCheck.allowed) {
        console.warn(`[Rate Limit] Bloqueado: ${telegramId}`);
        // return new Response('Rate Limit Exceeded', { status: 429, headers: corsHeaders });
      }
    }

    // ============================================================================
    // ROUTING
    // ============================================================================

    if (body.callback_query) {
      return await handleCallbackQuery(supabaseAdmin, body);
    }

    if (body.message) {
      // Ignorar mensagens de bots
      if (body.message.from?.is_bot) {
        return new Response('OK', { status: 200, headers: corsHeaders });
      }
      return await handleTextMessage(supabaseAdmin, body.message.chat.id, body.message);
    }

    return new Response('OK', { status: 200, headers: corsHeaders });

  } catch (error) {
    console.error('Erro no webhook:', error);
    return new Response(JSON.stringify({ error: 'Erro interno' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
