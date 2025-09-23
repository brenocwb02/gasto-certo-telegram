import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { text, userId } = await req.json()

    if (!text || !userId) {
      return new Response(
        JSON.stringify({ error: 'text and userId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const processedText = await processTransactionEnhanced(text.toLowerCase(), userId, supabase)

    return new Response(
      JSON.stringify(processedText),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error processing NLP transaction:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function processTransactionEnhanced(text: string, userId: string, supabase: any) {
  console.log(`Processing transaction text: "${text}" for user ${userId}`)
  
  // 1. Extrair Valor
  const valuePatterns = [
    /(\d+(?:[.,]\d{1,2})?)(?:\s*reais?)/i,
    /r\$?\s*(\d+(?:[.,]\d{1,2})?)/i,
  ];
  let valor = null;
  let valorTexto = '';
  for (const pattern of valuePatterns) {
    const match = text.match(pattern);
    if (match) {
      valor = parseFloat(match[1].replace(',', '.'));
      valorTexto = match[0];
      break;
    }
  }

  // 2. Detetar Tipo de Transação
  let tipo = 'despesa';
  const receitaKeywords = ['recebi', 'receita', 'salario', 'salário', 'ganho', 'renda', 'pagamento', 'deposito', 'entrada'];
  const transferenciaKeywords = ['transferi', 'transfer', 'enviei', 'mandei', 'passei'];
  if (receitaKeywords.some(keyword => text.includes(keyword))) tipo = 'receita';
  else if (transferenciaKeywords.some(keyword => text.includes(keyword))) tipo = 'transferencia';

  // 3. Obter Contas e Categorias do Utilizador
  const { data: userAccounts } = await supabase.from('accounts').select('nome, id').eq('user_id', userId).eq('ativo', true);
  const { data: userCategories } = await supabase.from('categories').select('nome, id, keywords').eq('user_id', userId);

  // 4. Detetar Contas
  let conta_origem = null;
  let conta_origem_id = null;
  let conta_destino = null;
  let conta_destino_id = null;

  if (userAccounts) {
    const sortedAccounts = [...userAccounts].sort((a, b) => b.nome.length - a.nome.length);
    for (const account of sortedAccounts) {
      const accountNameLower = account.nome.toLowerCase();
      if (text.includes(accountNameLower)) {
        if (tipo === 'transferencia') {
            if (!conta_origem_id && (text.includes(`de ${accountNameLower}`) || text.includes(`do ${accountNameLower}`))) {
              conta_origem = account.nome;
              conta_origem_id = account.id;
            } else if (!conta_destino_id && (text.includes(`para ${accountNameLower}`))) {
              conta_destino = account.nome;
              conta_destino_id = account.id;
            }
        } else {
            if (!conta_origem_id) {
                conta_origem = account.nome;
                conta_origem_id = account.id;
            }
        }
      }
    }
    if (tipo === 'transferencia' && userAccounts.length > 0 && (!conta_origem_id || !conta_destino_id)) {
        const foundAccount = userAccounts.find(acc => text.includes(acc.nome.toLowerCase()));
        if(foundAccount && !conta_origem_id) {
            conta_origem = foundAccount.nome;
            conta_origem_id = foundAccount.id;
        }
    }
  }

  // 5. Detetar Categoria
  let categoria = null;
  let categoria_id = null;
  if (userCategories) {
    let bestMatch = { id: null, name: null, keyword: '' };
    userCategories.forEach(cat => {
        const keywords = [cat.nome.toLowerCase(), ...(cat.keywords || [])];
        keywords.forEach(keyword => {
            if (text.includes(keyword) && keyword.length > bestMatch.keyword.length) {
                bestMatch = { id: cat.id, name: cat.nome, keyword: keyword };
            }
        });
    });
    if (bestMatch.id) {
        categoria = bestMatch.name;
        categoria_id = bestMatch.id;
    }
  }
  
  // 6. Extrair a Descrição
  let descricao = text;
  const actionWords = ['gastei', 'recebi', 'transferi', 'paguei', 'comprei', 'reais'];
  const noiseWords = ['no', 'na', 'do', 'da', 'com', 'para', 'de', 'em', 'e', 'r$'];

  if (valorTexto) descricao = descricao.replace(valorTexto, '');
  if (conta_origem) descricao = descricao.replace(new RegExp(conta_origem, 'ig'), '');
  if (conta_destino) descricao = descricao.replace(new RegExp(conta_destino, 'ig'), '');
  if (categoria) descricao = descricao.replace(new RegExp(categoria, 'ig'), '');
  
  [...actionWords, ...noiseWords].forEach(word => {
    descricao = descricao.replace(new RegExp(`\\b${word}\\b`, 'ig'), '');
  });
  
  descricao = descricao.replace(/\s+/g, ' ').trim();
  if (!descricao && categoria) {
    descricao = categoria;
  }
  descricao = descricao.charAt(0).toUpperCase() + descricao.slice(1);

  // 7. Validação
  const validationErrors = [];
  if (!valor || valor <= 0) validationErrors.push('Valor inválido ou não encontrado');
  if (!descricao) validationErrors.push('Descrição não encontrada');
  if (!conta_origem_id) validationErrors.push('Conta de origem não encontrada');
  if (tipo === 'transferencia' && !conta_destino_id) validationErrors.push('Conta de destino não encontrada para transferência');
  if (!categoria_id && tipo !== 'transferencia') validationErrors.push('Categoria não encontrada');

  return {
    valor,
    descricao,
    tipo,
    categoria,
    categoria_id,
    conta: conta_origem,
    conta_origem_id,
    conta_destino,
    conta_destino_id,
    validation_errors: validationErrors,
    confidence: validationErrors.length === 0 ? 'high' : 'low'
  };
}

