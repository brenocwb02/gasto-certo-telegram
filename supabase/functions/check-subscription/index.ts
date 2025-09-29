import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Authenticate user using the Authorization header
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    
    // Create a Supabase client with the user's auth context
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );
    
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error("User not found");

    // 2. Check internal licenses table as the primary source of truth
    const { data: license, error: licenseError } = await supabaseClient
      .from('licenses')
      .select('plano, status, data_expiracao')
      .eq('user_id', user.id)
      .single();

    if (licenseError) {
      console.error("License fetch error for user:", user.id, licenseError);
      // If no license is found for any reason, default to free plan.
      return new Response(JSON.stringify({ subscribed: false, product_id: 'gratuito' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const isPremium = license.plano === 'premium' && license.status === 'ativo';
    const productId = isPremium ? 'prod_T85pcP4M0yhBaG' : 'gratuito'; // Use a static ID for premium

    // 3. Return status based on our internal database
    return new Response(JSON.stringify({
      subscribed: isPremium,
      product_id: productId,
      subscription_end: license.data_expiracao
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

