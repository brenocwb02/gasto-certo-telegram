import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CategoryData {
  id: string;
  nome: string;
  tipo: string;
  parent_id: string | null;
  keywords: string[] | null;
  parent: { nome: string } | { nome: string }[] | null;
}

interface AccountData {
  id: string;
  nome: string;
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

async function callGoogleAi(prompt: string): Promise<any> {
  const apiKey = Deno.env.get('GOOGLE_AI_API_KEY');
  if (!apiKey) {
    throw new Error('GOOGLE_AI_API_KEY not configured');
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 512
        }
      })
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error('Google AI error response:', error);
    throw new Error(`Failed to call Google AI: ${response.status} - ${error.substring(0, 200)}`);
  }

  const data = await response.json();
  const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

  // Clean and parse JSON
  const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No valid JSON in response');
  }

  return JSON.parse(jsonMatch[0]);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { text, userId } = await req.json();

    if (!text || !userId) {
      return new Response(
        JSON.stringify({ validation_errors: ['Texto e userId são obrigatórios'] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // 🛡️ SECURITY: Log mascarado para proteção de dados sensíveis
    console.log(`[NLP] Processing for user ***${userId.slice(-4)}`);

    // Fetch user accounts
    const { data: accounts, error: accountsError } = await supabase
      .from('accounts')
      .select('id, nome')
      .eq('user_id', userId)
      .eq('ativo', true);

    // Fetch user categories with parent info
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select(`
        id,
        nome,
        tipo,
        parent_id,
        keywords,
        parent:categories!parent_id(nome)
      `)
      .eq('user_id', userId);

    if (accountsError || categoriesError) {
      throw new Error('Erro ao buscar dados do usuário.');
    }

    const accountsList = (accounts as AccountData[] || []).map(a => a.nome).join(', ');

    // Create categories list including hierarchy and keywords
    const categoriesList = (categories as CategoryData[] || [])
      .map(c => {
        const keywordsStr = c.keywords && c.keywords.length > 0
          ? ` (keywords: ${c.keywords.join(', ')})`
          : '';

        // Handle parent which could be an object or array from supabase join
        const parentData = c.parent as unknown;
        let parentName: string | null = null;

        if (parentData) {
          if (Array.isArray(parentData) && parentData.length > 0) {
            parentName = (parentData[0] as { nome: string }).nome;
          } else if (typeof parentData === 'object' && 'nome' in (parentData as object)) {
            parentName = (parentData as { nome: string }).nome;
          }
        }

        if (parentName) {
          return `${parentName} > ${c.nome}${keywordsStr}`;
        }
        return `${c.nome}${keywordsStr}`;
      })
      .join('\n');

    // 🛡️ SECURITY: Sanitizar input antes de enviar para IA
    const sanitizedText = sanitizeUserInput(text);

    // Build improved AI prompt
    const prompt = `Você é um assistente financeiro que extrai informações de transações.

Analise esta frase: "${sanitizedText}"

Contas disponíveis: ${accountsList}

Categorias disponíveis (com palavras-chave para ajudar na identificação):
${categoriesList}

Regras OBRIGATÓRIAS:
1. Tipo: identifique se é 'receita', 'despesa' ou 'transferencia'
2. Valor: extraia APENAS o número (ex: 50, 25.50)
3. Descrição: Extraia o NOME do estabelecimento, serviço ou produto. Seja específico. Elimine verbos ("Gastei", "Fui"). Ex: "Almoço no Tche Costela" -> "Almoço Tche Costela". "Mercado Muffato" -> "Mercado Muffato". NÃO generalize se houver nome próprio.
4. Conta: escolha UMA conta da lista de contas disponíveis. Se não mencionar conta, use a primeira da lista
5. Categoria: Retorne o nome EXATO da lista, preservando a hierarquia "Pai > Filho" se houver.
6. validation_errors: [] (vazio se tudo ok)

Retorne APENAS o JSON (sem markdown, sem explicações):
{
  "tipo": "despesa",
  "valor": 50.00,
  "descricao": "Compra no mercado",
  "conta": "Cartão Nubank",
  "categoria": "Alimentação > Supermercado",
  "conta_destino": null,
  "validation_errors": []
}`;

    const extractedData = await callGoogleAi(prompt);

    if (extractedData.validation_errors && extractedData.validation_errors.length > 0) {
      return new Response(JSON.stringify(extractedData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Map names to IDs
    const account = (accounts as AccountData[] || []).find(
      a => a.nome.toLowerCase() === extractedData.conta?.toLowerCase()
    );

    // Smarter category matching logic
    let matchedCategory: CategoryData | null = null;
    if (extractedData.categoria) {
      const catNameInfo = extractedData.categoria.toLowerCase();

      // 1. Try exact match of returned string
      matchedCategory = (categories as CategoryData[] || []).find(c => {
        // Build hierarchical name from DB category to compare
        const parentData = c.parent as unknown;
        let parentName: string | null = null;

        if (parentData) {
          if (Array.isArray(parentData) && parentData.length > 0) {
            parentName = (parentData[0] as { nome: string }).nome;
          } else if (typeof parentData === 'object' && 'nome' in (parentData as object)) {
            parentName = (parentData as { nome: string }).nome;
          }
        }

        const hierarchicalName = parentName ? `${parentName} > ${c.nome}` : c.nome;
        return hierarchicalName.toLowerCase() === catNameInfo || c.nome.toLowerCase() === catNameInfo;
      }) || null;

      // 2. If failed and has separator, try by last name (child)
      if (!matchedCategory && catNameInfo.includes('>')) {
        const parts = catNameInfo.split('>');
        const childName = parts[parts.length - 1].trim();
        matchedCategory = (categories as CategoryData[] || []).find(
          c => c.nome.toLowerCase() === childName
        ) || null;
      }
    }

    const destinationAccount = (accounts as AccountData[] || []).find(
      a => a.nome.toLowerCase() === extractedData.conta_destino?.toLowerCase()
    );

    // Rebuild category name in official "Parent > Child" format for correct display
    let finalCategoryName = extractedData.categoria;
    if (matchedCategory) {
      const parentData = matchedCategory.parent as unknown;
      let parentName: string | null = null;

      if (parentData) {
        if (Array.isArray(parentData) && parentData.length > 0) {
          parentName = (parentData[0] as { nome: string }).nome;
        } else if (typeof parentData === 'object' && 'nome' in (parentData as object)) {
          parentName = (parentData as { nome: string }).nome;
        }
      }

      finalCategoryName = parentName
        ? `${parentName} > ${matchedCategory.nome}`
        : matchedCategory.nome;
    }

    const responseData = {
      ...extractedData,
      categoria: finalCategoryName,
      conta_origem_id: account?.id ?? null,
      categoria_id: matchedCategory?.id ?? null,
      conta_destino_id: destinationAccount?.id ?? null,
    };

    console.log('[NLP] Response:', responseData);

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('[NLP] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({
        validation_errors: [`Erro ao processar: ${errorMessage}`]
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
