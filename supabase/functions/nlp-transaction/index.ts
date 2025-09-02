import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
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

    // Simple NLP processing - can be enhanced with AI later
    const processedText = processTransaction(text.toLowerCase())

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

function processTransaction(text: string) {
  // Extract value
  const valueMatch = text.match(/(\d+(?:[.,]\d{2})?)/);
  const valor = valueMatch ? parseFloat(valueMatch[1].replace(',', '.')) : null;

  // Determine transaction type
  let tipo = 'despesa';
  if (text.includes('recebi') || text.includes('receita') || text.includes('salario') || text.includes('salário')) {
    tipo = 'receita';
  } else if (text.includes('transferi') || text.includes('transfer')) {
    tipo = 'transferencia';
  }

  // Extract description (simplified)
  let descricao = text;
  if (text.includes('gastei')) {
    descricao = text.replace(/gastei\s*\d+(?:[.,]\d{2})?\s*/, '').trim();
  } else if (text.includes('recebi')) {
    descricao = text.replace(/recebi\s*\d+(?:[.,]\d{2})?\s*/, '').trim();
  }

  // Extract account name (look for common keywords)
  let conta = null;
  const accountKeywords = ['nubank', 'itau', 'itaú', 'bradesco', 'santander', 'caixa', 'bb', 'banco do brasil', 'mercado pago', 'picpay', 'carteira'];
  for (const keyword of accountKeywords) {
    if (text.includes(keyword)) {
      conta = keyword === 'bb' ? 'Banco do Brasil' : 
             keyword === 'itau' || keyword === 'itaú' ? 'Itaú' :
             keyword === 'mercado pago' ? 'Mercado Pago' :
             keyword === 'picpay' ? 'PicPay' :
             keyword.charAt(0).toUpperCase() + keyword.slice(1);
      break;
    }
  }

  // Extract category (simplified mapping)
  let categoria = null;
  const categoryMapping = {
    'mercado': 'Alimentação',
    'supermercado': 'Alimentação',
    'comida': 'Alimentação',
    'almoço': 'Alimentação',
    'jantar': 'Alimentação',
    'uber': 'Transporte',
    'taxi': 'Transporte',
    'gasolina': 'Transporte',
    'combustivel': 'Transporte',
    'salario': 'Salário',
    'salário': 'Salário',
    'freelance': 'Freelance',
    'cinema': 'Lazer',
    'shopping': 'Lazer',
    'remedio': 'Saúde',
    'remedios': 'Saúde',
    'farmacia': 'Saúde',
    'farmácia': 'Saúde'
  };

  for (const [keyword, cat] of Object.entries(categoryMapping)) {
    if (text.includes(keyword)) {
      categoria = cat;
      break;
    }
  }

  return {
    valor,
    descricao: descricao || text,
    tipo,
    categoria,
    subcategoria: null,
    conta,
    conta_origem: conta,
    conta_destino: null
  };
}