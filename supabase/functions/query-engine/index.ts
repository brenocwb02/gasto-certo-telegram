import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface QueryFilters {
  type?: 'receita' | 'despesa' | 'transferencia';
  date_range?: {
    start: string;
    end: string;
  };
  description_contains?: string;
  category?: string;
  account?: string;
  min_amount?: number;
  max_amount?: number;
  aggregation?: 'sum' | 'count' | 'average' | 'list';
  group_by?: 'category' | 'account' | 'month' | 'day';
}

async function callGeminiAI(question: string, userContext: any): Promise<QueryFilters> {
  const apiKey = Deno.env.get('GOOGLE_AI_API_KEY');
  
  const prompt = `Você é um assistente financeiro que converte perguntas em filtros estruturados.

Contexto do usuário:
- Contas: ${userContext.accounts.join(', ')}
- Categorias: ${userContext.categories.join(', ')}

Pergunta do usuário: "${question}"

Retorne APENAS um JSON válido com os filtros necessários para responder a pergunta.

Estrutura do JSON:
{
  "type": "receita" | "despesa" | "transferencia" (opcional),
  "date_range": { "start": "YYYY-MM-DD", "end": "YYYY-MM-DD" } (opcional),
  "description_contains": "texto" (opcional),
  "category": "nome da categoria" (opcional),
  "account": "nome da conta" (opcional),
  "min_amount": número (opcional),
  "max_amount": número (opcional),
  "aggregation": "sum" | "count" | "average" | "list" (padrão: sum),
  "group_by": "category" | "account" | "month" | "day" (opcional)
}

Regras:
- Use date_range para períodos. Se mencionar "setembro", use início e fim do mês.
- Se perguntar "quanto gastei", use type: "despesa" e aggregation: "sum"
- Se perguntar "quantas vezes", use aggregation: "count"
- Se mencionar nome de categoria/conta, use category ou account
- Se mencionar valores, use min_amount ou max_amount
- Para "top gastos" ou "maiores", use group_by apropriado

Exemplos:
"quanto gastei com iFood em setembro?" → {"type":"despesa","description_contains":"ifood","date_range":{"start":"2025-09-01","end":"2025-09-30"},"aggregation":"sum"}
"minhas receitas de freelance" → {"type":"receita","category":"freelance","aggregation":"list"}
"quantas vezes gastei mais de 100 reais?" → {"type":"despesa","min_amount":100,"aggregation":"count"}`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 1024,
        }
      })
    }
  );

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  
  // Extrair JSON do texto
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Não foi possível interpretar a pergunta');
  }
  
  return JSON.parse(jsonMatch[0]);
}

async function executeQuery(supabase: any, userId: string, filters: QueryFilters) {
  let query = supabase
    .from('transactions')
    .select(`
      *,
      category:categories(nome, cor),
      account_origem:accounts!transactions_conta_origem_id_fkey(nome),
      account_destino:accounts!transactions_conta_destino_id_fkey(nome)
    `)
    .eq('user_id', userId);

  // Aplicar filtros
  if (filters.type) {
    query = query.eq('tipo', filters.type);
  }

  if (filters.date_range) {
    query = query.gte('data_transacao', filters.date_range.start)
                 .lte('data_transacao', filters.date_range.end);
  }

  if (filters.description_contains) {
    query = query.ilike('descricao', `%${filters.description_contains}%`);
  }

  if (filters.min_amount) {
    query = query.gte('valor', filters.min_amount);
  }

  if (filters.max_amount) {
    query = query.lte('valor', filters.max_amount);
  }

  const { data, error } = await query;

  if (error) throw error;

  // Aplicar filtros pós-query
  let results = data || [];

  if (filters.category) {
    results = results.filter((t: any) => 
      t.category?.nome?.toLowerCase().includes(filters.category!.toLowerCase())
    );
  }

  if (filters.account) {
    results = results.filter((t: any) => 
      t.account_origem?.nome?.toLowerCase().includes(filters.account!.toLowerCase()) ||
      t.account_destino?.nome?.toLowerCase().includes(filters.account!.toLowerCase())
    );
  }

  return results;
}

function formatResults(results: any[], filters: QueryFilters): string {
  if (results.length === 0) {
    return "🔍 Não encontrei nenhuma transação com esses critérios.";
  }

  const aggregation = filters.aggregation || 'sum';

  if (aggregation === 'sum') {
    const total = results.reduce((sum, t) => sum + parseFloat(t.valor), 0);
    return `💰 Total: R$ ${total.toFixed(2)}\n📊 ${results.length} transações encontradas`;
  }

  if (aggregation === 'count') {
    return `📊 ${results.length} transações encontradas`;
  }

  if (aggregation === 'average') {
    const avg = results.reduce((sum, t) => sum + parseFloat(t.valor), 0) / results.length;
    return `📊 Média: R$ ${avg.toFixed(2)}\n(baseado em ${results.length} transações)`;
  }

  if (aggregation === 'list') {
    const list = results.slice(0, 10).map((t, i) => {
      const date = new Date(t.data_transacao).toLocaleDateString('pt-BR');
      return `${i + 1}. ${t.descricao} - R$ ${parseFloat(t.valor).toFixed(2)} (${date})`;
    }).join('\n');
    
    const more = results.length > 10 ? `\n\n... e mais ${results.length - 10} transações` : '';
    return `📋 Transações encontradas:\n\n${list}${more}`;
  }

  if (filters.group_by === 'category') {
    const grouped = results.reduce((acc, t) => {
      const cat = t.category?.nome || 'Sem categoria';
      acc[cat] = (acc[cat] || 0) + parseFloat(t.valor);
      return acc;
    }, {} as Record<string, number>);

    const sorted = Object.entries(grouped)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);

    const list = sorted.map(([cat, val], i) => 
      `${i + 1}. ${cat}: R$ ${val.toFixed(2)}`
    ).join('\n');

    return `📊 Gastos por categoria:\n\n${list}`;
  }

  // Default: listar
  return formatResults(results, { ...filters, aggregation: 'list' });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question, userId } = await req.json();

    if (!question || !userId) {
      throw new Error('Pergunta e userId são obrigatórios');
    }

    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar contexto do usuário
    const [accountsData, categoriesData] = await Promise.all([
      supabase.from('accounts').select('nome').eq('user_id', userId),
      supabase.from('categories').select('nome').eq('user_id', userId)
    ]);

    const userContext = {
      accounts: accountsData.data?.map((a: any) => a.nome) || [],
      categories: categoriesData.data?.map((c: any) => c.nome) || []
    };

    console.log('Processando pergunta:', question);

    // Interpretar pergunta com IA
    const filters = await callGeminiAI(question, userContext);
    console.log('Filtros gerados:', JSON.stringify(filters));

    // Executar query
    const results = await executeQuery(supabase, userId, filters);
    console.log('Resultados encontrados:', results.length);

    // Formatar resposta
    const answer = formatResults(results, filters);

    return new Response(
      JSON.stringify({ answer, resultsCount: results.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro no query-engine:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        answer: '❌ Desculpe, não consegui entender sua pergunta. Tente reformular ou seja mais específico.'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
