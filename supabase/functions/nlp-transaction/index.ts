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

    // Enhanced NLP processing with database validation
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
  
  // Extract value with improved patterns
  const valuePatterns = [
    /(\d+(?:[.,]\d{1,2})?)(?:\s*reais?)/i,
    /r\$?\s*(\d+(?:[.,]\d{1,2})?)/i,
    /(\d+(?:[.,]\d{1,2})?)/
  ];
  
  let valor = null;
  for (const pattern of valuePatterns) {
    const match = text.match(pattern);
    if (match) {
      valor = parseFloat(match[1].replace(',', '.'));
      break;
    }
  }

  // Enhanced transaction type detection
  let tipo = 'despesa';
  const receitaKeywords = ['recebi', 'receita', 'salario', 'salário', 'ganho', 'renda', 'pagamento', 'deposito', 'entrada'];
  const transferenciaKeywords = ['transferi', 'transfer', 'enviei', 'mandei', 'passei'];
  
  if (receitaKeywords.some(keyword => text.includes(keyword))) {
    tipo = 'receita';
  } else if (transferenciaKeywords.some(keyword => text.includes(keyword))) {
    tipo = 'transferencia';
  }

  // Get user's accounts and categories from database
  const { data: userAccounts } = await supabase
    .from('accounts')
    .select('nome, id')
    .eq('user_id', userId)
    .eq('ativo', true);

  const { data: userCategories } = await supabase
    .from('categories')
    .select('nome, id')
    .eq('user_id', userId);

  // Enhanced account detection
  let conta_origem = null;
  let conta_origem_id = null;
  let conta_destino = null;
  let conta_destino_id = null;

  if (userAccounts) {
    // Check exact matches first
    for (const account of userAccounts) {
      const accountNameLower = account.nome.toLowerCase();
      if (text.includes(accountNameLower)) {
        if (tipo === 'transferencia') {
          if (text.indexOf('para') > text.indexOf(accountNameLower)) {
            conta_origem = account.nome;
            conta_origem_id = account.id;
          } else if (text.indexOf('do') < text.indexOf(accountNameLower)) {
            conta_destino = account.nome;
            conta_destino_id = account.id;
          }
        } else {
          conta_origem = account.nome;
          conta_origem_id = account.id;
        }
        break;
      }
    }

    // Fallback to partial matches
    if (!conta_origem_id) {
      const accountKeywords = {
        'nubank': ['nubank', 'roxinho'],
        'itau': ['itau', 'itaú', 'banco itau'],
        'bradesco': ['bradesco', 'banco bradesco'],
        'santander': ['santander', 'banco santander'],
        'caixa': ['caixa', 'caixa economica'],
        'bb': ['bb', 'banco do brasil'],
        'mercado pago': ['mercado pago', 'mp'],
        'picpay': ['picpay', 'pic pay'],
        'carteira': ['carteira', 'dinheiro']
      };

      for (const account of userAccounts) {
        for (const [key, keywords] of Object.entries(accountKeywords)) {
          if (keywords.some(keyword => text.includes(keyword)) && 
              account.nome.toLowerCase().includes(key)) {
            conta_origem = account.nome;
            conta_origem_id = account.id;
            break;
          }
        }
        if (conta_origem_id) break;
      }
    }
  }

  // Enhanced category detection
  let categoria = null;
  let categoria_id = null;

  if (userCategories) {
    // Check exact matches first
    for (const category of userCategories) {
      if (text.includes(category.nome.toLowerCase())) {
        categoria = category.nome;
        categoria_id = category.id;
        break;
      }
    }

    // Fallback to keyword mapping
    if (!categoria_id) {
      const categoryMapping = {
        'alimentação': ['mercado', 'supermercado', 'comida', 'almoço', 'almoço', 'jantar', 'lanche', 'restaurante', 'ifood', 'delivery'],
        'transporte': ['uber', '99', 'taxi', 'gasolina', 'combustivel', 'combustível', 'onibus', 'ônibus', 'metro', 'metrô'],
        'saúde': ['remedio', 'remédio', 'remedios', 'remédios', 'farmacia', 'farmácia', 'medico', 'médico', 'hospital'],
        'lazer': ['cinema', 'shopping', 'bar', 'festa', 'show', 'netflix', 'spotify'],
        'moradia': ['aluguel', 'condominio', 'condomínio', 'luz', 'agua', 'água', 'gas', 'gás', 'internet'],
        'salário': ['salario', 'salário'],
        'freelance': ['freelance', 'freela', 'trabalho']
      };

      for (const category of userCategories) {
        const categoryNameLower = category.nome.toLowerCase();
        const keywords = categoryMapping[categoryNameLower] || [];
        if (keywords.some(keyword => text.includes(keyword))) {
          categoria = category.nome;
          categoria_id = category.id;
          break;
        }
      }
    }
  }

  // Enhanced description extraction
  let descricao = text;
  const actionWords = ['gastei', 'recebi', 'transferi', 'paguei', 'comprei'];
  for (const action of actionWords) {
    if (text.includes(action)) {
      descricao = text.replace(new RegExp(`${action}\\s*\\d+(?:[.,]\\d{1,2})?\\s*(?:reais?)?`, 'i'), '').trim();
      break;
    }
  }

  // Clean up description
  descricao = descricao
    .replace(/\b(no|na|do|da|com|para|de)\s+\w+/g, '') // Remove prepositions + account names
    .replace(/\s+/g, ' ')
    .trim();

  if (!descricao || descricao.length < 3) {
    descricao = text.substring(0, 50);
  }

  // Validation
  const validationErrors = [];
  if (!valor || valor <= 0) {
    validationErrors.push('Valor inválido ou não encontrado');
  }
  if (!descricao) {
    validationErrors.push('Descrição não encontrada');
  }
  if (!conta_origem_id && tipo !== 'transferencia') {
    validationErrors.push('Conta não encontrada');
  }
  if (tipo === 'transferencia' && (!conta_origem_id || !conta_destino_id)) {
    validationErrors.push('Para transferências, especifique conta origem e destino');
  }

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
    confidence: validationErrors.length === 0 ? 'high' : validationErrors.length <= 1 ? 'medium' : 'low'
  };
}