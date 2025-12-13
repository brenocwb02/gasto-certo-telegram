import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface QueryFilters {
  date_start?: string;
  date_end?: string;
  tipo?: 'receita' | 'despesa' | 'transferencia';
  category?: string;
  description_contains?: string;
  account?: string;
  aggregation?: 'sum' | 'count' | 'avg' | 'list';
  group_by?: 'category' | 'account' | 'month';
  limit?: number;
}

interface UserContext {
  accounts: string[];
  categories: string[];
}

// 🛡️ SECURITY: Sanitizar input do usuário para prevenir Prompt Injection
function sanitizeUserInput(input: string): string {
  return input
    .replace(/```/g, '')           // Remove blocos de código
    .replace(/\n/g, ' ')           // Remove quebras de linha
    .replace(/[{}[\]]/g, '')       // Remove caracteres JSON
    .replace(/ignore|previous|instructions|system|prompt/gi, '') // Remove termos de ataque
    .trim()
    .slice(0, 500);                // Limita tamanho
}

async function callGeminiAI(question: string, context: UserContext): Promise<QueryFilters> {
  const apiKey = Deno.env.get('GOOGLE_AI_API_KEY');
  if (!apiKey) throw new Error('GOOGLE_AI_API_KEY not configured');

  const today = new Date().toISOString().split('T')[0];

  const prompt = `Você é um assistente que interpreta perguntas sobre finanças pessoais.

Data de hoje: ${today}

Contas do usuário: ${context.accounts.join(', ')}
Categorias do usuário: ${context.categories.join(', ')}

Pergunta: "${question}"

Retorne APENAS um JSON com os filtros para a query:
{
  "date_start": "2024-01-01",
  "date_end": "2024-12-31", 
  "tipo": "despesa",
  "category": "Alimentação",
  "description_contains": "mercado",
  "account": "Nubank",
  "aggregation": "sum",
  "group_by": "category",
  "limit": 10
}

Regras:
- date_start/date_end: formato YYYY-MM-DD
- tipo: "receita", "despesa" ou "transferencia" (null se não especificado)
- category: nome da categoria (null se não especificado)
- aggregation: "sum" para totais, "count" para quantidade, "list" para listar
- group_by: "category", "account" ou "month" (null se não agrupar)
- limit: número máximo de resultados (padrão 50)

Para "quanto gastei" use aggregation="sum" e tipo="despesa"
Para "quantas transações" use aggregation="count"
Para "listar" ou "mostrar" use aggregation="list"
Para "por categoria" use group_by="category"
Para "este mês" calcule as datas do mês atual baseado em ${today}

Retorne APENAS o JSON, sem explicações.`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 256 }
      })
    }
  );

  if (!response.ok) throw new Error('Failed to call Gemini AI');

  const data = await response.json();
  const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

  const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No valid JSON in AI response');

  return JSON.parse(jsonMatch[0]);
}

async function executeQuery(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  filters: QueryFilters
): Promise<any[]> {
  let query = supabase
    .from('transactions')
    .select(`
      id,
      descricao,
      valor,
      tipo,
      data_transacao,
      categoria_id,
      category:categories(nome),
      account:accounts!conta_origem_id(nome)
    `)
    .eq('user_id', userId);

  if (filters.date_start) {
    query = query.gte('data_transacao', filters.date_start);
  }

  if (filters.date_end) {
    query = query.lte('data_transacao', filters.date_end);
  }

  if (filters.tipo) {
    query = query.eq('tipo', filters.tipo);
  }

  if (filters.description_contains) {
    query = query.ilike('descricao', `%${filters.description_contains}%`);
  }

  query = query.order('data_transacao', { ascending: false });

  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) throw error;

  // Filter by category name if specified
  let results = data || [];
  if (filters.category) {
    const catLower = filters.category.toLowerCase();
    results = results.filter((t: { category?: { nome: string } | null }) =>
      t.category?.nome?.toLowerCase().includes(catLower)
    );
  }

  return results;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

function formatResults(results: any[], filters: QueryFilters): string {
  if (results.length === 0) {
    return '📊 Nenhuma transação encontrada para os critérios especificados.';
  }

  if (filters.aggregation === 'sum') {
    const total = results.reduce((sum, t) => sum + parseFloat(t.valor), 0);
    return `💰 Total: ${formatCurrency(total)} (${results.length} transações)`;
  }

  if (filters.aggregation === 'count') {
    return `📊 Quantidade: ${results.length} transações`;
  }

  if (filters.aggregation === 'list' || !filters.aggregation) {
    const list = results.slice(0, 10).map((t: {
      tipo: string;
      descricao: string;
      valor: number;
      data_transacao: string;
    }) => {
      const emoji = t.tipo === 'receita' ? '💰' : '💸';
      const date = new Date(t.data_transacao).toLocaleDateString('pt-BR');
      return `${emoji} ${t.descricao}: ${formatCurrency(t.valor)} (${date})`;
    }).join('\n');

    const more = results.length > 10 ? `\n\n... e mais ${results.length - 10} transações` : '';
    return `📋 Transações encontradas:\n\n${list}${more}`;
  }

  if (filters.group_by === 'category') {
    const grouped = results.reduce((acc: Record<string, number>, t: {
      valor: string | number;
      category?: { nome: string } | null;
    }) => {
      const cat = t.category?.nome || 'Sem categoria';
      acc[cat] = (acc[cat] || 0) + parseFloat(String(t.valor));
      return acc;
    }, {} as Record<string, number>);

    const sorted = Object.entries(grouped)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 10);

    const list = sorted.map(([cat, val], i) =>
      `${i + 1}. ${cat}: ${formatCurrency(val as number)}`
    ).join('\n');

    return `📊 Gastos por categoria:\n\n${list}`;
  }

  // Default: list
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

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch user context
    const [accountsData, categoriesData] = await Promise.all([
      supabase.from('accounts').select('nome').eq('user_id', userId),
      supabase.from('categories').select('nome').eq('user_id', userId)
    ]);

    const userContext: UserContext = {
      accounts: accountsData.data?.map((a: { nome: string }) => a.nome) || [],
      categories: categoriesData.data?.map((c: { nome: string }) => c.nome) || []
    };

    console.log('Processing question:', question.slice(0, 50) + '...');

    // 🛡️ SECURITY: Sanitizar input antes de enviar para IA
    const sanitizedQuestion = sanitizeUserInput(question);

    // Interpret question with AI
    const filters = await callGeminiAI(sanitizedQuestion, userContext);
    console.log('Generated filters:', JSON.stringify(filters));

    // Execute query
    const results = await executeQuery(supabase, userId, filters);
    console.log('Results found:', results.length);

    // Format response
    const answer = formatResults(results, filters);

    return new Response(
      JSON.stringify({ answer, resultsCount: results.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in query-engine:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({
        error: errorMessage,
        answer: '❌ Desculpe, não consegui entender sua pergunta. Tente reformular ou seja mais específico.'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
