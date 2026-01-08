import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const today = new Date()
        const currentDay = today.getDate()

        // 1. Get all credit card accounts closing/due today?
        // User requested: "No dia do vencimento... manda msg"
        // So check: dia_vencimento === currentDay

        // We need to fetch accounts that are credit cards and have due date today
        const { data: accounts, error: accError } = await supabase
            .from('accounts')
            .select('id, nome, user_id, saldo_atual, dia_vencimento')
            .eq('tipo', 'cartao')
            .eq('dia_vencimento', currentDay)

        if (accError) throw accError

        const results = {
            processed: 0,
            notifications: 0,
            details: [] as string[]
        }

        if (accounts && accounts.length > 0) {
            // Get profiles for notifications
            const userIds = [...new Set(accounts.map(a => a.user_id))]
            const { data: profiles } = await supabase
                .from('profiles')
                .select('user_id, telegram_chat_id, nome')
                .in('user_id', userIds)

            const profilesMap = new Map(profiles?.map(p => [p.user_id, p]))

            for (const account of accounts) {
                // Only notify if balance is negative (invoice due)
                // Note: positive balance on CC means "credit", negative means "spent".
                if (Number(account.saldo_atual) < 0) {
                    const profile = profilesMap.get(account.user_id)

                    if (profile?.telegram_chat_id) {
                        const amount = Math.abs(Number(account.saldo_atual))

                        const message = `💳 *Fatura Fechada / Vencimento*\n\n` +
                            `📌 *${account.nome}*\n` +
                            `💰 Valor Fatura: R$ ${amount.toFixed(2)}\n\n` +
                            `A fatura vence hoje! Use o comando /pagar para registrar o pagamento ou acesse o app.`

                        await sendTelegramMessage(profile.telegram_chat_id, message)

                        results.notifications++
                        results.details.push(`Sent to ${profile.nome} for ${account.nome}`)
                    }
                }
                results.processed++
            }
        }

        return new Response(
            JSON.stringify({ success: true, results }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})

async function sendTelegramMessage(chatId: number, message: string) {
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN')
    if (!botToken) return

    try {
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'Markdown'
            })
        })
    } catch (e) {
        console.error('Telegram send error:', e)
    }
}
