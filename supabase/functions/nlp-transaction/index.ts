import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// Função para chamar a API do Google Gemini e processar o texto
async function processTransactionWithGemini(text: string, userId: string, supabase: SupabaseClient) {
  console.log(`Processing with Gemini: "${text}" for user ${userId}`)

  // 1. Obter a Chave da API do Google AI dos segredos do Supabase
  const GOOGLE_AI_API_KEY = Deno.env.get('GOOGLE_AI_API_KEY');
  if (!GOOGLE_AI_API_KEY) {
    console.error('GOOGLE_AI_API_KEY is not set in Supabase secrets.');
    return { validation_errors: ['A integração com a IA não está configurada corretamente.'] };
  }

  // 2. Obter contas e categorias do usuário para fornecer contexto ao modelo
  const { data: userAccounts, error: accountsError } = await supabase
    .from('accounts')
    .select('id, nome, tipo')
    .eq('user_id', userId)
    .eq('ativo', true);

  const { data: userCategories, error: categoriesError } = await supabase
    .from('categories')
    .select('id, nome, tipo, keywords') // Incluindo keywords para a lógica de auto-aprendizado
    .eq('user_id', userId);

  if (accountsError || categoriesError) {
    console.error('Error fetching user data:', accountsError || categoriesError);
    return { validation_errors: ['Não foi possível buscar os dados da sua conta para processar a transação.'] };
  }

  // 3. Definir o esquema de saída JSON que esperamos da IA
  const transactionSchema = {
    type: "OBJECT",
    properties: {
      "valor": { "type": "NUMBER", "description": "O valor numérico da transação." },
      "descricao": { "type": "STRING", "description": "Uma breve descrição da transação. Ex: 'Almoço com amigos'." },
      "tipo": { "type": "STRING", "enum": ["receita", "despesa", "transferencia"], "description": "O tipo de transação." },
      "nome_categoria": { "type": "STRING", "description": "O nome da categoria que melhor corresponde à transação, baseado na lista fornecida." },
      "nome_conta_origem": { "type": "STRING", "description": "O nome da conta de origem do dinheiro, baseado na lista fornecida." },
      "nome_conta_destino": { "type": "STRING", "description": "O nome da conta de destino, APENAS se for uma transferência." },
      "installment_total": { "type": "NUMBER", "description": "O número total de parcelas. Use 1 se não for parcelado." }
    },
    required: ["valor", "descricao", "tipo", "nome_conta_origem", "installment_total"]
  };

  // 4. Construir o prompt para o Gemini
  const prompt = `
    Você é um assistente financeiro especialista em extrair dados de transações a partir de texto em português.
    Analise o texto do usuário e extraia os detalhes da transação no formato JSON especificado.

    **Texto do Usuário:** "${text}"

    **Contexto Disponível:**
    - Hoje é ${new Date().toLocaleDateString('pt-BR')}.
    - Contas do usuário: ${JSON.stringify(userAccounts?.map(a => a.nome))}
    - Categorias de despesa do usuário: ${JSON.stringify(userCategories?.filter(c => c.tipo === 'despesa').map(c => c.nome))}

    **Instruções:**
    1.  Determine o **valor** da transação.
    2.  Crie uma **descrição** curta e clara.
    3.  Identifique o **tipo**: 'receita', 'despesa' ou 'transferencia'.
    4.  Associe à **categoria** mais apropriada da lista. Se for transferência, deixe nulo (o nome).
    5.  Identifique a **conta de origem** (obrigatório).
    6.  Se for uma transferência, identifique a **conta de destino**. Caso contrário, deixe nulo.
    7.  Se a transação mencionar parcelamento (ex: '2x', '3/6'), determine o **installment_total**. Caso contrário, use 1.
    8.  Retorne APENAS o objeto JSON.
  `;

  // 5. Fazer a chamada para a API do Gemini
  const GEMINI_MODEL_NAME = 'gemini-2.5-flash-preview-05-20';
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL_NAME}:generateContent?key=${GOOGLE_AI_API_KEY}`;
  
  const requestBody = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      response_mime_type: "application/json",
      response_schema: transactionSchema,
    }
  };

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorBody = await response.json();
    console.error('Google AI API Error:', errorBody);
    return { validation_errors: [`Erro na IA: ${errorBody.error.message}`] };
  }

  const result = await response.json();
  const jsonText = result.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!jsonText) {
    return { validation_errors: ['A IA não conseguiu processar a transação.'] };
  }

  // 6. Processar e validar a resposta da IA e mapear para IDs
  const extractedData = JSON.parse(jsonText);
  const validationErrors = [];

  if (!extractedData.valor || extractedData.valor <= 0) validationErrors.push('Valor inválido ou não encontrado.');
  if (!extractedData.descricao) validationErrors.push('Descrição não encontrada.');

  // Mapear Conta de Origem
  const accountOrigin = userAccounts?.find(a => a.nome.toLowerCase() === extractedData.nome_conta_origem?.toLowerCase());
  if (!accountOrigin) validationErrors.push(`Conta de origem "${extractedData.nome_conta_origem}" não encontrada.`);
  
  // Mapear Conta de Destino (se for transferência)
  let accountDestination = null;
  if (extractedData.tipo === 'transferencia') {
    if (!extractedData.nome_conta_destino) {
      validationErrors.push('Conta de destino não informada para transferência.');
    } else {
      accountDestination = userAccounts?.find(a => a.nome.toLowerCase() === extractedData.nome_conta_destino?.toLowerCase());
      if (!accountDestination) validationErrors.push(`Conta de destino "${extractedData.nome_conta_destino}" não encontrada.`);
    }
  }

  // Mapear Categoria (se não for transferência)
  let category = null;
  if (extractedData.tipo !== 'transferencia') {
    category = userCategories?.find(c => c.nome.toLowerCase() === extractedData.nome_categoria?.toLowerCase());
    if (!category) validationErrors.push(`Categoria "${extractedData.nome_categoria}" não encontrada.`);
  }

  if (validationErrors.length > 0) {
    return { validation_errors: validationErrors, partial_data: extractedData };
  }
  
  // Se for uma despesa ou receita, a categoria é obrigatória
  if (extractedData.tipo !== 'transferencia' && !category?.id) {
    validationErrors.push(`Categoria é obrigatória para transações de ${extractedData.tipo}.`);
    return { validation_errors: validationErrors, partial_data: extractedData };
  }


  return {
    valor: extractedData.valor,
    descricao: extractedData.descricao,
    tipo: extractedData.tipo,
    installment_total: extractedData.installment_total || 1,
    categoria: category?.nome || extractedData.nome_categoria,
    categoria_id: category?.id,
    conta: accountOrigin?.nome,
    conta_origem_id: accountOrigin?.id,
    conta_destino: accountDestination?.nome,
    conta_destino_id: accountDestination?.id,
    validation_errors: [],
    confidence: 'high'
  };
}


// --- Função Principal do Webhook ---

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { text, userId } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Checagem de licença Premium (mantida como uma boa prática)
    const { data: license, error: licenseError } = await supabase
      .from('licenses')
      .select('plano, status')
      .eq('user_id', userId)
      .eq('status', 'ativo')
      .maybeSingle();

    if (licenseError || !license || license.plano !== 'premium') {
      return new Response(JSON.stringify({
        validation_errors: ['Esta funcionalidade requer um plano Premium. Faça upgrade para usar a integração com Telegram.']
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      });
    }
    
    // Chamar a nova função com Gemini
    const processedText = await processTransactionWithGemini(text.toLowerCase(), userId, supabase)

    return new Response(
      JSON.stringify(processedText),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in NLP transaction function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
