import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { user_id, message } = await req.json()

    if (!user_id || !message) {
      return new Response(
        JSON.stringify({ error: 'user_id and message are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get user's Telegram configuration
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('telegram_bot_token, telegram_chat_id')
      .eq('user_id', user_id)
      .single()

    if (profileError || !profile?.telegram_bot_token || !profile?.telegram_chat_id) {
      return new Response(
        JSON.stringify({ error: 'Telegram not configured for this user' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Send message via Telegram API
    const telegramResponse = await fetch(`https://api.telegram.org/bot${profile.telegram_bot_token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: profile.telegram_chat_id,
        text: message,
        parse_mode: 'Markdown'
      })
    })

    const telegramResult = await telegramResponse.json()

    if (!telegramResult.ok) {
      throw new Error(`Telegram API error: ${telegramResult.description}`)
    }

    return new Response(
      JSON.stringify({ success: true, message_id: telegramResult.result.message_id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error sending Telegram message:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
