import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function for enhanced debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    logStep("Authenticating user with token");

    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) {
      logStep("Auth error - returning 401", { error: userError.message });
      return new Response(JSON.stringify({ subscribed: false, error: userError.message }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }
    const user = userData.user;
    if (!user?.email) {
      return new Response(JSON.stringify({ subscribed: false, error: "User not authenticated" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    if (customers.data.length === 0) {
      logStep("No customer found, updating unsubscribed state");
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });
    const hasActiveSub = subscriptions.data.length > 0;
    let productId = null;
    let productName = null;
    let subscriptionEnd = null;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      logStep("Active subscription found", { subscriptionId: subscription.id, endDate: subscriptionEnd });
      // Subscription tier is the product ID
      productId = subscription.items.data[0].price.product;

      // Fetch product name from Stripe
      const product = await stripe.products.retrieve(productId as string);
      productName = product.name;
      logStep("Determined subscription tier", { productId, productName });
    } else {
      logStep("No active subscription found for user. Checking Family Membership...");

      // CHECK FAMILY MEMBERSHIP FALLBACK
      // 1. Check if user is a member of any active family group
      const { data: memberData, error: memberError } = await supabaseClient
        .from('family_members')
        .select('group_id, status')
        .eq('member_id', user.id)
        .eq('status', 'active') // Only checking active members
        .maybeSingle();

      if (memberData && !memberError) {
        logStep("User is a family member", { groupId: memberData.group_id });

        // 2. Get the owner of the group
        const { data: groupData, error: groupError } = await supabaseClient
          .from('family_groups')
          .select('owner_id')
          .eq('id', memberData.group_id)
          .maybeSingle();

        if (groupData && !groupError) {
          logStep("Found family group owner", { ownerId: groupData.owner_id });

          // 3. Get owner's email to check Stripe
          const { data: ownerUserResponse, error: ownerUserError } = await supabaseClient.auth.admin.getUserById(groupData.owner_id);

          if (ownerUserResponse?.user?.email && !ownerUserError) {
            const ownerEmail = ownerUserResponse.user.email;
            logStep("Checking Owner Subscription", { ownerEmail });

            // 4. Check Stripe for Owner
            const ownerCustomers = await stripe.customers.list({ email: ownerEmail, limit: 1 });

            if (ownerCustomers.data.length > 0) {
              const ownerCustomerId = ownerCustomers.data[0].id;
              const ownerSubscriptions = await stripe.subscriptions.list({
                customer: ownerCustomerId,
                status: "active",
                limit: 1,
              });

              if (ownerSubscriptions.data.length > 0) {
                const ownerSub = ownerSubscriptions.data[0];
                const ownerProductId = ownerSub.items.data[0].price.product;
                const ownerProduct = await stripe.products.retrieve(ownerProductId as string);

                // 5. Verify if it is indeed a Family Plan
                // We check if the product name contains "Familia" or "Admin" or similar keywords, or acts as premium generally.
                // Ideally, we restrict this only if the owner has a "Family" plan.
                // Assuming "Family" is in the name.
                const isFamilyPlan = ownerProduct.name.toLowerCase().includes('família') || ownerProduct.name.toLowerCase().includes('familia');

                if (isFamilyPlan) {
                  hasActiveSub = true;
                  subscriptionEnd = new Date(ownerSub.current_period_end * 1000).toISOString();
                  productId = ownerProductId;
                  productName = ownerProduct.name + " (Membro)";
                  logStep("Valid Family Plan found via Owner", { productName });
                } else {
                  logStep("Owner has subscription but NOT a Family Plan", { productName: ownerProduct.name });
                }
              }
            }
          } else {
            logStep("Could not fetch owner user details or email missing");
          }
        }
      } else {
        logStep("User is not in any active family group");
      }
    }

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      product_id: productId,
      product_name: productName,
      subscription_end: subscriptionEnd
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    const error = err as Error;
    const errorMessage = error.message;
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});