import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get all users with Telegram integration
    const { data: integrations } = await supabase
      .from('telegram_integration')
      .select('user_id')

    if (!integrations) {
      return new Response(JSON.stringify({ message: 'No integrations found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const results = []
    const currentDate = new Date()
    const isFirstDayOfMonth = currentDate.getDate() === 1
    const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6

    for (const integration of integrations) {
      const userId = integration.user_id

      // Send monthly summary on first day of month
      if (isFirstDayOfMonth) {
        const { data } = await supabase.functions.invoke('telegram-notifications', {
          body: { type: 'monthly_summary', userId }
        })
        results.push({ userId, type: 'monthly_summary', result: data })
      }

      // Send goal reminders on weekends
      if (isWeekend) {
        const { data } = await supabase.functions.invoke('telegram-notifications', {
          body: { type: 'goal_reminder', userId }
        })
        results.push({ userId, type: 'goal_reminder', result: data })
      }

      // Always check spending alerts
      const { data } = await supabase.functions.invoke('telegram-notifications', {
        body: { type: 'spending_alert', userId }
      })
      results.push({ userId, type: 'spending_alert', result: data })
    }

    return new Response(JSON.stringify({ 
      success: true, 
      processed: integrations.length,
      results 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error in schedule-notifications:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})