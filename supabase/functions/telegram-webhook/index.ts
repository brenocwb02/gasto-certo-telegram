// supabase/functions/telegram-webhook/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.44.2'
import { corsHeaders } from '../_shared/cors.ts'

interface TelegramWebhookBody {
  message: {
    chat: { id: number }
    text: string
  }
}

// Function to send a message to Telegram
async function sendTelegramMessage(chatId: number, text: string, parseMode = 'Markdown') {
  const telegramApiUrl = `https://api.telegram.org/bot${Deno.env.get('TELEGRAM_BOT_TOKEN')}/sendMessage`
  try {
    const response = await fetch(telegramApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: parseMode }),
    });
    if (!response.ok) {
      console.error("Telegram API error:", await response.json());
    }
  } catch (e) {
    console.error("Failed to send message to Telegram:", e);
  }
}

// Links a user to a license using the /start command
async function linkUserWithLicense(supabase: SupabaseClient, telegramChatId: number, licenseCode: string): Promise<{ success: boolean; message: string }> {
  console.log(`Attempting to link license ${licenseCode} to chat ${telegramChatId}`)
  
  const { data: license, error: licenseError } = await supabase
    .from('licenses')
    .select('user_id, status')
    .eq('codigo', licenseCode)
    .single()

  if (licenseError || !license || license.status !== 'ativo') {
    console.error('License not found or inactive:', licenseError)
    return { success: false, message: '❌ Código de licença inválido, expirado ou não encontrado.' };
  }

  // Check if this chat is already linked
  const { data: existingIntegration, error: existingError } = await supabase
    .from('telegram_integration')
    .select('user_id')
    .eq('telegram_chat_id', telegramChatId)
    .single();

  if (existingIntegration) {
    if (existingIntegration.user_id === license.user_id) {
      return { success: true, message: '✅ Este chat já está vinculado à sua conta.' };
    } else {
      return { success: false, message: '⚠️ Este chat do Telegram já está vinculado a outra conta.' };
    }
  }

  // Create the link
  const { error: insertError } = await supabase
    .from('telegram_integration')
    .insert({ user_id: license.user_id, telegram_chat_id: telegramChatId });

  if (insertError) {
    console.error('Error linking account:', insertError)
    return { success: false, message: '❌ Ocorreu um erro ao vincular sua conta. Tente novamente.' };
  }
  
  return { success: true, message: '✅ Conta vinculada com sucesso! Agora você pode registrar transações.' };
}

// Main webhook handler
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body: TelegramWebhookBody = await req.json()
    // The request might not have a message body, so we need to check for it
    if (!body || !body.message) {
        console.warn("Webhook received an empty or invalid body.");
        return new Response('Invalid body', { status: 400, headers: corsHeaders });
    }
    const { chat, text } = body.message

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Handle the /start command for linking accounts
    if (text.startsWith('/start')) {
      const licenseCode = text.split(' ')[1]
      if (!licenseCode) {
        await sendTelegramMessage(chat.id, 'Para começar, use o comando `/start SEU_CODIGO_DE_LICENCA` que você encontra na página de Configurações do site.')
      } else {
        const result = await linkUserWithLicense(supabaseAdmin, chat.id, licenseCode)
        await sendTelegramMessage(chat.id, result.message)
      }
      return new Response('OK', { status: 200, headers: corsHeaders })
    }

    // Find the user associated with this Telegram chat
    const { data: integration, error: integrationError } = await supabaseAdmin
      .from('telegram_integration')
      .select('user_id')
      .eq('telegram_chat_id', chat.id)
      .single()

    if (integrationError || !integration) {
      await sendTelegramMessage(chat.id, 'Sua conta do Telegram não está vinculada. Use `/start SEU_CODIGO_DE_LICENCA` para começar.')
      throw new Error(`User not found for chat ${chat.id}`)
    }
    
    const userId = integration.user_id;

    // --- NLP Transaction Processing ---
    await sendTelegramMessage(chat.id, "🧠 Analisando sua mensagem...");

    const { data: nlpData, error: nlpError } = await supabaseAdmin.functions.invoke('nlp-transaction', {
        body: { text },
    })

    if (nlpError || !nlpData) {
      console.error("NLP function error:", nlpError);
      await sendTelegramMessage(chat.id, "Desculpe, não consegui processar sua mensagem agora. Tente novamente mais tarde.");
      throw new Error('Error processing message with NLP.')
    }

    const { valor, descricao, tipo, categoria } = nlpData;

    if (!valor || !descricao || !tipo) {
        await sendTelegramMessage(chat.id, "Não consegui entender os detalhes da transação. Tente ser mais específico, como 'gastei 50 reais no almoço' ou 'recebi 500 de um projeto'.")
        return new Response('OK', { status: 200, headers: corsHeaders })
    }

    // Find the user's primary account
    const { data: account } = await supabaseAdmin.from('accounts').select('id').eq('user_id', userId).limit(1).single()
    if (!account) {
      await sendTelegramMessage(chat.id, 'Você precisa ter pelo menos uma conta cadastrada no site para registrar transações.')
      return new Response('OK', { status: 200, headers: corsHeaders })
    }
    
    // Find the category ID
    const { data: categoryData } = await supabaseAdmin.from('categories').select('id').eq('user_id', userId).ilike('nome', `%${categoria}%`).single()

    // Insert the transaction
    const { error: transactionError } = await supabaseAdmin.from('transactions').insert({
        user_id: userId,
        conta_origem_id: account.id,
        valor,
        descricao,
        tipo,
        categoria_id: categoryData?.id || null,
        origem: 'telegram'
    })

    if (transactionError) {
      throw transactionError;
    }

    await sendTelegramMessage(chat.id, `✅ Transação registrada!\n*${descricao}*: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)}`)

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
    })
  } catch (error) {
    console.error('Error in webhook:', error)
    // Avoid sending error messages to the user via Telegram for a better experience
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500,
    })
  }
})
