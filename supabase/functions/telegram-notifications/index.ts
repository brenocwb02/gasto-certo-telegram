import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { type, userId } = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    let message = ''
    let shouldSend = false

    switch (type) {
      case 'spending_alert':
        const result = await checkSpendingLimits(supabase, userId)
        message = result.message
        shouldSend = result.shouldAlert
        break

      case 'goal_reminder':
        const goalResult = await checkGoalProgress(supabase, userId)
        message = goalResult.message
        shouldSend = goalResult.shouldRemind
        break

      case 'monthly_summary':
        const summaryResult = await generateMonthlySummary(supabase, userId)
        message = summaryResult.message
        shouldSend = true
        break
    }

    if (shouldSend && message) {
      // Get user's telegram chat ID
      const { data: profile } = await supabase
        .from('profiles')
        .select('telegram_chat_id')
        .eq('user_id', userId)
        .single()

      if (profile?.telegram_chat_id) {
        await sendTelegramNotification(profile.telegram_chat_id, message)
      }
    }

    return new Response(
      JSON.stringify({ success: true, message, sent: shouldSend }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in telegram-notifications:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function checkSpendingLimits(supabase: any, userId: string) {
  const currentDate = new Date()
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)

  // Get this month's expenses
  const { data: transactions } = await supabase
    .from('transactions')
    .select('valor, data_transacao')
    .eq('user_id', userId)
    .eq('tipo', 'despesa')
    .gte('data_transacao', firstDay.toISOString().split('T')[0])

  if (!transactions || transactions.length === 0) {
    return { shouldAlert: false, message: '' }
  }

  const totalSpent = transactions.reduce((sum: number, t: any) => sum + Number(t.valor), 0)

  // Check if spending is above threshold
  if (totalSpent > 2000) {
    // SPAM FIX: Only alert if there is a RECENT transaction (last 2 hours)
    // This prevents the bot from spamming every hour just because you are over limit.
    const twoHoursAgo = new Date(currentDate.getTime() - 2 * 60 * 60 * 1000);

    // Check if any transaction in the list is recent
    // Note: data_transacao might be just date "YYYY-MM-DD" depending on how it's saved, 
    // but usually for comprehensive logs we'd want 'created_at'. 
    // If 'data_transacao' is date-only, we should check 'created_at' if available, 
    // or rely on the cron job running shortly after insertion.
    // Let's assume we need to check 'created_at' for precision, or fetch it if not selected.
    // Re-fetching recent activity specifically to be sure.

    const { data: recentActivity } = await supabase
      .from('transactions')
      .select('id')
      .eq('user_id', userId)
      .gte('created_at', twoHoursAgo.toISOString())
      .limit(1)

    const hasRecentActivity = recentActivity && recentActivity.length > 0;

    if (hasRecentActivity) {
      const message = `🚨 *Alerta de Gastos*\n\nVocê realizou uma nova despesa e já gastou R$ ${totalSpent.toFixed(2)} este mês.\n\nConsidere revisar seus gastos para manter o controle financeiro! 💰`
      return { shouldAlert: true, message }
    }
  }

  return { shouldAlert: false, message: '' }
}

async function checkGoalProgress(supabase: any, userId: string) {
  const { data: goals } = await supabase
    .from('goals')
    .select('titulo, valor_meta, valor_atual, data_fim')
    .eq('user_id', userId)
    .eq('status', 'ativa')

  if (!goals || goals.length === 0) {
    return { shouldRemind: false, message: '' }
  }

  const reminders = []

  for (const goal of goals) {
    const progress = (Number(goal.valor_atual) / Number(goal.valor_meta)) * 100
    const daysUntilEnd = Math.ceil((new Date(goal.data_fim).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))

    if (progress < 50 && daysUntilEnd <= 7) {
      reminders.push(`🎯 *${goal.titulo}*\nProgresso: ${progress.toFixed(1)}%\nFaltam ${daysUntilEnd} dias!`)
    }
  }

  if (reminders.length > 0) {
    const message = `📊 *Lembretes de Metas*\n\n${reminders.join('\n\n')}\n\n💪 Continue focado nos seus objetivos!`
    return { shouldRemind: true, message }
  }

  return { shouldRemind: false, message: '' }
}

async function generateMonthlySummary(supabase: any, userId: string) {
  const currentDate = new Date()
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

  const { data: transactions } = await supabase
    .from('transactions')
    .select('tipo, valor, categories(nome)')
    .eq('user_id', userId)
    .gte('data_transacao', firstDay.toISOString().split('T')[0])
    .lte('data_transacao', lastDay.toISOString().split('T')[0])

  let receitas = 0
  let despesas = 0
  const categoriesSpent: { [key: string]: number } = {}

  if (transactions) {
    transactions.forEach((t: any) => {
      const value = Number(t.valor)
      if (t.tipo === 'receita') receitas += value
      if (t.tipo === 'despesa') {
        despesas += value
        const categoryName = t.categories?.nome || 'Outros'
        categoriesSpent[categoryName] = (categoriesSpent[categoryName] || 0) + value
      }
    })
  }

  const saldo = receitas - despesas
  const topCategory = Object.entries(categoriesSpent)
    .sort(([, a], [, b]) => b - a)[0]

  const message = `📈 *Resumo Mensal - ${currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}*

💚 Receitas: R$ ${receitas.toFixed(2)}
❌ Despesas: R$ ${despesas.toFixed(2)}
💰 Saldo: R$ ${saldo.toFixed(2)}

🏆 Maior gasto: ${topCategory ? `${topCategory[0]} (R$ ${topCategory[1].toFixed(2)})` : 'N/A'}

${saldo > 0 ? '🎉 Parabéns! Mês positivo!' : '⚠️ Atenção aos gastos no próximo mês!'}`

  return { message }
}

async function sendTelegramNotification(chatId: number, message: string) {
  const telegramApiUrl = `https://api.telegram.org/bot${Deno.env.get('TELEGRAM_BOT_TOKEN')}/sendMessage`

  try {
    const response = await fetch(telegramApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown'
      })
    })

    if (!response.ok) {
      console.error('Telegram API error:', await response.json())
    }
  } catch (error) {
    console.error('Failed to send notification:', error)
  }
}