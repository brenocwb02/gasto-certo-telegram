import { serve } from "[https://deno.land/std@0.168.0/http/server.ts](https://deno.land/std@0.168.0/http/server.ts)";
import { createClient } from "[https://esm.sh/@supabase/supabase-js@2](https://esm.sh/@supabase/supabase-js@2)";
import { corsHeaders } from "../_shared/cors.ts";

// Helper para obter a data da última semana
const getLastWeekDates = () => {
  const today = new Date();
  const lastWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7);
  return {
    start: lastWeek.toISOString().split('T')[0],
    end: today.toISOString().split('T')[0]
  };
};

serve(async (_req) => {
  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 1. Buscar todos os usuários premium ativos
    const { data: licenses, error: licenseError } = await supabaseAdmin
      .from('licenses')
      .select('user_id')
      .eq('plano', 'premium')
      .eq('status', 'ativo');

    if (licenseError) throw licenseError;
    if (!licenses || licenses.length === 0) {
      return new Response(JSON.stringify({ message: "Nenhum usuário premium ativo encontrado." }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { start, end } = getLastWeekDates();
    const GOOGLE_AI_API_KEY = Deno.env.get('GOOGLE_AI_API_KEY');
    if (!GOOGLE_AI_API_KEY) throw new Error("GOOGLE_AI_API_KEY não configurada.");
    
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${GOOGLE_AI_API_KEY}`;

    // 2. Loop através de cada usuário premium
    for (const license of licenses) {
      const { user_id } = license;

      // 3. Buscar transações da última semana
      const { data: transactions, error: transactionsError } = await supabaseAdmin
        .from('transactions')
        .select('descricao, valor, categories(nome)')
        .eq('user_id', user_id)
        .eq('tipo', 'despesa')
        .gte('data_transacao', start)
        .lte('data_transacao', end);
      
      if (transactionsError) {
        console.error(`Erro ao buscar transações para o usuário ${user_id}:`, transactionsError);
        continue; // Pula para o próximo usuário
      }

      if (!transactions || transactions.length === 0) {
        continue; // Pula se não houver despesas
      }

      // 4. Chamar a IA para gerar o resumo
      const prompt = `Analise os seguintes dados de transações JSON da última semana: ${JSON.stringify(transactions)}. Gere um resumo amigável e conciso de uma frase para o usuário, destacando a categoria com maior gasto. Responda apenas com o texto do resumo. Exemplo: 'Nesta semana, seu maior gasto foi com Alimentação, totalizando R$150,00.'`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });

      if (!response.ok) {
        console.error(`Erro na API do Gemini para o usuário ${user_id}:`, await response.text());
        continue;
      }

      const result = await response.json();
      const message_content = result.candidates?.[0]?.content?.parts?.[0]?.text;

      if (message_content) {
        // 5. Agendar a notificação
        await supabaseAdmin.from('scheduled_notifications').insert({
          user_id,
          notification_type: 'resumo_semanal',
          message_content,
        });
      }
    }

    return new Response(JSON.stringify({ success: true, users_processed: licenses.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
