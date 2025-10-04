import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization')!;
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Usuário não autenticado');
    }

    console.log('[CALCULATE-NET-WORTH] Calculando patrimônio para usuário:', user.id);

    // 1. Buscar saldo de todas as contas ativas
    const { data: accounts, error: accountsError } = await supabase
      .from('accounts')
      .select('saldo_atual, tipo')
      .eq('user_id', user.id)
      .eq('ativo', true);

    if (accountsError) throw accountsError;

    const cashBalance = accounts?.reduce((sum, acc) => sum + Number(acc.saldo_atual), 0) || 0;
    console.log('[CALCULATE-NET-WORTH] Saldo em contas:', cashBalance);

    // 2. Buscar valor dos investimentos
    const { data: investments, error: investmentsError } = await supabase
      .from('investments')
      .select('quantity, current_price, average_price')
      .eq('user_id', user.id);

    if (investmentsError) throw investmentsError;

    const investmentsValue = investments?.reduce((sum, inv) => {
      const price = Number(inv.current_price) || Number(inv.average_price);
      return sum + (Number(inv.quantity) * price);
    }, 0) || 0;
    console.log('[CALCULATE-NET-WORTH] Valor em investimentos:', investmentsValue);

    // 3. Calcular dívidas (cartões de crédito + empréstimos)
    const { data: debts, error: debtsError } = await supabase
      .from('accounts')
      .select('saldo_atual, monthly_payment, remaining_installments')
      .eq('user_id', user.id)
      .not('debt_type', 'is', null);

    if (debtsError) throw debtsError;

    const totalDebts = debts?.reduce((sum, debt) => {
      // Para dívidas parceladas, considera o saldo devedor total
      if (debt.monthly_payment && debt.remaining_installments) {
        return sum + (Number(debt.monthly_payment) * Number(debt.remaining_installments));
      }
      // Para cartões, considera saldo negativo
      return sum + Math.abs(Math.min(0, Number(debt.saldo_atual)));
    }, 0) || 0;
    console.log('[CALCULATE-NET-WORTH] Total de dívidas:', totalDebts);

    // 4. Calcular patrimônio líquido
    const netWorth = cashBalance + investmentsValue - totalDebts;

    // 5. Buscar patrimônio do mês anterior para calcular variação
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const { data: lastMonthTransactions } = await supabase
      .from('transactions')
      .select('valor, tipo')
      .eq('user_id', user.id)
      .gte('data_transacao', lastMonth.toISOString().split('T')[0])
      .lt('data_transacao', new Date().toISOString().split('T')[0]);

    const monthlyChange = lastMonthTransactions?.reduce((sum, t) => {
      return sum + (t.tipo === 'receita' ? Number(t.valor) : -Number(t.valor));
    }, 0) || 0;

    const response = {
      netWorth: Number(netWorth.toFixed(2)),
      breakdown: {
        cash: Number(cashBalance.toFixed(2)),
        investments: Number(investmentsValue.toFixed(2)),
        debts: Number(totalDebts.toFixed(2))
      },
      monthlyChange: Number(monthlyChange.toFixed(2)),
      calculatedAt: new Date().toISOString()
    };

    console.log('[CALCULATE-NET-WORTH] Resultado:', response);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[CALCULATE-NET-WORTH] Erro:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
