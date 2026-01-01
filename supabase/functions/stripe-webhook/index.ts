import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

const cryptoProvider = Stripe.createSubtleCryptoProvider();

serve(async (req) => {
  const signature = req.headers.get('Stripe-Signature');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

  if (!signature || !webhookSecret) {
    return new Response('Missing signature or webhook secret', { status: 400 });
  }

  try {
    const body = await req.text();
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
      undefined,
      cryptoProvider
    );

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log(`Processing event: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const planId = session.metadata?.planId;

        if (!userId || !planId) {
          console.error('Missing metadata in checkout session');
          break;
        }

        // Map planId to license type
        const planMap: Record<string, string> = {
          'individual': 'premium',
          'familia': 'familia',
          'familia_plus': 'familia_plus'
        };

        const licenseType = planMap[planId] || 'premium';

        // Create or update license
        const { error: licenseError } = await supabaseClient
          .from('licenses')
          .upsert({
            user_id: userId,
            plano: licenseType,
            status: 'ativo',
            tipo: 'mensal',
            data_ativacao: new Date().toISOString(),
            data_expiracao: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
          });

        if (licenseError) {
          console.error('Error creating license:', licenseError);
        } else {
          console.log(` License activated for user ${userId}`);
        }

        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;

        if (!userId) {
          console.error('Missing userId in subscription metadata');
          break;
        }

        // Update license based on subscription status
        let status = 'ativo';
        if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
          status = 'cancelado';
        }

        const { error } = await supabaseClient
          .from('licenses')
          .update({
            status: status,
            data_expiracao: new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);

        if (error) {
          console.error('Error updating license:', error);
        }

        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;

        // Cancel license
        const { error } = await supabaseClient
          .from('licenses')
          .update({
            status: 'cancelado',
          })
          .eq('stripe_subscription_id', subscription.id);

        if (error) {
          console.error('Error canceling license:', error);
        }

        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;

        if (invoice.subscription) {
          // Mark license as suspended
          const { error } = await supabaseClient
            .from('licenses')
            .update({
              status: 'expirado',
            })
            .eq('stripe_subscription_id', invoice.subscription as string);

          if (error) {
            console.error('Error suspending license:', error);
          }
        }

        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Webhook error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
