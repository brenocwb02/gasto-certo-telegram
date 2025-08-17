// supabase/functions/nlp-transaction/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// Função auxiliar para normalizar texto (acentos, maiúsculas, etc.)
function normalizeText(text: string): string {
  if (!text) return ''
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

// Função auxiliar para extrair valor numérico de uma string
function extractValue(text: string): number | null {
  // Procura por padrões como "50", "50,50", "50.50", "R$ 50"
  const match = text.match(/(?:R\$ ?)?(\d+([.,]\d{1,2})?)/)
  if (match) {
    // Converte vírgula para ponto para garantir que o parseFloat funcione
    const valueStr = match[1].replace(',', '.')
    return parseFloat(valueStr)
  }
  return null
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { text, userId } = await req.json()
    if (!text || !userId) {
      throw new Error('O texto da mensagem e o ID do utilizador são obrigatórios.')
    }

    // Inicializa o cliente Supabase Admin para poder ler os dados do utilizador
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Busca as contas e categorias do utilizador no banco de dados para usar na análise
    const { data: accounts, error: accountsError } = await supabaseAdmin
      .from('accounts')
      .select('nome')
      .eq('user_id', userId)
    if (accountsError) throw accountsError

    const { data: categories, error: categoriesError } = await supabaseAdmin
      .from('categories')
      .select('nome, tipo')
      .eq('user_id', userId)
    if (categoriesError) throw categoriesError

    // --- Lógica de Interpretação Baseada no seu Apps Script ---
    const normalizedText = normalizeText(text)
    
    // 1. Detectar Tipo (Despesa, Receita, Transferência)
    let tipo: 'despesa' | 'receita' | 'transferencia' = 'despesa'; // Padrão é despesa
    let keywordTipo = '';
    const receitaKeywords = ['recebi', 'salario', 'rendeu', 'pix recebido', 'ganhei', 'pagamento recebido', 'reembolso']
    const despesaKeywords = ['gastei', 'paguei', 'comprei', 'saida', 'debito']
    const transferenciaKeywords = ['transferi', 'transferir', 'enviei']

    // Prioriza transferência
    for (const kw of transferenciaKeywords) {
      if (normalizedText.includes(kw)) {
        tipo = 'transferencia';
        keywordTipo = kw;
        break;
      }
    }
    // Se não for transferência, verifica se é receita
    if (tipo !== 'transferencia') {
      for (const kw of receitaKeywords) {
        if (normalizedText.includes(kw)) {
          tipo = 'receita';
          keywordTipo = kw;
          break;
        }
      }
    }
    // Se não for nenhum dos dois, verifica se é despesa (ou assume como padrão)
     if (tipo !== 'transferencia' && tipo !== 'receita') {
        for (const kw of despesaKeywords) {
            if (normalizedText.includes(kw)) {
                tipo = 'despesa';
                keywordTipo = kw;
                break;
            }
        }
    }

    // 2. Extrair Valor
    const valor = extractValue(text)

    // 3. Extrair Contas e Categoria
    let conta = null;
    let contaOrigem = null;
    let contaDestino = null;
    let categoria = null;

    if (tipo === 'transferencia') {
      const matchOrigem = normalizedText.match(/(?:de|do)\s(.*?)(?=\s(?:para|pra)|$)/);
      const matchDestino = normalizedText.match(/(?:para|pra)\s(.+)/);

      if (matchOrigem) {
         const found = accounts.find(c => normalizeText(matchOrigem[1]).includes(normalizeText(c.nome)));
         if (found) contaOrigem = found.nome;
      }
      if (matchDestino) {
        const found = accounts.find(c => normalizeText(matchDestino[1]).includes(normalizeText(c.nome)));
        if (found) contaDestino = found.nome;
      }
    } else {
      // Encontrar conta
      const foundConta = accounts.find(c => normalizedText.includes(normalizeText(c.nome)));
      if (foundConta) conta = foundConta.nome;

      // Encontrar categoria (a mais longa que corresponder)
      let bestMatch = '';
      categories.forEach(c => {
        if (normalizeText(c.tipo) === tipo && normalizedText.includes(normalizeText(c.nome))) {
          if (c.nome.length > bestMatch.length) {
            bestMatch = c.nome;
          }
        }
      });
      if (bestMatch) categoria = bestMatch;
    }
    
    // 4. Extrair Descrição
    let descricao = text
        .replace(new RegExp(keywordTipo, 'i'), '')
        .replace(/(?:R\$ ?)?(\d+([.,]\d{1,2})?)/, '')
        .replace(/reais|real/gi, '')
        .trim();
        
    if (conta) descricao = descricao.replace(new RegExp(conta, 'gi'), '');
    if (contaOrigem) descricao = descricao.replace(new RegExp(contaOrigem, 'gi'), '');
    if (contaDestino) descricao = descricao.replace(new RegExp(contaDestino, 'gi'), '');
    if (categoria) descricao = descricao.replace(new RegExp(categoria, 'gi'), '');
    
    // Limpa preposições e espaços extras
    descricao = descricao.replace(/\s+(de|do|da|com|no|na|para|pra)\s+/gi, ' ').replace(/\s+/g, ' ').trim();
    
    const responseData = {
      valor,
      descricao: descricao || (tipo === 'transferencia' ? 'Transferência' : 'Lançamento'),
      tipo,
      categoria: categoria || 'Outras',
      conta,
      conta_origem: contaOrigem,
      conta_destino: contaDestino,
    }

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Erro na função nlp-transaction:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
