import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NetWorthData {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  assetsByType: Record<string, number>;
  liabilitiesByType: Record<string, number>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header required');
    }

    // Get user from token
    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      throw new Error('User not authenticated');
    }

    const userId = userData.user.id;

    // Fetch all accounts
    const { data: accounts, error: accountsError } = await supabase
      .from('accounts')
      .select('id, nome, tipo, saldo_atual, ativo')
      .eq('user_id', userId)
      .eq('ativo', true);

    if (accountsError) throw accountsError;

    // Calculate assets and liabilities
    const assetsByType: Record<string, number> = {};
    const liabilitiesByType: Record<string, number> = {};
    let totalAssets = 0;
    let totalLiabilities = 0;

    for (const account of accounts || []) {
      const balance = Number(account.saldo_atual) || 0;
      
      if (account.tipo === 'cartao' || account.tipo === 'emprestimo') {
        // Liabilities (negative balances)
        const liability = Math.abs(balance);
        liabilitiesByType[account.tipo] = (liabilitiesByType[account.tipo] || 0) + liability;
        totalLiabilities += liability;
      } else {
        // Assets (positive balances)
        if (balance > 0) {
          assetsByType[account.tipo] = (assetsByType[account.tipo] || 0) + balance;
          totalAssets += balance;
        } else {
          // Negative balance in asset account counts as liability
          const liability = Math.abs(balance);
          liabilitiesByType[account.tipo] = (liabilitiesByType[account.tipo] || 0) + liability;
          totalLiabilities += liability;
        }
      }
    }

    // Fetch investments
    const { data: investments, error: investmentsError } = await supabase
      .from('investments')
      .select('ticker, quantity, current_price, average_price, asset_type')
      .eq('user_id', userId);

    if (!investmentsError && investments) {
      for (const inv of investments) {
        const quantity = Number(inv.quantity) || 0;
        const price = Number(inv.current_price) || Number(inv.average_price) || 0;
        const value = quantity * price;
        
        if (value > 0) {
          assetsByType['investimentos'] = (assetsByType['investimentos'] || 0) + value;
          totalAssets += value;
        }
      }
    }

    const response: NetWorthData = {
      totalAssets,
      totalLiabilities,
      netWorth: totalAssets - totalLiabilities,
      assetsByType,
      liabilitiesByType
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[CALCULATE-NET-WORTH] Erro:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
