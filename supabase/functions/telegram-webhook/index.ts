import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.44.2'
import { corsHeaders } from '../_shared/cors.ts'

// --- Interfaces ---
interface TelegramWebhookBody {
  message: {
    chat: { id: number }
    from: { id: number }
    text: string
  }
}

interface TransactionData {
  amount: number
  description: string
  categoryName: string | null
  type: 'income' | 'expense'
}

// --- Funções Auxiliares do Telegram ---
async function sendTelegramMessage(chatId: number, text: string, parseMode = 'Markdown') {
  const telegramApiUrl = `https://api.telegram.org/bot${Deno.env.get('TELEGRAM_BOT_TOKEN')}/sendMessage`
  await fetch(telegramApiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: parseMode }),
  })
}

// --- Funções de Lógica de Negócio ---

// Processa o texto para extrair dados da transação (receita ou despesa)
function parseTransaction(text: string): TransactionData | null {
  const expenseKeywords = '(?:gastei|comprei|paguei)'
  const incomeKeywords = '(?:recebi|ganhei|vendi)'

  // Regex para despesas: "gastei 50 em almoço #comida"
  const expenseRegex = new RegExp(`${expenseKeywords}\\s+R?\\$\\s?(\\d+[\\.,]?\\d*)\\s+(?:em|de|com)\\s+([^#]+)(?:\\s+#(\\w+))?`, 'i')
  // Regex para receitas: "recebi 100 de freelance #trabalho"
  const incomeRegex = new RegExp(`${incomeKeywords}\\s+R?\\$\\s?(\\d+[\\.,]?\\d*)\\s+(?:em|de|com|como)\\s+([^#]+)(?:\\s+#(\\w+))?`, 'i')
  // Regex genérico: "50,50 lanche" (assume despesa)
  const genericRegex = /^(\d+[\.,]?\d*)\s+([^#]+)(?:\s+#(\w+))?$/i

  let match: RegExpMatchArray | null = null
  let type: 'income' | 'expense' | null = null

  match = text.match(expenseRegex)
  if (match) type = 'expense'

  if (!match) {
    match = text.match(incomeRegex)
    if (match) type = 'income'
  }

  if (!match) {
    match = text.match(genericRegex)
    if (match) type = 'expense' // Genérico assume despesa
  }

  if (match) {
    const amount = parseFloat(match[1].replace(',', '.')) * 100 // Armazenar em centavos
    const description = match[2].trim()
    const categoryName = match[3] ? match[3].trim() : null
    return { amount, description, categoryName, type: type! }
  }

  return null
}

// Vincula um usuário a uma licença usando o comando /start
async function linkUserWithLicense(supabase: SupabaseClient, telegramChatId: number, licenseCode: string): Promise<boolean> {
  // 1. Encontra a licença pelo código
  const { data: license, error: licenseError } = await supabase
    .from('licenses')
    .select('profile_id, status')
    .eq('code', licenseCode)
    .single()

  if (licenseError || !license || license.status !== 'active') {
    console.error('Licença não encontrada ou inativa:', licenseError)
    return false
  }

  // 2. Verifica se o chat já está vinculado a outra conta
  const { data: existingLink } = await supabase.from('telegram_integration').select('id').eq('telegram_chat_id', telegramChatId).single()
  if (existingLink) {
    await sendTelegramMessage(telegramChatId, '⚠️ Este chat do Telegram já está vinculado a uma conta.')
    return false
  }

  // 3. Cria o vínculo na tabela de integração
  const { error: updateError } = await supabase
    .from('telegram_integration')
    .insert({ profile_id: license.profile_id, telegram_chat_id: telegramChatId })

  if (updateError) {
    console.error('Erro ao vincular conta:', updateError)
    return false
  }

  return true
}

// Verifica se a licença do usuário é válida
async function checkLicense(supabase: SupabaseClient, profileId: string): Promise<boolean> {
    const { data, error } = await supabase
        .from('licenses')
        .select('status, type, expires_at')
        .eq('profile_id', profileId)
        .single()

    if (error || !data || data.status !== 'active') {
        return false
    }

    if (data.type === 'lifetime') return true

    if (data.expires_at) {
        return new Date() <= new Date(data.expires_at)
    }

    return false; // Se não for vitalícia e não tiver data de expiração, considera inválida
}


// Processa comandos como /saldo, /resumo, etc.
async function processCommand(supabase: SupabaseClient, command: string, profileId: string, chatId: number) {
  switch (command) {
    case '/saldo': {
      const { data, error } = await supabase.rpc('get_total_balance', { p_profile_id: profileId })
      if (error) throw error
      const formattedBalance = (data as number).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      await sendTelegramMessage(chatId, `💰 *Saldo Total:* ${formattedBalance}`)
      break
    }
    case '/resumo': {
      const today = new Date()
      const startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString()
      const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString()
      const { data, error } = await supabase.rpc('get_monthly_summary', { p_profile_id: profileId, p_start_date: startDate, p_end_date: endDate })
      if (error) throw error
      const summary = data[0]
      const formattedIncome = summary.total_income.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      const formattedExpenses = summary.total_expenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      const balance = summary.total_income - summary.total_expenses
      const formattedBalance = balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      await sendTelegramMessage(chatId, `📈 *Resumo do Mês*\n\n💚 Receitas: ${formattedIncome}\n❤️ Despesas: ${formattedExpenses}\n💰 Saldo: ${formattedBalance}`)
      break
    }
    default:
      await sendTelegramMessage(chatId, '❓ Comando não reconhecido.\n\n*Comandos disponíveis:*\n`/saldo` - Ver saldo total\n`/resumo` - Resumo de receitas e despesas do mês\n\nOu envie uma mensagem como:\n`gastei 50 em almoço`')
  }
}

// --- Função Principal do Webhook ---
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body: TelegramWebhookBody = await req.json()
    const { chat, text, from } = body.message

    if (!chat || !text) {
      return new Response('Payload inválido', { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // --- Lógica de Comandos e Vinculação ---
    if (text.startsWith('/start')) {
      const licenseCode = text.split(' ')[1]
      if (!licenseCode) {
        await sendTelegramMessage(chat.id, '❌ Código de licença não fornecido.\nUse: `/start SEU_CODIGO`')
        return new Response('OK', { status: 200, headers: corsHeaders })
      }
      const linked = await linkUserWithLicense(supabaseAdmin, chat.id, licenseCode)
      if (linked) {
        await sendTelegramMessage(chat.id, '✅ *Conta vinculada com sucesso!*\n\nAgora você pode registrar transações ou usar comandos como `/saldo` e `/resumo`.')
      } else {
        await sendTelegramMessage(chat.id, '❌ Código de licença inválido, expirado ou já em uso.')
      }
      return new Response('OK', { status: 200, headers: corsHeaders })
    }

    // --- Verificação de Perfil e Licença ---
    const { data: integrationData, error: integrationError } = await supabaseAdmin
      .from('telegram_integration')
      .select('profile_id')
      .eq('telegram_chat_id', chat.id)
      .single()

    if (integrationError || !integrationData) {
      await sendTelegramMessage(chat.id, '❌ Sua conta do Telegram não está vinculada.\nUse o comando `/start SEU_CODIGO` para começar.')
      throw new Error(`Usuário do Telegram não encontrado: ${chat.id}`)
    }
    const profileId = integrationData.profile_id

    const hasValidLicense = await checkLicense(supabaseAdmin, profileId)
    if (!hasValidLicense) {
        await sendTelegramMessage(chat.id, '❌ Sua licença é inválida ou expirou. Por favor, verifique no site do Gasto Certo.')
        return new Response('Licença inválida', { status: 403, headers: corsHeaders })
    }

    // --- Processamento de Comandos ou Transações ---
    if (text.startsWith('/')) {
      await processCommand(supabaseAdmin, text.split(' ')[0], profileId, chat.id)
      return new Response('Comando processado', { status: 200, headers: corsHeaders })
    }

    const transactionData = parseTransaction(text)
    if (!transactionData) {
      await sendTelegramMessage(chat.id, '🤖 Olá! Para registrar uma transação, envie uma mensagem como:\n\n`gastei 50 em almoço`\n`recebi 200 de um amigo`\n\nUse `#categoria` para categorizar.')
      return new Response('ok', { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // --- Lógica de Criação de Transação ---
    const { amount, description, categoryName, type } = transactionData

    const { data: accountData } = await supabaseAdmin.from('accounts').select('id').eq('profile_id', profileId).limit(1).single()
    if (!accountData) {
      await sendTelegramMessage(chat.id, '❌ Nenhuma conta bancária encontrada. Cadastre uma no site.')
      throw new Error(`Nenhuma conta encontrada para o perfil: ${profileId}`)
    }
    const accountId = accountData.id

    let categoryId = null
    if (categoryName) {
      const { data: categoryData } = await supabaseAdmin.from('categories').select('id').eq('profile_id', profileId).ilike('name', categoryName).single()
      if (categoryData) categoryId = categoryData.id
      else await sendTelegramMessage(chat.id, `⚠️ Categoria #${categoryName} não encontrada.`)
    }

    const { error: transactionError } = await supabaseAdmin
      .from('transactions')
      .insert({ profile_id: profileId, account_id: accountId, category_id: categoryId, amount, description, type, date: new Date().toISOString() })

    if (transactionError) {
      await sendTelegramMessage(chat.id, '❌ Ops! Erro ao registrar sua transação.')
      throw transactionError
    }

    const formattedAmount = (amount / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    const emoji = type === 'income' ? '💚' : '❤️'
    await sendTelegramMessage(chat.id, `${emoji} Transação de ${formattedAmount} (${description}) registrada!`)

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
