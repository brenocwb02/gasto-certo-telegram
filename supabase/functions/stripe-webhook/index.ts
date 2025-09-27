import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@12.12.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  apiVersion: '2022-11-15',
  httpClient: Stripe.createFetchHttpClient(),
})

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

serve(async (req) => {
  const signature = req.headers.get('Stripe-Signature')
  const body = await req.text()

  try {
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature!,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!
    )

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object
        const userId = subscription.metadata.user_id

        await supabaseAdmin
          .from('licenses')
          .update({
            status: 'ativo',
            plano: 'premium',
            data_expiracao: new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .eq('user_id', userId)

        await supabaseAdmin
          .from('profiles')
          .update({ stripe_subscription_id: subscription.id })
          .eq('user_id', userId)
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        const userId = subscription.metadata.user_id
        await supabaseAdmin
          .from('licenses')
          .update({ status: 'cancelado', plano: 'gratuito' })
          .eq('user_id', userId)
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 })
  } catch (err) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }
})
