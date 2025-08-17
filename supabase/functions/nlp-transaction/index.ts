// supabase/functions/nlp-transaction/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Função auxiliar para normalizar texto (similar à sua no Apps Script)
function normalizeText(text: string): string {
  if (!text) return ''
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

// Lógica de extração de valor
function extractValue(text: string): number | null {
  const match = text.match(/(\d[\d\.,]*)/)
  if (match) {
    const valueStr = match[1].replace(/\./g, '').replace(',', '.')
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
      throw new Error('O texto da mensagem e o ID do usuário são obrigatórios.')
    }

    // Inicializa o Supabase Admin Client para poder ler os dados do usuário
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Busca as contas e categorias do usuário no banco de dados
    const { data: contas, error: contasError } = await supabaseAdmin
      .from('contas')
      .select('nome, tipo')
      .eq('user_id', userId)
    if (contasError) throw contasError

    const { data: categorias, error: categoriasError } = await supabaseAdmin
      .from('categorias')
      .select('nome, subcategoria, tipo')
      .eq('user_id', userId)
    if (categoriasError) throw categoriasError

    // Lógica de interpretação baseada no seu Apps Script
    const normalizedText = normalizeText(text)
    
    // 1. Detectar Tipo (Despesa, Receita, Transferência)
    let tipo: 'despesa' | 'receita' | 'transferencia' = 'despesa'; // Padrão
    let keywordTipo = '';
    const receitaKeywords = ['recebi', 'salario', 'rendeu', 'pix recebido', 'ganhei', 'pagamento recebido', 'reembolso']
    const despesaKeywords = ['gastei', 'paguei', 'comprei', 'saida', 'debito']
    const transferenciaKeywords = ['transferi', 'transferir', 'enviei']

    for (const kw of transferenciaKeywords) {
      if (normalizedText.includes(kw)) {
        tipo = 'transferencia';
        keywordTipo = kw;
        break;
      }
    }
    if (tipo !== 'transferencia') {
      for (const kw of receitaKeywords) {
        if (normalizedText.includes(kw)) {
          tipo = 'receita';
          keywordTipo = kw;
          break;
        }
      }
    }
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
    let subcategoria = null;

    if (tipo === 'transferencia') {
      const matchOrigem = normalizedText.match(/(?:de|do)\s(.*?)(?=\s(?:para|pra)|$)/);
      const matchDestino = normalizedText.match(/(?:para|pra)\s(.+)/);

      if (matchOrigem) {
         const found = contas.find(c => normalizeText(matchOrigem[1]).includes(normalizeText(c.nome)));
         if (found) contaOrigem = found.nome;
      }
      if (matchDestino) {
        const found = contas.find(c => normalizeText(matchDestino[1]).includes(normalizeText(c.nome)));
        if (found) contaDestino = found.nome;
      }
    } else {
      // Encontrar conta
      const foundConta = contas.find(c => normalizedText.includes(normalizeText(c.nome)));
      if (foundConta) conta = foundConta.nome;

      // Encontrar categoria/subcategoria
       const foundCategoria = categorias.find(c => {
         const keywords = [normalizeText(c.nome), normalizeText(c.subcategoria)].filter(Boolean)
         return keywords.some(kw => normalizedText.includes(kw)) && (normalizeText(c.tipo) === tipo || !c.tipo);
       });
       if(foundCategoria) {
         categoria = foundCategoria.nome;
         subcategoria = foundCategoria.subcategoria;
       }
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
    if (subcategoria) descricao = descricao.replace(new RegExp(subcategoria, 'gi'), '');

    descricao = descricao.replace(/\s+/g, ' ').trim()
    
    const responseData = {
      valor,
      descricao: descricao || (tipo === 'transferencia' ? 'Transferência' : 'Lançamento'),
      tipo,
      categoria,
      subcategoria,
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
