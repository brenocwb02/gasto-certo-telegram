// CORREÇÃO: Harmonizando todas as importações da biblioteca padrão para a mesma versão (0.224.0)
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { encodeBase64 } from "https://deno.land/std@0.224.0/encoding/base64.ts";

// Imports dos módulos refatorados
import { corsHeaders, ParsedTransaction, AccountData, CategoryData } from './_shared/types.ts';
import { sendTelegramMessage, editTelegramMessage, answerCallbackQuery } from './_shared/telegram-api.ts';
import { formatCurrency } from './_shared/formatters.ts';

import {
  handleFaturaCommand,
  handlePagarCommand,
  handleConfigCartaoCommand,
  handlePaymentCardSelection,
  confirmInvoicePayment,
  handleCardConfigCallback,
  toggleCardAutoPayment,
  toggleCardReminder
} from './handlers/credit-card.ts';

// Imports dos novos módulos modularizados
import {
  handleSaldoCommand,
  handleExtratoCommand,
  handleResumoCommand,
  handlePrevisaoCommand,
  handleTopGastosCommand,
  handleCompararMesesCommand,
  handleOrcamentoCommand,
  handleDividasCommand
} from './commands/financial.ts';

import { handleMetasCommand } from './commands/goals.ts';
import { handleAjudaCommand, handleStartUnlinkedCommand, sendUnlinkedMessage, handleMenuCallback } from './commands/admin.ts';
import { getTranscriptFromAudio } from './services/transcription.ts';
import {
  getEmergencyFundLabel,
  getDebtSituationLabel,
  getSavingsRateLabel,
  getInvestmentKnowledgeLabel,
  getFinancialGoalsLabel,
  getBudgetControlLabel,
  getInsuranceCoverageLabel,
  getRetirementPlanningLabel
} from './utils/quiz-labels.ts';

// Import do parser de transações
import {
  parseTransaction,
  gerarTecladoContas,
  calcularSimilaridade,
  encontrarContaSimilar,
  extrairValor,
  identificarTipo,
  sugerirCategoria,
  encontrarCategoriaPorKeywords,
  extrairDescricao
} from './parser/index.ts';

// ============================================================================
// CONTEXTO TELEGRAM - Funções de contexto usadas pelo bot
// ============================================================================



/**
 * Encontra a conta mais similar ao termo digitado
 */
function encontrarContaSimilar(termo: string, contas: AccountData[]): { conta: AccountData | null, similaridade: number } {
  if (!termo || !contas?.length) return { conta: null, similaridade: 0 };

  let melhorMatch: AccountData | null = null;
  let melhorSimilaridade = 0;

  const termoLower = termo.toLowerCase().trim();

  // Aliases comuns
  const aliases: Record<string, string[]> = {
    'nubank': ['nu', 'nub', 'roxinho'],
    'santander': ['san', 'stdr', 'vermelhinho'],
    'itau': ['itaú', 'ita'],
    'bradesco': ['bra', 'brad'],
    'pix': ['pix'],
    'dinheiro': ['din', 'cash', 'espécie', 'especie'],
    'carteira': ['din', 'dinheiro', 'cash'],
    'credito': ['crédito', 'cred'],
    'debito': ['débito', 'deb'],
  };

  for (const conta of contas) {
    const nomeContaLower = conta.nome.toLowerCase();

    // Match exato
    if (nomeContaLower === termoLower || nomeContaLower.includes(termoLower)) {
      return { conta, similaridade: 100 };
    }

    // Verificar aliases
    for (const [chave, aliasList] of Object.entries(aliases)) {
      if (aliasList.includes(termoLower) && nomeContaLower.includes(chave)) {
        return { conta, similaridade: 95 };
      }
    }

    // Similaridade fuzzy
    const sim = calcularSimilaridade(termoLower, nomeContaLower);
    if (sim > melhorSimilaridade) {
      melhorSimilaridade = sim;
      melhorMatch = conta;
    }
  }

  return { conta: melhorMatch, similaridade: melhorSimilaridade };
}

/**
 * Extrai valor numérico da mensagem
 */
function extrairValor(texto: string): number | null {
  const patterns = [
    /R\$\s*(\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?)/i,
    /(\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?)\s*reais?/i,
    /(\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?)\s*(?:conto|pila|real)/i,
    /(\d+(?:,\d{1,2})?)/,
  ];

  for (const pattern of patterns) {
    const match = texto.match(pattern);
    if (match) {
      // Normalizar: "1.234,56" → 1234.56
      let valor = match[1]
        .replace(/\./g, '')  // Remove pontos de milhar
        .replace(',', '.');   // Troca vírgula por ponto

      const num = parseFloat(valor);
      if (!isNaN(num) && num > 0 && num < 1000000) {
        return num;
      }
    }
  }

  return null;
}

/**
 * Identifica o tipo de transação pelos verbos
 */
function identificarTipo(texto: string): 'despesa' | 'receita' | 'transferencia' | null {
  const textoLower = texto.toLowerCase();

  const verbosReceita = ['recebi', 'ganhei', 'entrou', 'depositaram', 'caiu', 'rendeu'];
  const verbosDespesa = ['gastei', 'paguei', 'comprei', 'pago', 'gasto', 'comprando'];
  const verbosTransferencia = ['transferi', 'passei', 'mandei', 'movi', 'enviei'];

  for (const verbo of verbosTransferencia) {
    if (textoLower.includes(verbo)) return 'transferencia';
  }

  for (const verbo of verbosReceita) {
    if (textoLower.includes(verbo)) return 'receita';
  }

  for (const verbo of verbosDespesa) {
    if (textoLower.includes(verbo)) return 'despesa';
  }

  // Por padrão, assumir despesa se tem valor
  return null;
}

/**
 * Sugere categoria com base em palavras-chave
 */
function sugerirCategoria(texto: string): string | null {
  const textoLower = texto.toLowerCase();

  const regras: Array<{ keywords: string[], categoria: string }> = [
    { keywords: ['mercado', 'supermercado', 'feira', 'muffato', 'condor', 'carrefour'], categoria: 'Alimentação > Supermercado' },
    { keywords: ['uber', '99', 'cabify', 'taxi', 'táxi'], categoria: 'Transporte > Aplicativo' },
    { keywords: ['gasolina', 'combustível', 'combustivel', 'posto', 'alcool', 'álcool'], categoria: 'Transporte > Combustível' },
    { keywords: ['netflix', 'spotify', 'disney', 'hbo', 'prime', 'streaming'], categoria: 'Lazer > Streaming' },
    { keywords: ['farmácia', 'farmacia', 'drogaria', 'remédio', 'remedio'], categoria: 'Saúde > Farmácia' },
    { keywords: ['restaurante', 'almoço', 'almoco', 'jantar', 'lanche', 'café', 'cafe'], categoria: 'Alimentação > Restaurante' },
    { keywords: ['ifood', 'rappi', 'delivery', 'uber eats', 'entrega'], categoria: 'Alimentação > Delivery' },
    { keywords: ['luz', 'energia', 'enel', 'copel', 'eletricidade'], categoria: 'Casa > Energia' },
    { keywords: ['água', 'agua', 'sanepar', 'sabesp'], categoria: 'Casa > Água' },
    { keywords: ['internet', 'wifi', 'vivo', 'claro', 'tim', 'oi'], categoria: 'Casa > Internet/Telefone' },
    { keywords: ['salário', 'salario', 'pagamento', 'holerite'], categoria: 'Renda > Salário' },
    { keywords: ['freelance', 'freela', 'job', 'projeto'], categoria: 'Renda > Freelance' },
    { keywords: ['aluguel', 'condomínio', 'condominio', 'iptu'], categoria: 'Casa > Moradia' },
  ];

  for (const regra of regras) {
    for (const keyword of regra.keywords) {
      if (textoLower.includes(keyword)) {
        return regra.categoria;
      }
    }
  }

  return null;
}

/**
 * Encontra categoria do usuário baseado nas keywords cadastradas
 * Retorna a categoria/subcategoria com seus nomes
 */
function encontrarCategoriaPorKeywords(
  texto: string,
  categorias: CategoryData[]
): {
  categoria_id: string | null;
  subcategoria_id: string | null;
  categoria_nome: string | null;
  subcategoria_nome: string | null;
} {
  const textoLower = texto.toLowerCase();
  console.log('[CatMatch] Buscando categoria para texto:', textoLower);

  // Helper: Verifica se keyword é palavra completa no texto (não substring de outra palavra)
  const matchPalavraCompleta = (texto: string, keyword: string): boolean => {
    // Escape special regex characters in keyword
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Use word boundary (\b) to match complete words only
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    return regex.test(texto);
  };

  // Primeiro, buscar nas subcategorias (que têm parent_id)
  for (const cat of categorias) {
    if (cat.parent_id && cat.keywords && cat.keywords.length > 0) {
      for (const keyword of cat.keywords) {
        const keywordLower = keyword.toLowerCase();
        if (matchPalavraCompleta(textoLower, keywordLower)) {
          console.log(`[CatMatch] MATCH! Keyword "${keywordLower}" em categoria "${cat.nome}" (sub de ${cat.parent_id})`);
          // Encontrou subcategoria, buscar pai
          const pai = categorias.find(c => c.id === cat.parent_id);
          return {
            categoria_id: pai?.id || null,
            subcategoria_id: cat.id,
            categoria_nome: pai?.nome || null,
            subcategoria_nome: cat.nome
          };
        }
      }
    }
  }

  // Se não encontrou subcategoria, buscar nas categorias principais
  for (const cat of categorias) {
    if (!cat.parent_id && cat.keywords && cat.keywords.length > 0) {
      for (const keyword of cat.keywords) {
        if (matchPalavraCompleta(textoLower, keyword.toLowerCase())) {
          return {
            categoria_id: cat.id,
            subcategoria_id: null,
            categoria_nome: cat.nome,
            subcategoria_nome: null
          };
        }
      }
    }
  }

  // Tentar match pelo nome da categoria/subcategoria (também com palavra completa)
  for (const cat of categorias) {
    if (matchPalavraCompleta(textoLower, cat.nome.toLowerCase())) {
      if (cat.parent_id) {
        const pai = categorias.find(c => c.id === cat.parent_id);
        return {
          categoria_id: pai?.id || null,
          subcategoria_id: cat.id,
          categoria_nome: pai?.nome || null,
          subcategoria_nome: cat.nome
        };
      } else {
        return {
          categoria_id: cat.id,
          subcategoria_id: null,
          categoria_nome: cat.nome,
          subcategoria_nome: null
        };
      }
    }
  }

  return {
    categoria_id: null,
    subcategoria_id: null,
    categoria_nome: null,
    subcategoria_nome: null
  };
}

/**
 * Extrai descrição da mensagem (remove valor, verbos, conta)
 */
function extrairDescricao(texto: string, contaEncontrada: string | null): string {
  let descricao = texto;

  // Remover verbos comuns
  const verbos = ['gastei', 'paguei', 'comprei', 'recebi', 'ganhei', 'transferi', 'passei'];
  for (const verbo of verbos) {
    descricao = descricao.replace(new RegExp(verbo, 'gi'), '');
  }

  // Remover valores
  descricao = descricao.replace(/R\$\s*[\d.,]+/gi, '');
  descricao = descricao.replace(/[\d.,]+\s*reais?/gi, '');
  descricao = descricao.replace(/\b\d+(?:[.,]\d+)?\b/g, '');

  // Remover preposições e conectores no início
  descricao = descricao.replace(/^[\s,.]*(no|na|em|de|do|da|com|pelo|pela|para|pro|pra)\s+/gi, '');

  // Remover padrão "com/no cartão X" ou "pelo/na conta X" antes de processar palavras
  descricao = descricao.replace(/\s+(com|no|na|pelo|pela)\s+(cart[aã]o|conta|pix)\s+\S+(\s+\S+)?$/gi, '');

  // Remover nome da conta se encontrada
  if (contaEncontrada) {
    const palavrasConta = contaEncontrada.toLowerCase().split(/\s+/);
    for (const palavra of palavrasConta) {
      if (palavra.length > 2) {
        descricao = descricao.replace(new RegExp(`\\b${palavra}\\b`, 'gi'), '');
      }
    }
  }

  // Remover "cartão", "pix", etc
  descricao = descricao.replace(/\b(cartão|cartao|pix|débito|debito|crédito|credito|conta)\b/gi, '');

  // Limpar preposições restantes no final
  descricao = descricao.replace(/\s+(com|no|na|em|de|do|da|pelo|pela)\s*$/gi, '');

  // Limpar espaços extras
  descricao = descricao.replace(/\s+/g, ' ').trim();

  // Capitalizar primeira letra
  if (descricao.length > 0) {
    descricao = descricao.charAt(0).toUpperCase() + descricao.slice(1);
  }

  return descricao || 'Transação';
}

/**
 * Parser principal de transações
 */
function parseTransaction(texto: string, contasUsuario: AccountData[], categoriasUsuario: CategoryData[] = []): ParsedTransaction {
  const resultado: ParsedTransaction = {
    tipo: null,
    valor: null,
    descricao: null,
    conta_origem: null,
    conta_destino: null,
    categoria_id: null,
    subcategoria_id: null,
    categoria_nome: null,
    subcategoria_nome: null,
    categoria_sugerida: null,
    confianca: 0,
    campos_faltantes: []
  };

  // 1. Extrair valor
  resultado.valor = extrairValor(texto);
  if (!resultado.valor) {
    resultado.campos_faltantes.push('valor');
  }

  // 2. Identificar tipo
  resultado.tipo = identificarTipo(texto);
  if (!resultado.tipo && resultado.valor) {
    resultado.tipo = 'despesa'; // Padrão se não identificou
  }

  // 3. Buscar conta mencionada
  const textoLower = texto.toLowerCase();
  let contaEncontrada: AccountData | null = null;

  // Primeiro, tentar encontrar padrões explícitos como "cartão X" ou "conta X"
  // Captura o que vem DEPOIS de cartão/conta e junta com "Cartão" para buscar
  const matchCartao = texto.match(/cart[aã]o\s+([\w\s]+?)(?:\s*$|\s+(?:de|do|da|para|pra|no|na|em))/i);
  if (matchCartao) {
    const nomeAposCartao = matchCartao[1].trim();
    // Buscar conta com nome completo "Cartão + resto"
    const termoBusca = `cartão ${nomeAposCartao}`;
    const { conta, similaridade } = encontrarContaSimilar(termoBusca, contasUsuario);
    if (conta && similaridade >= 70) {
      contaEncontrada = conta;
      resultado.conta_origem = conta.id;
    }
  }

  // Tentar padrão "pix X" ou "pelo pix X" - usa conta corrente (NÃO cartão)  
  if (!contaEncontrada) {
    const matchPix = texto.match(/(?:pix|pelo\s+pix|via\s+pix)\s+([\w]+)/i);
    if (matchPix) {
      const nomeConta = matchPix[1].trim();
      // Filtrar apenas contas que NÃO são cartão para PIX
      const contasNaoCartao = contasUsuario.filter(c =>
        !c.nome.toLowerCase().startsWith('cartão') &&
        !c.nome.toLowerCase().startsWith('cartao')
      );
      const { conta, similaridade } = encontrarContaSimilar(nomeConta, contasNaoCartao);
      if (conta && similaridade >= 70) {
        contaEncontrada = conta;
        resultado.conta_origem = conta.id;
      }
    }
  }

  // Tentar padrão "com/no/na X" (mas não cartão)
  if (!contaEncontrada) {
    const matchCom = texto.match(/(?:com|no|na|pelo|pela)\s+([\w]+(?:\s+[\w]+)?)/gi);
    if (matchCom) {
      for (const match of matchCom) {
        const possibleAccount = match.replace(/^(com|no|na|pelo|pela)\s+/i, '').trim();
        // Ignorar palavras comuns
        const ignorar = ['cartão', 'cartao', 'pix', 'credito', 'crédito', 'debito', 'débito', 'reais', 'real'];
        if (ignorar.includes(possibleAccount.toLowerCase())) continue;

        const { conta, similaridade } = encontrarContaSimilar(possibleAccount, contasUsuario);
        if (conta && similaridade >= 80) {
          contaEncontrada = conta;
          resultado.conta_origem = conta.id;
          break;
        }
      }
    }
  }

  // Palavras que NÃO são contas (evitar falsos positivos)
  const palavrasIgnorar = [
    'no', 'na', 'em', 'de', 'do', 'da', 'com', 'para', 'pelo', 'pela',
    'gastei', 'paguei', 'comprei', 'recebi', 'ganhei', 'transferi',
    'reais', 'real', 'mercado', 'restaurante', 'uber', 'ifood', 'almoço',
    'jantar', 'lanche', 'café', 'farmácia', 'gasolina', 'luz', 'água',
    'internet', 'netflix', 'spotify', 'salário', 'freelance', 'pizzaria'
  ];

  // Se não encontrou por padrão explícito, tentar por palavras
  if (!contaEncontrada) {
    const palavras = texto.split(/\s+/);
    for (let i = palavras.length - 1; i >= 0; i--) {
      // Tentar combinações de palavras (ex: "santander breno")
      for (let j = i; j < palavras.length && j <= i + 2; j++) {
        const termo = palavras.slice(i, j + 1).join(' ').toLowerCase();

        // Ignorar palavras comuns que não são contas
        if (palavrasIgnorar.some(p => termo === p)) {
          continue;
        }

        const { conta, similaridade } = encontrarContaSimilar(termo, contasUsuario);

        // Threshold mais alto para evitar falsos positivos
        if (conta && similaridade >= 85) {
          contaEncontrada = conta;
          resultado.conta_origem = conta.id;
          break;
        }
      }
      if (contaEncontrada) break;
    }
  }

  if (!resultado.conta_origem) {
    resultado.campos_faltantes.push('conta');
  }

  // 4. Extrair descrição
  resultado.descricao = extrairDescricao(texto, contaEncontrada?.nome || null);

  // 5. Buscar categoria por keywords do usuário
  if (categoriasUsuario.length > 0) {
    const categoriaEncontrada = encontrarCategoriaPorKeywords(texto, categoriasUsuario);
    resultado.categoria_id = categoriaEncontrada.categoria_id;
    resultado.subcategoria_id = categoriaEncontrada.subcategoria_id;
    resultado.categoria_nome = categoriaEncontrada.categoria_nome;
    resultado.subcategoria_nome = categoriaEncontrada.subcategoria_nome;
  }

  // Fallback para sugestão hardcoded se não encontrou nas do usuário
  if (!resultado.categoria_id && !resultado.subcategoria_id) {
    resultado.categoria_sugerida = sugerirCategoria(texto);
  }

  // 6. Calcular confiança
  let confianca = 0;
  if (resultado.valor) confianca += 30;
  if (resultado.tipo) confianca += 20;
  if (resultado.conta_origem) confianca += 30;
  if (resultado.descricao && resultado.descricao !== 'Transação') confianca += 10;
  if (resultado.categoria_sugerida) confianca += 10;
  resultado.confianca = confianca;

  return resultado;
}

/**
 * Gera teclado inline para seleção de conta
 */
function gerarTecladoContas(contas: AccountData[]): any {
  const keyboard: any = { inline_keyboard: [] };

  // Agrupar em linhas de 2
  for (let i = 0; i < contas.length; i += 2) {
    const row: any[] = [];
    row.push({
      text: contas[i].nome,
      callback_data: `select_account_${contas[i].id}`
    });

    if (contas[i + 1]) {
      row.push({
        text: contas[i + 1].nome,
        callback_data: `select_account_${contas[i + 1].id}`
      });
    }

    keyboard.inline_keyboard.push(row);
  }

  keyboard.inline_keyboard.push([{ text: '❌ Cancelar', callback_data: 'cancel_transaction_parse' }]);

  return keyboard;
}


// --- Funções Auxiliares Gerais ---
// formatCurrency, sendTelegramMessage e editTelegramMessage foram movidas para módulos separados

/**
 * Transcreve um áudio do Telegram usando a API do Gemini.
 */
async function getTranscriptFromAudio(fileId: string): Promise<string> {
  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
  const googleApiKey = Deno.env.get('GOOGLE_AI_API_KEY');
  if (!botToken || !googleApiKey) {
    throw new Error("As chaves de API do Telegram ou do Google AI não estão configuradas.");
  }
  // 1. Obter o caminho do ficheiro do Telegram
  const fileInfoResponse = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`);
  const fileInfo = await fileInfoResponse.json();
  if (!fileInfo.ok) throw new Error("Não foi possível obter informações do ficheiro de áudio do Telegram.");
  const filePath = fileInfo.result.file_path;
  // 2. Descarregar o ficheiro de áudio
  const fileUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`;
  const audioResponse = await fetch(fileUrl);
  const audioBlob = await audioResponse.blob();
  const audioArrayBuffer = await audioBlob.arrayBuffer();
  // 3. Converter para Base64
  const base64Audio = encodeBase64(audioArrayBuffer);

  // O Telegram geralmente envia áudio como OGG/Opus
  // Se o MIME type vier como application/octet-stream, corrigimos para audio/ogg
  let mimeType = audioBlob.type;

  console.log('MIME type original do áudio:', mimeType);

  // Corrigir MIME types problemáticos
  if (!mimeType || mimeType === 'application/octet-stream' || mimeType === '') {
    mimeType = 'audio/ogg';
    console.log('MIME type corrigido para:', mimeType);
  }

  // Garantir que o MIME type é suportado pelo Gemini
  const supportedTypes = ['audio/wav', 'audio/mp3', 'audio/aiff', 'audio/aac', 'audio/ogg', 'audio/flac'];
  if (!supportedTypes.includes(mimeType)) {
    console.log(`MIME type ${mimeType} não suportado, usando audio/ogg como padrão`);
    mimeType = 'audio/ogg';
  }
  // 4. Chamar a API do Gemini para transcrição
  // Usando o modelo mais recente gemini-2.5-flash
  const geminiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${googleApiKey}`;
  const prompt = "Transcreva este áudio em português:";
  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: prompt
          },
          {
            inline_data: {
              mime_type: mimeType,
              data: base64Audio
            }
          }
        ]
      }
    ],
    safetySettings: [
      {
        "category": "HARM_CATEGORY_HARASSMENT",
        "threshold": "BLOCK_NONE"
      },
      {
        "category": "HARM_CATEGORY_HATE_SPEECH",
        "threshold": "BLOCK_NONE"
      },
      {
        "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
        "threshold": "BLOCK_NONE"
      },
      {
        "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
        "threshold": "BLOCK_NONE"
      }
    ]
  };

  console.log('Enviando para o Gemini com MIME type:', mimeType, '(tamanho do áudio em bytes:', audioArrayBuffer.byteLength, ')');

  const geminiResponse = await fetch(geminiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });
  if (!geminiResponse.ok) {
    const errorBody = await geminiResponse.json();
    console.error('Google AI API Error (Audio):', errorBody);
    throw new Error(`Erro ao transcrever áudio: ${errorBody.error.message}`);
  }
  const result = await geminiResponse.json();
  const transcript = result.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!transcript) {
    // Verifica se a resposta foi bloqueada por segurança
    if (result.candidates?.[0]?.finishReason === 'SAFETY') {
      console.error('Resposta bloqueada por configurações de segurança.', result.candidates[0].safetyRatings);
      throw new Error("A resposta da IA foi bloqueada por filtros de segurança.");
    }
    throw new Error("A IA não conseguiu transcrever o áudio.");
  }
  return transcript;
}

/**
 * MODELO 5 HÍBRIDO - Contexto Ativo
 */
async function getUserTelegramContext(supabase: any, userId: string): Promise<{
  defaultContext: 'personal' | 'group';
  showConfirmation: boolean;
  alertAt80: boolean;
  alertAt90: boolean;
  groupId: string | null;
  groupName: string | null;
}> {
  try {
    const { data, error } = await supabase.rpc('get_telegram_context', {
      p_user_id: userId
    });

    if (error || !data || data.length === 0) {
      console.log('Contexto não encontrado, usando padrão: personal');
      return {
        defaultContext: 'personal',
        showConfirmation: true,
        alertAt80: true,
        alertAt90: true,
        groupId: null,
        groupName: null
      };
    }

    const context = data[0];
    return {
      defaultContext: context.default_context || 'personal',
      showConfirmation: context.show_context_confirmation !== false,
      alertAt80: context.alert_at_80_percent !== false,
      alertAt90: context.alert_at_90_percent !== false,
      groupId: context.current_group_id || null,
      groupName: context.current_group_name || null
    };
  } catch (e) {
    console.error('Erro ao obter contexto:', e);
    return {
      defaultContext: 'personal',
      showConfirmation: true,
      alertAt80: true,
      alertAt90: true,
      groupId: null,
      groupName: null
    };
  }
}

async function setUserTelegramContext(
  supabase: any,
  userId: string,
  context: 'personal' | 'group'
): Promise<boolean> {
  try {
    const { error } = await supabase.rpc('set_telegram_context', {
      p_user_id: userId,
      p_context: context
    });
    if (error) {
      console.error('Erro ao definir contexto:', error);
      return false;
    }
    return true;
  } catch (e) {
    console.error('Erro ao definir contexto:', e);
    return false;
  }
}

function parseContextFromMessage(message: string): {
  forcedContext: 'personal' | 'group' | null;
  cleanMessage: string;
} {
  const lowerMessage = message.toLowerCase().trim();

  if (lowerMessage.startsWith('#p ') || lowerMessage.startsWith('#pessoal ')) {
    return {
      forcedContext: 'personal',
      cleanMessage: message.replace(/^#p(essoal)?\s+/i, '').trim()
    };
  }

  if (lowerMessage.startsWith('#g ') || lowerMessage.startsWith('#grupo ')) {
    return {
      forcedContext: 'group',
      cleanMessage: message.replace(/^#g(rupo)?\s+/i, '').trim()
    };
  }

  return {
    forcedContext: null,
    cleanMessage: message
  };
}

function formatTransactionConfirmation(params: {
  tipo: string;
  valor: number;
  descricao: string;
  categoria: string;
  context: 'personal' | 'group';
  groupName: string | null;
  usage?: number;
  limit?: number;
  showUsage?: boolean;
}): string {
  const { tipo, valor, descricao, categoria, context, groupName, usage, limit, showUsage } = params;

  const tipoEmoji = tipo === 'receita' ? '💚' : tipo === 'despesa' ? '💸' : '🔄';
  const tipoLabel = tipo === 'receita' ? 'Receita' : tipo === 'despesa' ? 'Despesa' : 'Transferência';

  const contextEmoji = context === 'group' ? '🏠' : '👤';
  const contextLabel = context === 'group'
    ? (groupName || 'Grupo Familiar')
    : 'Pessoal';
  const visibilityInfo = context === 'group'
    ? '\nOutras pessoas do grupo verão esta transação.'
    : '\n(só você vê)';

  let message = `✅ ${tipoLabel} registrada!\n\n`;
  message += `💰 Valor: ${formatCurrency(valor)}\n`;
  message += `📁 Categoria: ${categoria}\n`;
  message += `${contextEmoji} ${contextLabel}${visibilityInfo}`;

  if (context === 'personal' && showUsage && usage !== undefined && limit !== undefined) {
    const percentage = Math.round((usage / limit) * 100);
    message += `\n\n📊 Uso: ${usage}/${limit} transações (${percentage}%)`;

    if (limit - usage <= 10 && limit - usage > 0) {
      message += `\n⚠️ ${limit - usage} transações restantes este mês`;
    }
  }

  if (Math.random() < 0.2) {
    message += context === 'group'
      ? '\n\n💡 Dica: Use #p para registrar uma despesa pessoal'
      : '\n\n💡 Dica: Use #g para registrar no grupo familiar';
  }

  return message;
}

function shouldShowLimitAlert(
  usage: number,
  limit: number,
  alertAt80: boolean,
  alertAt90: boolean
): { show: boolean; message: string } {
  const percentage = (usage / limit) * 100;

  if (percentage >= 90 && alertAt90) {
    return {
      show: true,
      message: `⚠️ *ATENÇÃO: Limite de Transações Pessoais*\n\n` +
        `📊 Você usou ${usage} de ${limit} transações este mês (${Math.round(percentage)}%)\n` +
        `📅 Restam ${limit - usage} transações\n\n` +
        `💡 *Dica:* Transações do grupo são ILIMITADAS!\n` +
        `   Use /g para alternar para o grupo familiar.\n\n` +
        `💎 Ou faça upgrade para Individual (ilimitado) → /planos`
    };
  }

  if (percentage >= 80 && percentage < 90 && alertAt80) {
    return {
      show: true,
      message: `⚠️ Você está próximo do limite (${usage}/${limit} transações pessoais).\n\n` +
        `💡 Dica: Use /g para registrar no grupo (ilimitado).`
    };
  }

  return { show: false, message: '' };
}

/**
 * Vincula a conta de um utilizador do Telegram à sua licença.
 * SEGURANÇA: Atualiza telegram_chat_id E telegram_id para evitar estado inconsistente.
 */
async function linkUserWithLicense(supabase: any, telegramChatId: number, licenseCode: string): Promise<{ success: boolean; message: string }> {
  console.log(`[SECURITY] Tentando vincular a licença ${licenseCode} ao chat ${telegramChatId}`);

  // Verifica se a licença existe e está ativa
  const { data: license, error: licenseError } = await supabase
    .from('licenses')
    .select('user_id, status')
    .eq('codigo', licenseCode)
    .single();

  if (licenseError || !license || license.status !== 'ativo') {
    console.error('[SECURITY] Tentativa de vinculação com licença inválida:', { codigo: licenseCode });
    return {
      success: false,
      message: '❌ Código de licença inválido, expirado ou não encontrado.'
    };
  }

  // Verifica se este chat_id já está vinculado a algum perfil
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('telegram_chat_id', telegramChatId)
    .single();

  if (existingProfile) {
    if (existingProfile.user_id === license.user_id) {
      return {
        success: true,
        message: '✅ Este chat já está vinculado à sua conta.'
      };
    } else {
      console.error('[SECURITY] Tentativa de vincular chat já vinculado a outra conta:', { chatId: telegramChatId });
      return {
        success: false,
        message: '⚠️ Este chat do Telegram já está vinculado a outra conta.'
      };
    }
  }

  // ⚠️ CORREÇÃO DE SEGURANÇA: Atualiza AMBOS telegram_chat_id E telegram_id
  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      telegram_chat_id: telegramChatId,
      telegram_id: telegramChatId.toString() // ✅ Adiciona telegram_id
    })
    .eq('user_id', license.user_id);

  if (updateError) {
    console.error('[SECURITY] Erro ao vincular a conta:', updateError);
    return {
      success: false,
      message: '❌ Ocorreu um erro ao vincular a sua conta. Tente novamente.'
    };
  }

  // ✅ CORREÇÃO: Cria configurações iniciais do Telegram
  const { error: integrationError } = await supabase
    .from('telegram_integration')
    .upsert({
      user_id: license.user_id,
      telegram_chat_id: telegramChatId,
      default_context: 'personal',
      show_context_confirmation: true,
      alert_at_80_percent: true,
      alert_at_90_percent: true
    }, { onConflict: 'user_id' });

  if (integrationError) {
    console.error('[SECURITY] Erro ao criar configurações do Telegram (não crítico):', integrationError);
    // Não falha a vinculação se apenas as configurações falharem
  }

  console.log(`[SECURITY] ✅ Chat ${telegramChatId} vinculado com sucesso ao usuário ${license.user_id}`);

  return {
    success: true,
    message: '✅ Conta vinculada com sucesso! Agora você pode usar todos os comandos:\n\n🔍 /saldo - Ver saldo das suas contas\n📊 /resumo - Resumo financeiro do mês\n🎯 /metas - Acompanhar suas metas\n❓ /ajuda - Ver lista completa de comandos\n\n💬 Ou simplesmente escreva como "Gastei 25 reais com almoço" que eu registro automaticamente!'
  };
}
// --- Funções de Manipulação de Comandos ---
async function handleCommand(supabase: any, command: string, userId: string, chatId: number, messageId?: number): Promise<void> {
  const [cmd, ...args] = command.split(' ');
  const argument = args.join(' ');

  switch (cmd.toLowerCase()) {
    case '/start':
    case '/ajuda':
    case '/help': {
      const message = `🤖 *Menu Zaq - Boas Contas*

📝 *Registro Rápido*
Apenas digite: "Almoço 25 reais" ou envie áudio!

💳 *Cartões de Crédito*
/faturas - Faturas pendentes
/pagar - Pagar fatura agora
/config\\_cartao - Automatizar pagamentos

👤 *Contexto & Família*
/contexto - Escolher (Pessoal vs Grupo)
/p - Mudar para Pessoal
/g - Mudar para Grupo

📊 *Relatórios*
/saldo - Saldos atuais
/extrato - Últimas transações
/resumo - Balanço do mês
/top\\_gastos - Onde você gastou mais
/comparar\\_meses - Evolução de gastos

🎯 *Planejamento*
/metas - Suas metas
/previsao - Projeção de gastos
/recorrentes - Contas fixas

⚙️ *Outros*
/ajuda - Este menu
/editar\\_ultima - Corrigir erro`;

      await sendTelegramMessage(chatId, message, { parse_mode: 'Markdown' });
      break;
    }

    // --- Comandos de Contexto ---
    case '/contexto': {
      const context = await getUserTelegramContext(supabase, userId);

      const message = `📌 *Escolha o contexto padrão*\n\n` +
        `Onde suas próximas transações serão registradas?\n\n` +
        `*Contexto atual:* ${context.defaultContext === 'personal' ? '👤 Pessoal' : '🏠 ' + (context.groupName || 'Grupo')}\n\n` +
        `${context.groupId ? '🏠 *Grupo:* Transações compartilhadas (ILIMITADAS)\n' : ''}` +
        `👤 *Pessoal:* Apenas você vê (75/mês para free)`;

      const keyboard: any = {
        inline_keyboard: [
          [{ text: context.defaultContext === 'personal' ? '✅ 👤 Pessoal' : '👤 Pessoal', callback_data: 'context_personal' }]
        ]
      };

      if (context.groupId) {
        keyboard.inline_keyboard.push([
          { text: context.defaultContext === 'group' ? `✅ 🏠 ${context.groupName || 'Grupo'}` : `🏠 ${context.groupName || 'Grupo'}`, callback_data: 'context_group' }
        ]);
      } else {
        keyboard.inline_keyboard.push([
          { text: '⚠️ Sem Grupo Familiar (Criar)', callback_data: 'context_no_group' }
        ]);
      }
      keyboard.inline_keyboard.push([{ text: '❌ Cancelar', callback_data: 'context_cancel' }]);

      await sendTelegramMessage(chatId, message, { parse_mode: 'Markdown', reply_markup: keyboard });
      break;
    }

    case '/p': {
      const { data: session } = await supabase.from('telegram_sessions').select('contexto').eq('telegram_id', chatId.toString()).single();
      const newContext = { ...(session?.contexto || {}), default_context: 'personal' };
      await supabase.from('telegram_sessions').upsert({
        user_id: userId, telegram_id: chatId.toString(), chat_id: chatId.toString(), contexto: newContext
      }, { onConflict: 'user_id,telegram_id' });
      await sendTelegramMessage(chatId, '✅ Contexto definido para: 👤 *Pessoal*');
      break;
    }

    case '/g': {
      const { data: session } = await supabase.from('telegram_sessions').select('contexto').eq('telegram_id', chatId.toString()).single();
      const newContext = { ...(session?.contexto || {}), default_context: 'group' };
      await supabase.from('telegram_sessions').upsert({
        user_id: userId, telegram_id: chatId.toString(), chat_id: chatId.toString(), contexto: newContext
      }, { onConflict: 'user_id,telegram_id' });
      await sendTelegramMessage(chatId, '✅ Contexto definido para: 🏠 *Grupo*');
      break;
    }

    case '/faturas': {
      await handleFaturaCommand(supabase, chatId, userId);
      break;
    }

    case '/pagar': {
      await handlePagarCommand(supabase, chatId, userId);
      break;
    }

    case '/categorias': {
      try {
        console.log('Buscando categorias para userId:', userId);
        // Buscar todas as categorias do usuário
        const { data: categorias, error: catError } = await supabase
          .from('categories')
          .select('*')
          .eq('user_id', userId);

        console.log('Categorias encontradas:', categorias?.length, 'Erro:', catError);

        if (catError) {
          console.error('Erro ao buscar categorias:', catError);
          await sendTelegramMessage(chatId, '❌ Erro ao buscar categorias: ' + catError.message);
          break;
        }

        if (!categorias || categorias.length === 0) {
          await sendTelegramMessage(chatId, '📂 Você ainda não tem categorias cadastradas.\n\nUse o app web para criar suas categorias.');
          break;
        }

        // Separar categorias pai e subcategorias
        const parentCategories = categorias.filter((c: any) => !c.parent_id);
        const subCategories = categorias.filter((c: any) => c.parent_id);

        // Mapeamento de nomes de ícones para emojis
        const iconMap: Record<string, string> = {
          // Transporte
          'car': '🚗', 'bus': '🚌', 'train': '🚆', 'plane': '✈️', 'bike': '🚴', 'fuel': '⛽',
          // Alimentação
          'shopping-bag': '🛍️', 'shopping-cart': '🛒', 'utensils': '🍴', 'coffee': '☕', 'pizza': '🍕', 'apple': '🍎',
          // Lazer e Entretenimento
          'gamepad': '🎮', 'gamepad-2': '🎮', 'tv': '📺', 'film': '🎬', 'music': '🎵', 'headphones': '🎧', 'party-popper': '🎉', 'sparkles': '✨',
          // Finanças e Investimentos
          'trending-up': '📈', 'trending-down': '📉', 'banknote': '💵', 'wallet': '👛', 'credit-card': '💳', 'piggy-bank': '🐷', 'coins': '🪙', 'dollar-sign': '💲',
          // Saúde
          'heart': '❤️', 'heart-pulse': '💓', 'stethoscope': '🩺', 'pill': '💊', 'activity': '🏃', 'apple': '🍎', 'dumbbell': '🏋️',
          // Trabalho
          'laptop': '💻', 'briefcase': '💼', 'building': '🏢', 'calculator': '🧮', 'tie': '👔',
          // Casa / Moradia
          'home': '🏠', 'house': '🏠', 'bed': '🛏️', 'sofa': '🛋️', 'lamp': '💡', 'wrench': '🔧', 'hammer': '🔨', 'armchair': '🪑',
          // Educação
          'book': '📚', 'graduation-cap': '🎓', 'pencil': '✏️', 'school': '🏫', 'brain': '🧠',
          // Família
          'users': '👥', 'user': '👤', 'baby': '👶', 'users-round': '👨‍👩‍👧‍👦',
          // Vida Espiritual / Religião
          'church': '⛪', 'cross': '✝️', 'pray': '🙏', 'hands': '🛐',
          // Despesas Fixas / Contas
          'receipt': '🧾', 'file-text': '📄', 'clipboard': '📋', 'scroll': '📜',
          // Impostos e Taxas
          'landmark': '🏛️', 'scale': '⚖️', 'percent': '💹',
          // Relacionamentos
          'gift': '🎁', 'heart-handshake': '🤝', 'cake': '🎂', 'ring': '💍',
          // Reserva / Prevenção
          'shield': '🛡️', 'lock': '🔒', 'umbrella': '☂️', 'tool': '🛠️', 'archive': '📦',
          // Metas e Projetos
          'target': '🎯', 'flag': '🚩', 'check-circle': '✅', 'rocket': '🚀',
          // Artigos Residenciais
          'couch': '🛋️', 'refrigerator': '🧊', 'washing-machine': '🧺', 'microwave': '📻',
          // Outros gerais
          'star': '⭐', 'zap': '⚡', 'smile': '😊', 'shirt': '👕', 'scissors': '✂️',
          'package': '📦', 'phone': '📱', 'mail': '📧', 'calendar': '📅', 'clock': '⏰',
          'map-pin': '📍', 'globe': '🌍', 'sun': '☀️', 'moon': '🌙', 'cloud': '☁️',
          'tree': '🌳', 'flower': '🌸', 'dog': '🐕', 'cat': '🐱', 'paw-print': '🐾',
        };

        const getEmoji = (iconName: string | null): string => {
          if (!iconName) return '📁';
          // Se já é um emoji, retorna diretamente
          if (/\p{Emoji}/u.test(iconName)) return iconName;
          // Busca no mapa
          return iconMap[iconName.toLowerCase()] || '📁';
        };

        let message = '📂 *Suas Categorias*\n\n';

        for (const parent of parentCategories) {
          const icon = getEmoji(parent.icone);
          message += `${icon} *${parent.nome}*\n`;

          // Encontrar subcategorias deste pai
          const children = subCategories.filter((sub: any) => sub.parent_id === parent.id);
          if (children.length > 0) {
            for (const child of children) {
              const childIcon = getEmoji(child.icone);
              message += `   └ ${childIcon} ${child.nome}\n`;
            }
          }
          message += '\n';
        }

        // Categorias órfãs (sem pai, mas que são subcategorias - caso de inconsistência)
        const orphanSubs = subCategories.filter((sub: any) =>
          !parentCategories.some((p: any) => p.id === sub.parent_id)
        );
        if (orphanSubs.length > 0) {
          message += `📋 *Outras*\n`;
          for (const orphan of orphanSubs) {
            const icon = getEmoji(orphan.icone);
            message += `   └ ${icon} ${orphan.nome}\n`;
          }
        }

        message += `\n📊 Total: ${categorias.length} categorias`;
        message += `\n\n💡 _Gerencie suas categorias pelo app web_`;

        await sendTelegramMessage(chatId, message);
      } catch (error: any) {
        console.error('Erro no comando /categorias:', error);
        await sendTelegramMessage(chatId, '❌ Erro ao processar categorias: ' + (error?.message || 'erro desconhecido'));
      }
      break;
    }

    case '/config_cartao':
    case '/configcartao': {
      await handleConfigCartaoCommand(supabase, chatId, userId);
      break;
    }

    case '/previsao': {
      try {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const daysInMonth = lastDay.getDate();
        const currentDay = now.getDate();
        const daysRemaining = daysInMonth - currentDay;

        // Buscar gastos do mês atual
        const { data: transactions } = await supabase
          .from('transactions')
          .select('tipo, valor')
          .eq('user_id', userId)
          .eq('tipo', 'despesa')
          .gte('data_transacao', firstDay.toISOString().split('T')[0])
          .lte('data_transacao', now.toISOString().split('T')[0]);

        const totalGasto = transactions?.reduce((sum: number, t: any) => sum + parseFloat(t.valor), 0) || 0;
        const mediaDiaria = currentDay > 0 ? totalGasto / currentDay : 0;
        const previsaoTotal = mediaDiaria * daysInMonth;
        const previsaoRestante = mediaDiaria * daysRemaining;

        // Buscar receitas do mês
        const { data: receitas } = await supabase
          .from('transactions')
          .select('valor')
          .eq('user_id', userId)
          .eq('tipo', 'receita')
          .gte('data_transacao', firstDay.toISOString().split('T')[0])
          .lte('data_transacao', lastDay.toISOString().split('T')[0]);

        const totalReceita = receitas?.reduce((sum: number, t: any) => sum + parseFloat(t.valor), 0) || 0;
        const saldoProjetado = totalReceita - previsaoTotal;

        let statusEmoji = saldoProjetado >= 0 ? '✅' : '⚠️';
        let statusMessage = saldoProjetado >= 0
          ? `Você deve terminar o mês com ${formatCurrency(saldoProjetado)} positivo!`
          : `Atenção! Você pode terminar o mês com ${formatCurrency(Math.abs(saldoProjetado))} negativo.`;

        const message = `📈 *Previsão de Gastos*\n\n` +
          `📅 Dia ${currentDay} de ${daysInMonth} (${daysRemaining} dias restantes)\n\n` +
          `💸 *Gastos até agora:* ${formatCurrency(totalGasto)}\n` +
          `📊 *Média diária:* ${formatCurrency(mediaDiaria)}\n\n` +
          `🔮 *Projeção para o mês:*\n` +
          `   Total previsto: ${formatCurrency(previsaoTotal)}\n` +
          `   Ainda vai gastar: ~${formatCurrency(previsaoRestante)}\n\n` +
          `💰 *Receitas do mês:* ${formatCurrency(totalReceita)}\n` +
          `${statusEmoji} *Saldo projetado:* ${formatCurrency(saldoProjetado)}\n\n` +
          `${statusMessage}`;

        await sendTelegramMessage(chatId, message, { parse_mode: 'Markdown' });
      } catch (error) {
        console.error('Erro em /previsao:', error);
        await sendTelegramMessage(chatId, '❌ Erro ao calcular previsão. Tente novamente.');
      }
      break;
    }

    case '/saldo': {
      const { data: accounts } = await supabase
        .from('accounts')
        .select('nome, saldo_atual, tipo')
        .eq('user_id', userId)
        .eq('ativo', true);

      if (!accounts || accounts.length === 0) {
        await sendTelegramMessage(chatId, '📭 Você ainda não tem contas cadastradas.');
        return;
      }

      const total = accounts.reduce((sum: number, acc: any) => sum + parseFloat(acc.saldo_atual || 0), 0);
      const accountsList = accounts
        .map((acc: any) => `  • ${acc.nome}: ${formatCurrency(parseFloat(acc.saldo_atual || 0))}`)
        .join('\n');

      const message = `💰 *Seus Saldos*\n\n${accountsList}\n\n━━━━━━━━━━━━━━━━\n*Total:* ${formatCurrency(total)}`;
      await sendTelegramMessage(chatId, message, { parse_mode: 'Markdown' });
      break;
    }

    case '/extrato': {
      const { data: transactions } = await supabase
        .from('transactions')
        .select(`
          *,
          category:categories(nome, cor),
          account:accounts!transactions_conta_origem_id_fkey(nome)
        `)
        .eq('user_id', userId)
        .order('data_transacao', { ascending: false })
        .limit(10);

      if (!transactions || transactions.length === 0) {
        await sendTelegramMessage(chatId, '📭 Nenhuma transação encontrada.');
        return;
      }

      const list = transactions.map((t: any) => {
        const icon = t.tipo === 'receita' ? '💚' : '💸';
        const date = new Date(t.data_transacao).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        return `${icon} ${date} - ${t.descricao}\n  ${formatCurrency(parseFloat(t.valor))} • ${t.category?.nome || 'Sem categoria'}`;
      }).join('\n\n');

      await sendTelegramMessage(chatId, `📋 *Últimas Transações*\n\n${list}`, { parse_mode: 'Markdown' });
      break;
    }

    case '/resumo': {
      const firstDay = new Date();
      firstDay.setDate(1);
      const lastDay = new Date(firstDay.getFullYear(), firstDay.getMonth() + 1, 0);

      const { data: transactions } = await supabase
        .from('transactions')
        .select('tipo, valor')
        .eq('user_id', userId)
        .gte('data_transacao', firstDay.toISOString().split('T')[0])
        .lte('data_transacao', lastDay.toISOString().split('T')[0]);

      const receitas = transactions?.filter((t: any) => t.tipo === 'receita')
        .reduce((sum: number, t: any) => sum + parseFloat(t.valor), 0) || 0;
      const despesas = transactions?.filter((t: any) => t.tipo === 'despesa')
        .reduce((sum: number, t: any) => sum + parseFloat(t.valor), 0) || 0;
      const saldo = receitas - despesas;

      const message = `📊 *Resumo do Mês*\n\n💚 Receitas: ${formatCurrency(receitas)}\n💸 Despesas: ${formatCurrency(despesas)}\n━━━━━━━━━━━━━━━━\n${saldo >= 0 ? '✅' : '⚠️'} Saldo: ${formatCurrency(saldo)}`;
      await sendTelegramMessage(chatId, message, { parse_mode: 'Markdown' });
      break;
    }

    case '/metas': {
      const { data: goals } = await supabase
        .from('goals')
        .select('titulo, valor_meta, valor_atual, data_fim')
        .eq('user_id', userId)
        .eq('status', 'ativa');

      if (!goals || goals.length === 0) {
        await sendTelegramMessage(chatId, '🎯 Você ainda não tem metas ativas.');
        return;
      }

      const list = goals.map((g: any) => {
        const progress = (parseFloat(g.valor_atual) / parseFloat(g.valor_meta)) * 100;
        const progressBar = '█'.repeat(Math.floor(progress / 10)) + '░'.repeat(10 - Math.floor(progress / 10));
        return `🎯 *${g.titulo}*\n${progressBar} ${progress.toFixed(0)}%\n${formatCurrency(parseFloat(g.valor_atual))} / ${formatCurrency(parseFloat(g.valor_meta))}`;
      }).join('\n\n');

      await sendTelegramMessage(chatId, `🎯 *Suas Metas*\n\n${list}`, { parse_mode: 'Markdown' });
      break;
    }

    case '/perguntar': {
      if (!argument) {
        await sendTelegramMessage(chatId, '❓ Use: /perguntar [sua pergunta]\n\nExemplos:\n• quanto gastei com iFood em setembro?\n• minhas receitas de freelance\n• quantas vezes gastei mais de 100 reais?');
        return;
      }

      const thinking = await sendTelegramMessage(chatId, '🤔 Analisando seus dados...');

      try {
        const response = await supabase.functions.invoke('query-engine', {
          body: { question: argument, userId }
        });

        if (response.error) throw response.error;

        await editTelegramMessage(chatId, thinking.result.message_id, `❓ *Pergunta:* ${argument}\n\n${response.data.answer}`, { parse_mode: 'Markdown' });
      } catch (error) {
        console.error('Erro no /perguntar:', error);
        await editTelegramMessage(chatId, thinking.result.message_id, '❌ Desculpe, ocorreu um erro ao processar sua pergunta.');
      }
      break;
    }

    case '/top_gastos':
    case '/topgastos': {
      const firstDay = new Date();
      firstDay.setDate(1);
      const lastDay = new Date(firstDay.getFullYear(), firstDay.getMonth() + 1, 0);

      const { data: transactions } = await supabase
        .from('transactions')
        .select('valor, category:categories(nome)')
        .eq('user_id', userId)
        .eq('tipo', 'despesa')
        .gte('data_transacao', firstDay.toISOString().split('T')[0])
        .lte('data_transacao', lastDay.toISOString().split('T')[0]);

      if (!transactions || transactions.length === 0) {
        await sendTelegramMessage(chatId, '📭 Nenhum gasto registrado este mês.');
        return;
      }

      const grouped = transactions.reduce((acc: any, t: any) => {
        const cat = t.category?.nome || 'Sem categoria';
        acc[cat] = (acc[cat] || 0) + parseFloat(t.valor);
        return acc;
      }, {});

      const sorted = Object.entries(grouped)
        .sort(([, a]: any, [, b]: any) => b - a)
        .slice(0, 5);

      const list = sorted.map(([cat, val]: any, i: number) =>
        `${i + 1}. *${cat}*: ${formatCurrency(val)}`
      ).join('\n');

      await sendTelegramMessage(chatId, `🔥 *Top 5 Gastos deste Mês*\n\n${list}`, { parse_mode: 'Markdown' });
      break;
    }

    case '/comparar_meses':
    case '/compararmeses': {
      const thisMonth = new Date();
      thisMonth.setDate(1);
      const lastMonth = new Date(thisMonth);
      lastMonth.setMonth(lastMonth.getMonth() - 1);

      const [thisMonthData, lastMonthData] = await Promise.all([
        supabase.from('transactions').select('valor').eq('user_id', userId).eq('tipo', 'despesa')
          .gte('data_transacao', thisMonth.toISOString().split('T')[0]),
        supabase.from('transactions').select('valor').eq('user_id', userId).eq('tipo', 'despesa')
          .gte('data_transacao', lastMonth.toISOString().split('T')[0])
          .lt('data_transacao', thisMonth.toISOString().split('T')[0])
      ]);

      const thisTotal = thisMonthData.data?.reduce((sum: number, t: any) => sum + parseFloat(t.valor), 0) || 0;
      const lastTotal = lastMonthData.data?.reduce((sum: number, t: any) => sum + parseFloat(t.valor), 0) || 0;
      const diff = thisTotal - lastTotal;
      const diffPercent = lastTotal > 0 ? ((diff / lastTotal) * 100).toFixed(1) : '0';

      const icon = diff > 0 ? '📈' : diff < 0 ? '📉' : '➡️';
      const trend = diff > 0 ? 'aumentaram' : diff < 0 ? 'diminuíram' : 'permaneceram iguais';

      const message = `📊 *Comparativo de Gastos*\n\n📅 Mês Anterior: ${formatCurrency(lastTotal)}\n📅 Mês Atual: ${formatCurrency(thisTotal)}\n\n${icon} Seus gastos ${trend} ${diffPercent}%\n(${diff >= 0 ? '+' : ''}${formatCurrency(Math.abs(diff))})`;
      await sendTelegramMessage(chatId, message, { parse_mode: 'Markdown' });
      break;
    }

    case '/previsao': {
      const firstDay = new Date();
      firstDay.setDate(1);
      const today = new Date();
      const daysInMonth = new Date(firstDay.getFullYear(), firstDay.getMonth() + 1, 0).getDate();
      const daysPassed = today.getDate();

      const { data: transactions } = await supabase
        .from('transactions')
        .select('valor')
        .eq('user_id', userId)
        .eq('tipo', 'despesa')
        .gte('data_transacao', firstDay.toISOString().split('T')[0]);

      const totalSoFar = transactions?.reduce((sum: number, t: any) => sum + parseFloat(t.valor), 0) || 0;
      const dailyAverage = totalSoFar / daysPassed;
      const projection = dailyAverage * daysInMonth;

      const message = `🔮 *Previsão de Gastos*\n\n📊 Gasto até agora: ${formatCurrency(totalSoFar)}\n📈 Média diária: ${formatCurrency(dailyAverage)}\n\n💡 Projeção para o mês:\n*${formatCurrency(projection)}*\n\n(baseado em ${daysPassed} dias de ${daysInMonth})`;
      await sendTelegramMessage(chatId, message, { parse_mode: 'Markdown' });
      break;
    }

    case '/editar_ultima':
    case '/editarultima': {
      const { data: lastTransaction } = await supabase
        .from('transactions')
        .select(`
          *,
          category:categories(nome),
          account:accounts!transactions_conta_origem_id_fkey(nome)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!lastTransaction) {
        await sendTelegramMessage(chatId, '📭 Você ainda não tem transações para editar.');
        return;
      }

      // Salvar ID da transação na sessão
      await supabase
        .from('telegram_sessions')
        .upsert({
          user_id: userId,
          telegram_id: chatId.toString(),
          chat_id: chatId.toString(),
          contexto: { editing_transaction_id: lastTransaction.id }
        }, { onConflict: 'user_id,telegram_id' });

      const date = new Date(lastTransaction.data_transacao).toLocaleDateString('pt-BR');
      const message = `✏️ *Editar Transação*\n\n📝 ${lastTransaction.descricao}\n💰 ${formatCurrency(parseFloat(lastTransaction.valor))}\n📁 ${lastTransaction.category?.nome || 'Sem categoria'}\n🏦 ${lastTransaction.account?.nome || 'Sem conta'}\n📅 ${date}\n\nO que deseja editar?`;

      const keyboard = {
        inline_keyboard: [
          [
            { text: '✏️ Descrição', callback_data: 'edit_description' },
            { text: '💰 Valor', callback_data: 'edit_amount' }
          ],
          [
            { text: '📁 Categoria', callback_data: 'edit_category' },
            { text: '🏦 Conta', callback_data: 'edit_account' }
          ],
          [
            { text: '📅 Data', callback_data: 'edit_date' },
            { text: '🗑️ Deletar', callback_data: 'edit_delete' }
          ],
          [
            { text: '❌ Cancelar', callback_data: 'edit_cancel' }
          ]
        ]
      };

      await sendTelegramMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });
      break;
    }

    case '/recorrente_nova': {
      const message = `🔄 *Nova Conta Recorrente*\n\nPara criar uma transação recorrente, envie uma mensagem no formato:\n\n*Exemplo:*\n"Aluguel de R$ 1.200,00 mensal no dia 5"\n"Salário de R$ 5.000,00 mensal"\n"Netflix de R$ 45,90 mensal"\n\n*Frequências disponíveis:*\n• Diária\n• Semanal\n• Mensal\n• Trimestral\n• Semestral\n• Anual\n\n*Para especificar dia:*\n• "mensal no dia 15"\n• "semanal na segunda"`;
      await sendTelegramMessage(chatId, message, { parse_mode: 'Markdown' });
      break;
    }

    case '/recorrentes': {
      try {
        const { data: recurring, error } = await supabase
          .from('recurring_transactions')
          .select(`
            *,
            category:categories(nome, cor),
            account:accounts(nome)
          `)
          .eq('user_id', userId)
          .eq('is_active', true)
          .order('next_due_date', { ascending: true });

        if (error) throw error;

        if (!recurring || recurring.length === 0) {
          await sendTelegramMessage(chatId, '📋 *Contas Recorrentes*\n\nNenhuma transação recorrente ativa encontrada.\n\nUse /recorrente_nova para criar uma nova.');
          break;
        }

        let message = '📋 *Contas Recorrentes Ativas*\n\n';

        recurring.forEach((item, index) => {
          const emoji = item.type === 'receita' ? '💰' : '💸';
          const status = item.next_due_date <= new Date().toISOString().split('T')[0] ? '🔴' : '🟢';
          const frequency = item.frequency === 'diaria' ? 'Diária' :
            item.frequency === 'semanal' ? 'Semanal' :
              item.frequency === 'mensal' ? 'Mensal' :
                item.frequency === 'trimestral' ? 'Trimestral' :
                  item.frequency === 'semestral' ? 'Semestral' : 'Anual';

          message += `${emoji} *${item.title}*\n`;
          message += `   ${formatCurrency(item.amount)} - ${frequency}\n`;
          message += `   ${status} Próxima: ${new Date(item.next_due_date).toLocaleDateString('pt-BR')}\n`;
          if (item.category) message += `   📂 ${item.category.nome}\n`;
          message += '\n';
        });

        await sendTelegramMessage(chatId, message, { parse_mode: 'Markdown' });
      } catch (error) {
        console.error('Erro ao buscar contas recorrentes:', error);
        await sendTelegramMessage(chatId, '❌ Erro ao carregar contas recorrentes.');
      }
      break;
    }

    case '/pausar_recorrente': {
      try {
        const { data: recurring, error } = await supabase
          .from('recurring_transactions')
          .select('id, title, is_active')
          .eq('user_id', userId)
          .order('title');

        if (error) throw error;

        if (!recurring || recurring.length === 0) {
          await sendTelegramMessage(chatId, '📋 *Pausar Conta Recorrente*\n\nNenhuma transação recorrente encontrada.');
          break;
        }

        const keyboard = {
          inline_keyboard: recurring.map(item => [{
            text: `${item.is_active ? '⏸️' : '▶️'} ${item.title}`,
            callback_data: `toggle_recurring_${item.id}`
          }])
        };

        await sendTelegramMessage(chatId, '📋 *Pausar/Reativar Conta Recorrente*\n\nSelecione uma transação:', {
          reply_markup: keyboard
        });
      } catch (error) {
        console.error('Erro ao buscar contas recorrentes:', error);
        await sendTelegramMessage(chatId, '❌ Erro ao carregar contas recorrentes.');
      }
      break;
    }

    case '/tutorial': {
      const message = `🎓 *Tutorial do Zaq - Boas Contas*\n\n📱 *Acesse o tutorial completo:*\n🔗 [Abrir Tutorial](https://app.boascontas.com/onboarding)\n\n*Resumo rápido:*\n\n💰 *Transações:*\n• "Gastei R$ 50 no mercado"\n• "Recebi R$ 1000 de salário"\n• "Transferi R$ 200 da conta para carteira"\n\n🤖 *Comandos úteis:*\n• /saldo - Ver saldo das contas\n• /extrato - Últimas transações\n• /metas - Progresso das metas\n• /perguntar - Faça perguntas sobre gastos\n\n👥 *Gestão Familiar:*\n• Convide membros da família\n• Controle permissões\n• Compartilhe finanças\n\n🎯 *Metas e Orçamento:*\n• Defina objetivos financeiros\n• Acompanhe progresso\n• Planeje o futuro\n\n📊 *Relatórios Inteligentes:*\n• Gráficos de evolução\n• Análises de padrões\n• IA para insights\n\n💡 *Dica:* Complete o tutorial no app para uma experiência completa!`;
      await sendTelegramMessage(chatId, message, { parse_mode: 'Markdown' });
      break;
    }

    case '/meuperfil': {
      // Buscar perfil financeiro do usuário
      const { data: financialProfile, error: profileError } = await supabase
        .from('financial_profile')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (profileError) {
        await sendTelegramMessage(chatId, '❌ Erro ao buscar seu perfil financeiro. Tente novamente.');
        break;
      }

      if (!financialProfile) {
        const message = `📊 *Seu Perfil Financeiro*\n\n❌ Você ainda não completou o quiz de saúde financeira.\n\n🎯 *Para descobrir seu perfil:*\n🔗 [Fazer Quiz](https://app.boascontas.com/quiz-financeiro)\n\n*O quiz avalia:*\n• Fundo de emergência\n• Situação de dívidas\n• Taxa de poupança\n• Conhecimento em investimentos\n• Objetivos financeiros\n• Controle de orçamento\n• Cobertura de seguros\n• Planejamento de aposentadoria\n\n💡 *Benefícios:*\n• Score de saúde financeira (0-100)\n• Recomendações personalizadas\n• Estratégias de melhoria\n\n🎓 Complete o quiz para receber insights valiosos sobre suas finanças!`;
        await sendTelegramMessage(chatId, message, { parse_mode: 'Markdown' });
        break;
      }

      // Calcular nível de saúde financeira
      const score = financialProfile.financial_health_score;
      let healthLevel = '';
      let healthEmoji = '';

      if (score >= 80) {
        healthLevel = 'Excelente';
        healthEmoji = '🟢';
      } else if (score >= 60) {
        healthLevel = 'Bom';
        healthEmoji = '🔵';
      } else if (score >= 40) {
        healthLevel = 'Regular';
        healthEmoji = '🟡';
      } else if (score >= 20) {
        healthLevel = 'Precisa Melhorar';
        healthEmoji = '🟠';
      } else {
        healthLevel = 'Crítico';
        healthEmoji = '🔴';
      }

      // Processar recomendações
      let recommendations = [];
      try {
        recommendations = Array.isArray(financialProfile.recommendations)
          ? financialProfile.recommendations
          : JSON.parse(financialProfile.recommendations as string);
      } catch {
        recommendations = [];
      }

      const message = `📊 *Seu Perfil Financeiro*\n\n${healthEmoji} *Score de Saúde Financeira: ${score}/100 - ${healthLevel}*\n\n📈 *Progresso:*\n${'█'.repeat(Math.floor(score / 10))}${'░'.repeat(10 - Math.floor(score / 10))} ${score}%\n\n🎯 *Suas Respostas:*\n• Fundo de Emergência: ${getEmergencyFundLabel(financialProfile.emergency_fund)}\n• Dívidas: ${getDebtSituationLabel(financialProfile.debt_situation)}\n• Poupança: ${getSavingsRateLabel(financialProfile.savings_rate)}\n• Investimentos: ${getInvestmentKnowledgeLabel(financialProfile.investment_knowledge)}\n• Objetivos: ${getFinancialGoalsLabel(financialProfile.financial_goals)}\n• Orçamento: ${getBudgetControlLabel(financialProfile.budget_control)}\n• Seguros: ${getInsuranceCoverageLabel(financialProfile.insurance_coverage)}\n• Aposentadoria: ${getRetirementPlanningLabel(financialProfile.retirement_planning)}\n\n💡 *Recomendações:*\n${recommendations.slice(0, 3).map((rec: string, i: number) => `${i + 1}. ${rec}`).join('\n')}\n\n🔗 [Ver Perfil Completo](https://app.boascontas.com/quiz-financeiro)\n\n📅 *Última atualização:* ${new Date(financialProfile.completed_at).toLocaleDateString('pt-BR')}`;

      await sendTelegramMessage(chatId, message, { parse_mode: 'Markdown' });
      break;
    }

    case '/contexto':
    case '/ctx': {
      const context = await getUserTelegramContext(supabase, userId);

      const message = `📌 *Escolha o contexto padrão*\n\n` +
        `Onde suas próximas transações serão registradas?\n\n` +
        `*Contexto atual:* ${context.defaultContext === 'personal' ? '👤 Pessoal' : '🏠 ' + (context.groupName || 'Grupo')}\n\n` +
        `${context.groupId ? '🏠 *Grupo:* Transações compartilhadas (ILIMITADAS)\n' : ''}` +
        `👤 *Pessoal:* Apenas você vê (75/mês para free)`;

      const keyboard: any = {
        inline_keyboard: [
          [{ text: context.defaultContext === 'personal' ? '✅ 👤 Pessoal' : '👤 Pessoal', callback_data: 'context_personal' }]
        ]
      };

      if (context.groupId) {
        keyboard.inline_keyboard.push([
          { text: context.defaultContext === 'group' ? `✅ 🏠 ${context.groupName}` : `🏠 ${context.groupName}`, callback_data: 'context_group' }
        ]);
      } else {
        keyboard.inline_keyboard.push([
          { text: '⚠️ Você não está em nenhum grupo', callback_data: 'context_no_group' }
        ]);
      }

      keyboard.inline_keyboard.push([{ text: '❌ Cancelar', callback_data: 'context_cancel' }]);

      await sendTelegramMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });
      break;
    }

    case '/p': {
      await setUserTelegramContext(supabase, userId, 'personal');

      const { data: limits } = await supabase.rpc('check_transaction_limit', { user_id: userId });
      const usage = limits?.usage || 0;
      const limit = limits?.limit || 75;

      const message = `✅ *Contexto alterado!*\n\n` +
        `📌 Suas transações agora vão para:\n` +
        `👤 *Pessoal* (só você vê)\n\n` +
        `📊 Limite: ${usage}/${limit} transações este mês\n\n` +
        `💡 Para voltar ao grupo: /g`;

      await sendTelegramMessage(chatId, message, { parse_mode: 'Markdown' });
      break;
    }

    case '/g':
    case '/grupo': {
      const context = await getUserTelegramContext(supabase, userId);

      if (!context.groupId) {
        await sendTelegramMessage(
          chatId,
          '⚠️ Você não está em nenhum grupo familiar.\n\n' +
          '👥 Para criar ou entrar em um grupo, acesse:\n' +
          '🔗 [App Boas Contas](https://app.boascontas.com/familia)',
          { parse_mode: 'Markdown' }
        );
        return;
      }

      await setUserTelegramContext(supabase, userId, 'group');

      const message = `✅ *Contexto alterado!*\n\n` +
        `📌 Suas transações agora vão para:\n` +
        `🏠 *${context.groupName}*\n\n` +
        `♾️ Transações do grupo: ILIMITADAS\n` +
        `👥 Todos do grupo verão suas transações\n\n` +
        `💡 Para voltar ao pessoal: /p`;

      await sendTelegramMessage(chatId, message, { parse_mode: 'Markdown' });
      break;
    }

    case '/config': {
      const context = await getUserTelegramContext(supabase, userId);

      const message = `⚙️ *Configurações do Telegram*\n\n` +
        `📌 *Contexto Padrão:*\n` +
        `${context.defaultContext === 'personal' ? '● ' : '○ '}👤 Pessoal\n` +
        `${context.defaultContext === 'group' ? '● ' : '○ '}🏠 ${context.groupName || 'Grupo'}\n\n` +
        `🔔 *Avisos de Limite:*\n` +
        `${context.alertAt80 ? '✅' : '☐'} Avisar em 80% (60/75)\n` +
        `${context.alertAt90 ? '✅' : '☐'} Avisar em 90% (68/75)\n\n` +
        `━━━━━━━━━━━━━━━━\n` +
        `💡 *Sobre o contexto:*\n` +
        `• Transações do grupo: ILIMITADAS\n` +
        `• Transações pessoais: 75/mês (free)\n` +
        `• Use #p ou #g para mudar pontualmente`;

      const keyboard = {
        inline_keyboard: [
          [{ text: '📌 Trocar Contexto', callback_data: 'config_context' }],
          [{ text: '❌ Fechar', callback_data: 'config_close' }]
        ]
      };

      await sendTelegramMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });
      break;
    }

    case '/comprar_ativo': {
      if (!argument) {
        await sendTelegramMessage(chatId, '📈 *Registrar Compra de Ativo*\n\nExemplos:\n• Comprei 10 ações PETR4 a R$ 35,50\n• Comprei 5 VALE3 por R$ 68,20\n• Comprei 100 ações ITSA4 a 12,50');
        return;
      }

      const thinking = await sendTelegramMessage(chatId, '🤔 Processando compra...');

      try {
        const response = await supabase.functions.invoke('nlp-transaction', {
          body: { message: `COMPRA DE ATIVO: ${argument}`, userId }
        });

        if (response.error) throw response.error;

        const result = response.data;

        // Extrair dados da transação
        const ticker = result.description?.match(/[A-Z]{4}\d{1,2}/)?.[0];
        const quantidade = parseFloat(result.amount || 0);
        const preco = result.additionalInfo?.price || 0;

        if (!ticker || quantidade <= 0) {
          await editTelegramMessage(chatId, thinking.message_id, '❌ Não consegui identificar o ativo ou quantidade. Use o formato:\n"Comprei 10 ações PETR4 a R$ 35,50"');
          return;
        }

        // Inserir transação de investimento
        const { error: insertError } = await supabase
          .from('investment_transactions')
          .insert({
            user_id: userId,
            ticker: ticker,
            transaction_type: 'compra',
            quantity: quantidade,
            price: preco,
            total_value: quantidade * preco,
            transaction_date: new Date().toISOString().split('T')[0],
            notes: argument
          });

        if (insertError) throw insertError;

        await editTelegramMessage(
          chatId,
          thinking.message_id,
          `✅ *Compra Registrada!*\n\n📈 ${ticker}\n💰 ${quantidade} ações\n💵 R$ ${preco.toFixed(2)} cada\n\n💎 Total: ${formatCurrency(quantidade * preco)}`,
          { parse_mode: 'Markdown' }
        );
      } catch (error) {
        console.error('Erro ao registrar compra:', error);
        await editTelegramMessage(chatId, thinking.message_id, '❌ Erro ao processar compra. Tente: "Comprei 10 ações PETR4 a R$ 35,50"');
      }
      break;
    }

    case '/vender_ativo': {
      if (!argument) {
        await sendTelegramMessage(chatId, '📉 *Registrar Venda de Ativo*\n\nExemplos:\n• Vendi 5 ações VALE3 a R$ 68,20\n• Vendi 10 PETR4 por R$ 37,00\n• Vendi 50 ações ITSA4 a 13,20');
        return;
      }

      const thinking = await sendTelegramMessage(chatId, '🤔 Processando venda...');

      try {
        const response = await supabase.functions.invoke('nlp-transaction', {
          body: { message: `VENDA DE ATIVO: ${argument}`, userId }
        });

        if (response.error) throw response.error;

        const result = response.data;

        const ticker = result.description?.match(/[A-Z]{4}\d{1,2}/)?.[0];
        const quantidade = parseFloat(result.amount || 0);
        const preco = result.additionalInfo?.price || 0;

        if (!ticker || quantidade <= 0) {
          await editTelegramMessage(chatId, thinking.message_id, '❌ Não consegui identificar o ativo ou quantidade. Use o formato:\n"Vendi 5 ações VALE3 a R$ 68,20"');
          return;
        }

        const { error: insertError } = await supabase
          .from('investment_transactions')
          .insert({
            user_id: userId,
            ticker: ticker,
            transaction_type: 'venda',
            quantity: quantidade,
            price: preco,
            total_value: quantidade * preco,
            transaction_date: new Date().toISOString().split('T')[0],
            notes: argument
          });

        if (insertError) throw insertError;

        await editTelegramMessage(
          chatId,
          thinking.message_id,
          `✅ *Venda Registrada!*\n\n📉 ${ticker}\n💰 ${quantidade} ações\n💵 R$ ${preco.toFixed(2)} cada\n\n💎 Total: ${formatCurrency(quantidade * preco)}`,
          { parse_mode: 'Markdown' }
        );
      } catch (error) {
        console.error('Erro ao registrar venda:', error);
        await editTelegramMessage(chatId, thinking.message_id, '❌ Erro ao processar venda. Tente: "Vendi 5 ações VALE3 a R$ 68,20"');
      }
      break;
    }

    case '/provento': {
      if (!argument) {
        await sendTelegramMessage(chatId, '💰 *Registrar Provento*\n\nExemplos:\n• Recebi R$ 12,50 de dividendos de ITSA4\n• Provento de R$ 25,00 de PETR4\n• Dividendo VALE3 R$ 8,75');
        return;
      }

      const thinking = await sendTelegramMessage(chatId, '🤔 Registrando provento...');

      try {
        const ticker = argument.match(/[A-Z]{4}\d{1,2}/)?.[0];
        const valorMatch = argument.match(/R?\$?\s*(\d+(?:[.,]\d{2})?)/);
        const valor = valorMatch ? parseFloat(valorMatch[1].replace(',', '.')) : 0;

        if (!ticker || valor <= 0) {
          await editTelegramMessage(chatId, thinking.message_id, '❌ Não consegui identificar o ativo ou valor. Use o formato:\n"Recebi R$ 12,50 de dividendos de ITSA4"');
          return;
        }

        const { error: insertError } = await supabase
          .from('investment_transactions')
          .insert({
            user_id: userId,
            ticker: ticker,
            transaction_type: 'provento',
            quantity: 0,
            price: 0,
            total_value: valor,
            transaction_date: new Date().toISOString().split('T')[0],
            notes: argument
          });

        if (insertError) throw insertError;

        await editTelegramMessage(
          chatId,
          thinking.message_id,
          `✅ *Provento Registrado!*\n\n💰 ${ticker}\n💵 ${formatCurrency(valor)}\n\n📅 ${new Date().toLocaleDateString('pt-BR')}`,
          { parse_mode: 'Markdown' }
        );
      } catch (error) {
        console.error('Erro ao registrar provento:', error);
        await editTelegramMessage(chatId, thinking.message_id, '❌ Erro ao processar provento. Tente: "Recebi R$ 12,50 de dividendos de ITSA4"');
      }
      break;
    }

    case '/carteira': {
      try {
        const { data: investments } = await supabase
          .from('investments')
          .select('*')
          .eq('user_id', userId)
          .gt('quantity', 0)
          .order('ticker');

        if (!investments || investments.length === 0) {
          await sendTelegramMessage(chatId, '📊 *Sua Carteira*\n\n📭 Você ainda não tem investimentos cadastrados.\n\nUse /comprar_ativo para registrar sua primeira compra!');
          return;
        }

        let totalValue = 0;
        let totalProfit = 0;
        const list = investments.map((inv: any) => {
          const currentValue = inv.quantity * inv.current_price;
          const costBasis = inv.quantity * inv.average_price;
          const profit = currentValue - costBasis;
          const profitPercent = ((profit / costBasis) * 100).toFixed(2);

          totalValue += currentValue;
          totalProfit += profit;

          const profitIcon = profit >= 0 ? '📈' : '📉';
          return `${profitIcon} *${inv.ticker}*\n   ${inv.quantity} ações × R$ ${inv.current_price.toFixed(2)}\n   PM: R$ ${inv.average_price.toFixed(2)} | ${profitPercent}%\n   ${formatCurrency(currentValue)}`;
        }).join('\n\n');

        const totalProfitPercent = totalValue > 0 ? ((totalProfit / (totalValue - totalProfit)) * 100).toFixed(2) : '0';

        const message = `📊 *Sua Carteira de Investimentos*\n\n${list}\n\n━━━━━━━━━━━━━━━━\n💎 *Valor Total:* ${formatCurrency(totalValue)}\n${totalProfit >= 0 ? '📈' : '📉'} *Lucro:* ${formatCurrency(totalProfit)} (${totalProfitPercent}%)`;

        await sendTelegramMessage(chatId, message, { parse_mode: 'Markdown' });
      } catch (error) {
        console.error('Erro ao buscar carteira:', error);
        await sendTelegramMessage(chatId, '❌ Erro ao carregar carteira.');
      }
      break;
    }

    case '/patrimonio': {
      const thinking = await sendTelegramMessage(chatId, '🤔 Calculando patrimônio...');

      try {
        const response = await supabase.functions.invoke('calculate-net-worth');

        if (response.error) throw response.error;

        const data = response.data;
        const netWorth = data.netWorth || 0;
        const cash = data.breakdown?.cash || 0;
        const investments = data.breakdown?.investments || 0;
        const debts = data.breakdown?.debts || 0;

        const message = `💎 *Seu Patrimônio Líquido*\n\n━━━━━━━━━━━━━━━━\n💰 *Total:* ${formatCurrency(netWorth)}\n━━━━━━━━━━━━━━━━\n\n📊 *Composição:*\n\n💵 Contas: ${formatCurrency(cash)}\n📈 Investimentos: ${formatCurrency(investments)}\n💳 Dívidas: ${formatCurrency(debts)}\n\n📅 Atualizado em: ${new Date(data.calculatedAt).toLocaleString('pt-BR')}`;

        await editTelegramMessage(chatId, thinking.message_id, message, { parse_mode: 'Markdown' });
      } catch (error) {
        console.error('Erro ao calcular patrimônio:', error);
        await editTelegramMessage(chatId, thinking.message_id, '❌ Erro ao calcular patrimônio. Tente novamente.');
      }
      break;
    }

    case '/dividas': {
      try {
        const { data: debts } = await supabase
          .from('accounts')
          .select('*')
          .eq('user_id', userId)
          .eq('ativo', true)
          .or('tipo.eq.cartao_credito,debt_type.not.is.null')
          .order('saldo_atual', { ascending: false });

        if (!debts || debts.length === 0) {
          await sendTelegramMessage(chatId, '✅ *Parabéns!*\n\nVocê não tem dívidas cadastradas no momento! 🎉');
          return;
        }

        let totalDebt = 0;
        const list = debts.map((debt: any) => {
          const balance = Math.abs(parseFloat(debt.saldo_atual || 0));
          totalDebt += balance;

          let details = `💳 *${debt.nome}*\n   Saldo: ${formatCurrency(balance)}`;

          if (debt.tipo === 'cartao_credito') {
            details += `\n   Limite: ${formatCurrency(parseFloat(debt.limite_credito || 0))}`;
            if (debt.dia_vencimento) {
              details += `\n   Vencimento: dia ${debt.dia_vencimento}`;
            }
          }

          if (debt.monthly_payment) {
            details += `\n   Parcela: ${formatCurrency(parseFloat(debt.monthly_payment))}`;
          }

          if (debt.remaining_installments) {
            details += `\n   Faltam: ${debt.remaining_installments} parcelas`;
          }

          return details;
        }).join('\n\n');

        const message = `💳 *Suas Dívidas*\n\n${list}\n\n━━━━━━━━━━━━━━━━\n⚠️ *Total de Dívidas:* ${formatCurrency(totalDebt)}`;

        await sendTelegramMessage(chatId, message, { parse_mode: 'Markdown' });
      } catch (error) {
        console.error('Erro ao buscar dívidas:', error);
        await sendTelegramMessage(chatId, '❌ Erro ao carregar dívidas.');
      }
      break;
    }

    case '/orcamento': {
      try {
        const firstDay = new Date();
        firstDay.setDate(1);
        const month = firstDay.toISOString().split('T')[0];

        const { data: budgets } = await supabase.rpc('get_budgets_with_spent', { p_month: month });

        if (!budgets || budgets.length === 0) {
          await sendTelegramMessage(chatId, '📊 *Orçamento do Mês*\n\n📭 Você ainda não definiu orçamentos.\n\n💡 Acesse o app para criar seus orçamentos: https://app.boascontas.com/orcamento');
          return;
        }

        let totalBudget = 0;
        let totalSpent = 0;

        const list = budgets.map((b: any) => {
          const budget = parseFloat(b.amount);
          const spent = parseFloat(b.spent);
          const remaining = budget - spent;
          const percent = budget > 0 ? ((spent / budget) * 100).toFixed(0) : '0';

          totalBudget += budget;
          totalSpent += spent;

          const icon = spent > budget ? '🔴' : spent > budget * 0.8 ? '🟡' : '🟢';
          const bar = '█'.repeat(Math.min(10, Math.floor((spent / budget) * 10))) + '░'.repeat(Math.max(0, 10 - Math.floor((spent / budget) * 10)));

          return `${icon} *${b.category_name}*\n${bar} ${percent}%\n${formatCurrency(spent)} / ${formatCurrency(budget)}\n${remaining >= 0 ? '✅' : '⚠️'} Restante: ${formatCurrency(Math.abs(remaining))}`;
        }).join('\n\n');

        const totalPercent = totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(0) : '0';
        const totalRemaining = totalBudget - totalSpent;

        const message = `📊 *Orçamento de ${new Date().toLocaleDateString('pt-BR', { month: 'long' })}*\n\n${list}\n\n━━━━━━━━━━━━━━━━\n💰 *Total Orçado:* ${formatCurrency(totalBudget)}\n💸 *Total Gasto:* ${formatCurrency(totalSpent)} (${totalPercent}%)\n${totalRemaining >= 0 ? '✅' : '⚠️'} *Saldo:* ${formatCurrency(Math.abs(totalRemaining))}`;

        await sendTelegramMessage(chatId, message, { parse_mode: 'Markdown' });
      } catch (error) {
        console.error('Erro ao buscar orçamento:', error);
        await sendTelegramMessage(chatId, '❌ Erro ao carregar orçamento.');
      }
      break;
    }

    case '/ajuda':
    default: {
      const message = `🤖 *Menu Zaq - Boas Contas*

📝 *Registro Rápido*
Apenas digite: "Almoço 25 reais" ou envie áudio!

💳 *Cartões de Crédito*
/faturas - Faturas pendentes
/pagar - Pagar fatura agora
/config_cartao - Automatizar pagamentos

👤 *Contexto & Família*
/contexto - Escolher (Pessoal vs Grupo)
/p - Mudar para Pessoal
/g - Mudar para Grupo

📊 *Relatórios*
/saldo - Saldos atuais
/extrato - Últimas transações
/resumo - Balanço do mês
/top_gastos - Onde você gastou mais
/comparar_meses - Evolução de gastos

🎯 *Planejamento*
/metas - Suas metas
/previsao - Projeção de gastos
/recorrentes - Contas fixas

⚙️ *Outros*
/ajuda - Este menu
/editar_ultima - Corrigir erro

🌐 *Acesse o app web:*
📱 https://app.boascontas.com`;

      await sendTelegramMessage(chatId, message, { parse_mode: 'Markdown' });
      break;
    }
  }
}
// --- Lógica Principal do Webhook ---
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    const body = await req.json();
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

    // ============================================================================
    // RATE LIMITING - Proteção contra abuso (60 req/min por usuário)
    // ============================================================================

    // Extrair telegram_id do update (mensagem ou callback)
    const telegramId = body.message?.from?.id || body.callback_query?.from?.id;

    if (!telegramId) {
      console.log('[Rate Limit] Telegram ID não encontrado no update, permitindo...');
    } else {
      // Verificar rate limit
      const { data: rateLimitCheck, error: rateLimitError } = await supabaseAdmin.rpc('check_rate_limit', {
        p_telegram_id: telegramId,
        p_limit: 60,
        p_window_seconds: 60
      });

      if (rateLimitError) {
        console.error('[Rate Limit] Erro ao verificar:', rateLimitError);
        // Em caso de erro na verificação, permitir acesso (fail-open)
      } else if (rateLimitCheck && rateLimitCheck[0] && !rateLimitCheck[0].allowed) {
        // Limite excedido - bloquear
        const resetAt = new Date(rateLimitCheck[0].reset_at);
        const secondsRemaining = Math.ceil((resetAt.getTime() - Date.now()) / 1000);

        console.log(`[Rate Limit] Bloqueado telegram_id ${telegramId}. Reset em ${secondsRemaining}s`);

        const chatId = body.message?.chat?.id || body.callback_query?.message?.chat?.id;
        if (chatId) {
          await sendTelegramMessage(chatId,
            `⏱️ *Muitas requisições!*\n\n` +
            `Por favor, aguarde *${secondsRemaining}s* antes de enviar novos comandos.\n\n` +
            `_Limite: 60 mensagens por minuto_`
          );
        }

        return new Response(JSON.stringify({
          ok: false,
          error: 'Rate limit exceeded',
          retry_after: secondsRemaining
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } else {
        // Permitido - log informativo
        const remaining = rateLimitCheck?.[0]?.remaining ?? '?';
        console.log(`[Rate Limit] ✅ Permitido telegram_id ${telegramId}. Remaining: ${remaining}/60`);
      }
    }

    // ============================================================================
    // FIM RATE LIMITING
    // ============================================================================

    // Trata cliques em botões de confirmação e edição
    if (body.callback_query) {
      const callbackQuery = body.callback_query;
      const chatId = callbackQuery.message.chat.id;
      const messageId = callbackQuery.message.message_id;
      const data = callbackQuery.data;

      // Buscar perfil do usuário pelo telegram_chat_id
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('user_id')
        .eq('telegram_chat_id', chatId)
        .single();

      if (!profile) {
        return new Response('OK', { status: 200, headers: corsHeaders });
      }
      const userId = profile.user_id;

      // ============================================================================
      // HANDLERS DE MENU INTERATIVO
      // ============================================================================

      // Navegação entre menus
      if (data.startsWith('menu_')) {
        const menuType = data.replace('menu_', '');
        await handleMenuCallback(chatId, messageId, menuType);
        await answerCallbackQuery(callbackQuery.id);
        return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
      }

      // Ações diretas (executar comandos via botões)
      if (data.startsWith('action_')) {
        const action = data.replace('action_', '');

        // Mapa de ações para comandos
        const commandMap: Record<string, string> = {
          'faturas': '/faturas',
          'pagar': '/pagar',
          'config_cartao': '/config_cartao',
          'saldo': '/saldo',
          'resumo': '/resumo',
          'extrato': '/extrato',
          'top_gastos': '/top_gastos',
          'metas': '/metas',
          'recorrentes': '/recorrentes',
          'orcamento': '/orcamento',
          'dividas': '/dividas',
          'contexto': '/contexto',
          'editar_ultima': '/editar_ultima',
          'categorias': '/categorias'
        };

        const command = commandMap[action];
        if (command) {
          // Responder callback primeiro
          await answerCallbackQuery(callbackQuery.id, { text: `Executando ${command}...` });

          // Executar comando
          await handleCommand(supabaseAdmin, command, userId, chatId);
          return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
        }
      }

      // ============================================================================
      // FIM HANDLERS DE MENU
      // ============================================================================

      // Ações de edição de transação
      if (data.startsWith('edit_')) {
        const { data: session } = await supabaseAdmin
          .from('telegram_sessions')
          .select('contexto')
          .eq('user_id', userId)
          .eq('telegram_id', callbackQuery.from.id.toString())
          .single();

        const transactionId = session?.contexto?.editing_transaction_id;

        if (!transactionId) {
          await editTelegramMessage(chatId, messageId, '❌ Sessão expirada. Use /editar_ultima novamente.');
          return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
        }

        if (data === 'edit_cancel') {
          await supabaseAdmin
            .from('telegram_sessions')
            .update({ contexto: {} })
            .eq('user_id', userId);
          await editTelegramMessage(chatId, messageId, '✅ Edição cancelada.');
          return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
        }

        if (data === 'edit_delete') {
          await supabaseAdmin.from('transactions').delete().eq('id', transactionId);
          await supabaseAdmin.from('telegram_sessions').update({ contexto: {} }).eq('user_id', userId);
          await editTelegramMessage(chatId, messageId, '🗑️ Transação deletada com sucesso!');
          return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
        }

        // Salvar campo a editar
        await supabaseAdmin
          .from('telegram_sessions')
          .update({
            contexto: {
              editing_transaction_id: transactionId,
              editing_field: data.replace('edit_', '')
            }
          })
          .eq('user_id', userId);

        const fieldMessages: Record<string, string> = {
          edit_description: '✏️ Digite a nova descrição:',
          edit_amount: '💰 Digite o novo valor:',
          edit_category: '📁 Digite o nome da nova categoria:',
          edit_account: '🏦 Digite o nome da nova conta:',
          edit_date: '📅 Digite a nova data (DD/MM/AAAA):'
        };

        await editTelegramMessage(chatId, messageId, fieldMessages[data] || 'Digite o novo valor:');
        return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
      }

      // Ações de toggle de transações recorrentes
      if (data.startsWith('toggle_recurring_')) {
        const recurringId = data.replace('toggle_recurring_', '');

        try {
          // Buscar transação recorrente
          const { data: recurring, error: fetchError } = await supabaseAdmin
            .from('recurring_transactions')
            .select('id, title, is_active')
            .eq('id', recurringId)
            .eq('user_id', userId)
            .single();

          if (fetchError || !recurring) {
            await editTelegramMessage(chatId, messageId, '❌ Transação recorrente não encontrada.');
            return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
          }

          // Toggle do status
          const newStatus = !recurring.is_active;
          const { error: updateError } = await supabaseAdmin
            .from('recurring_transactions')
            .update({ is_active: newStatus })
            .eq('id', recurringId);

          if (updateError) {
            await editTelegramMessage(chatId, messageId, '❌ Erro ao alterar status da transação.');
            return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
          }

          const statusText = newStatus ? 'ativada' : 'pausada';
          const emoji = newStatus ? '▶️' : '⏸️';

          await editTelegramMessage(chatId, messageId, `✅ Transação recorrente "${recurring.title}" foi ${statusText}!\n\n${emoji} Status: ${newStatus ? 'Ativa' : 'Pausada'}`);

        } catch (error) {
          console.error('Erro ao toggle transação recorrente:', error);
          await editTelegramMessage(chatId, messageId, '❌ Erro interno. Tente novamente.');
        }

        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: corsHeaders
        });
      }

      // Callbacks de contexto (Modelo 5 Híbrido)
      if (data === 'context_personal') {
        await setUserTelegramContext(supabaseAdmin, userId, 'personal');
        await editTelegramMessage(chatId, messageId,
          '✅ Contexto alterado para 👤 Pessoal\n\nSuas próximas transações serão pessoais (75/mês para free).'
        );
        return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
      }

      if (data === 'context_group') {
        await setUserTelegramContext(supabaseAdmin, userId, 'group');
        const context = await getUserTelegramContext(supabaseAdmin, userId);
        await editTelegramMessage(chatId, messageId,
          `✅ Contexto alterado para 🏠 ${context.groupName}\n\nSuas próximas transações serão compartilhadas (ILIMITADAS).`
        );
        return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
      }

      if (data === 'context_cancel') {
        await editTelegramMessage(chatId, messageId, '❌ Operação cancelada.');
        return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
      }

      if (data === 'context_no_group') {
        await editTelegramMessage(chatId, messageId,
          '⚠️ Você não está em nenhum grupo.\n\n' +
          'Para criar ou entrar em um grupo familiar, acesse:\n' +
          '🔗 https://app.boascontas.com/familia'
        );
        return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
      }

      if (data === 'config_context') {
        // Redirecionar para o comando /contexto
        const context = await getUserTelegramContext(supabaseAdmin, userId);

        const message = `📌 *Escolha o contexto padrão*\n\n` +
          `Onde suas próximas transações serão registradas?\n\n` +
          `*Contexto atual:* ${context.defaultContext === 'personal' ? '👤 Pessoal' : '🏠 ' + (context.groupName || 'Grupo')}\n\n` +
          `${context.groupId ? '🏠 *Grupo:* Transações compartilhadas (ILIMITADAS)\n' : ''}` +
          `👤 *Pessoal:* Apenas você vê (75/mês para free)`;

        const keyboard: any = {
          inline_keyboard: [
            [{ text: context.defaultContext === 'personal' ? '✅ 👤 Pessoal' : '👤 Pessoal', callback_data: 'context_personal' }]
          ]
        };

        if (context.groupId) {
          keyboard.inline_keyboard.push([
            { text: context.defaultContext === 'group' ? `✅ 🏠 ${context.groupName}` : `🏠 ${context.groupName}`, callback_data: 'context_group' }
          ]);
        } else {
          keyboard.inline_keyboard.push([
            { text: '⚠️ Você não está em nenhum grupo', callback_data: 'context_no_group' }
          ]);
        }

        keyboard.inline_keyboard.push([{ text: '❌ Cancelar', callback_data: 'context_cancel' }]);

        await editTelegramMessage(chatId, messageId, message, {
          parse_mode: 'Markdown',
          reply_markup: keyboard
        });
        return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
      }

      if (data === 'config_close') {
        await editTelegramMessage(chatId, messageId, '⚙️ Configurações fechadas.');
        return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
      }

      // --- Callbacks de Cartão de Crédito ---
      if (data.startsWith('pay_')) {
        const accountId = data.replace('pay_', '');
        if (accountId !== 'cancel') {
          await handlePaymentCardSelection(supabaseAdmin, chatId, userId, accountId);
        } else {
          await editTelegramMessage(chatId, messageId, '❌ Pagamento cancelado.');
        }
        return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
      }

      if (data.startsWith('config_')) {
        const accountId = data.replace('config_', '');
        if (accountId === 'cancel') {
          await editTelegramMessage(chatId, messageId, '❌ Operação cancelada.');
        } else if (accountId === 'back') {
          await handleConfigCartaoCommand(supabaseAdmin, chatId, userId);
        } else {
          await handleCardConfigCallback(supabaseAdmin, chatId, userId, accountId);
        }
        return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
      }

      if (data.startsWith('auto_on_')) {
        const accountId = data.replace('auto_on_', '');
        // FIX: Usando toggleAutoPayment no lugar de handleActivateAutoPayment que não existe
        try {
          await toggleCardAutoPayment(supabaseAdmin, chatId, userId, accountId);
        } catch (e) {
          console.error("Erro ao ativar auto pagamento:", e);
          await editTelegramMessage(chatId, messageId, '⚠️ Funcionalidade indisponível no momento.');
        }
        return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
      }

      if (data.startsWith('auto_off_')) {
        const accountId = data.replace('auto_off_', '');
        // FIX: Usando toggleAutoPayment no lugar de handleDeactivateAutoPayment que não existe
        try {
          await toggleCardAutoPayment(supabaseAdmin, chatId, userId, accountId);
        } catch (e) {
          console.error("Erro ao desativar auto pagamento:", e);
          await editTelegramMessage(chatId, messageId, '⚠️ Funcionalidade indisponível no momento.');
        }
        return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
      }
      // --- Fim Callbacks Cartão ---

      // --- Callbacks do Parser de Transações ---
      if (data.startsWith('select_account_')) {
        const accountId = data.replace('select_account_', '');
        const telegramId = callbackQuery.from.id.toString();

        try {
          // Buscar sessão com transação pendente pelo telegram_id
          const { data: session, error: sessionErr } = await supabaseAdmin
            .from('telegram_sessions')
            .select('contexto')
            .eq('telegram_id', telegramId)
            .single();

          console.log('[select_account] telegramId:', telegramId, 'session:', session, 'error:', sessionErr);

          // Verificar se há transação pendente aguardando conta
          if (!session?.contexto?.waiting_for || session.contexto.waiting_for !== 'account' || !session.contexto.pending_transaction) {
            await editTelegramMessage(chatId, messageId, '❌ Sessão expirada. Envie a transação novamente.');
            return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
          }

          const pending = session.contexto.pending_transaction;

          // Buscar nome da conta
          const { data: conta } = await supabaseAdmin
            .from('accounts')
            .select('nome')
            .eq('id', accountId)
            .single();

          // Usar categoria encontrada pelo parser ou buscar por sugestão hardcoded
          let categoriaId: string | null = pending.subcategoria_id || pending.categoria_id || null;
          let categoriaNome = pending.categoria_nome || 'Outros';
          let subcategoriaNome = pending.subcategoria_nome || null;

          // Se o parser não encontrou, tentar pela sugestão hardcoded
          if (!categoriaId && pending.categoria_sugerida) {
            const categoriaParts = pending.categoria_sugerida.split('>').map((s: string) => s.trim());
            const categoriaFilho = categoriaParts[categoriaParts.length - 1];

            // Buscar categoria com parent para montar hierarquia
            const { data: categorias } = await supabaseAdmin
              .from('categories')
              .select('id, nome, parent:categories!parent_id(nome)')
              .eq('user_id', userId)
              .ilike('nome', `%${categoriaFilho}%`)
              .limit(1);

            if (categorias && categorias.length > 0) {
              categoriaId = categorias[0].id;
              // Montar nome hierárquico se tiver parent
              const parentData = categorias[0].parent as unknown;
              if (parentData && Array.isArray(parentData) && parentData.length > 0) {
                categoriaNome = (parentData[0] as { nome: string }).nome;
                subcategoriaNome = categorias[0].nome;
              } else if (parentData && typeof parentData === 'object' && 'nome' in (parentData as object)) {
                categoriaNome = (parentData as { nome: string }).nome;
                subcategoriaNome = categorias[0].nome;
              } else {
                categoriaNome = categorias[0].nome;
                subcategoriaNome = null;
              }
            }
          }

          // Buscar contexto
          const context = await getUserTelegramContext(supabaseAdmin, userId);

          // Preparar transação completa
          const transactionData = {
            user_id: userId,
            group_id: context.groupId || null,
            valor: pending.valor,
            descricao: pending.descricao,
            tipo: pending.tipo,
            categoria_id: categoriaId,
            conta_origem_id: accountId,
            conta_destino_id: null,
            origem: 'telegram'
          };

          // Atualizar sessão com dados completos
          const { data: sessionData, error: sessionError } = await supabaseAdmin
            .from('telegram_sessions')
            .update({
              contexto: transactionData,
              status: 'ativo'
            })
            .eq('telegram_id', telegramId)
            .select('id')
            .single();

          if (sessionError) throw sessionError;

          // Montar confirmação no novo formato
          const tipoEmoji = pending.tipo === 'receita' ? '💚' : pending.tipo === 'despesa' ? '💸' : '🔄';
          const tipoLabel = pending.tipo === 'receita' ? 'Receita' : pending.tipo === 'despesa' ? 'Despesa' : 'Transferência';

          let confirmMsg = `✅ *Confirmar registro?*\n\n`;
          confirmMsg += `*Tipo:* ${tipoLabel}\n`;
          confirmMsg += `*Descrição:* ${pending.descricao}\n`;
          confirmMsg += `*Valor:* ${formatCurrency(pending.valor)}\n`;
          confirmMsg += `*Conta:* ${conta?.nome || 'Conta'}\n`;

          // Exibir Categoria e Subcategoria separadamente
          if (subcategoriaNome) {
            confirmMsg += `*Categoria:* 🍴 ${categoriaNome}\n`;
            confirmMsg += `*Subcategoria:* ${subcategoriaNome}\n`;
          } else {
            confirmMsg += `*Categoria:* ${categoriaNome}\n`;
          }

          if (context.defaultContext === 'group' && context.groupName) {
            confirmMsg += `\n🏠 *Grupo:* ${context.groupName}`;
          } else {
            confirmMsg += `\n👤 *Pessoal*`;
          }

          const keyboard = {
            inline_keyboard: [
              [
                { text: "✅ Confirmar", callback_data: `confirm_transaction:${sessionData.id}` },
                { text: "❌ Cancelar", callback_data: `cancel_transaction:${sessionData.id}` }
              ]
            ]
          };

          await editTelegramMessage(chatId, messageId, confirmMsg, { reply_markup: keyboard });

        } catch (e) {
          console.error('Erro ao selecionar conta:', e);
          await editTelegramMessage(chatId, messageId, '❌ Erro ao processar. Tente novamente.');
        }

        return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
      }

      if (data === 'cancel_transaction_parse') {
        // Limpar sessão pendente
        await supabaseAdmin
          .from('telegram_sessions')
          .update({ contexto: {}, status: 'cancelado' })
          .eq('user_id', userId);

        await editTelegramMessage(chatId, messageId, '❌ Transação cancelada.');
        return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
      }
      // --- Fim Callbacks Parser ---

      // Callback para confirmar pagamento (confirm_pay_cardId_accountId)
      if (data.startsWith('confirm_pay_')) {
        const parts = data.replace('confirm_pay_', '').split('_');
        const cardId = parts[0];
        const accountId = parts[1];
        try {
          await confirmInvoicePayment(supabaseAdmin, chatId, userId, cardId, accountId);
        } catch (e) {
          console.error("Erro ao confirmar pagamento:", e);
          await editTelegramMessage(chatId, messageId, '❌ Erro ao processar pagamento.');
        }
        return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
      }

      // Callback para abrir configurações de cartão específico
      if (data.startsWith('config_card_')) {
        const cardId = data.replace('config_card_', '');
        try {
          await handleCardConfigCallback(supabaseAdmin, chatId, userId, cardId);
        } catch (e) {
          console.error("Erro ao abrir config de cartão:", e);
          await editTelegramMessage(chatId, messageId, '❌ Erro ao carregar configurações.');
        }
        return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
      }

      // Callback para toggle pagamento automático
      if (data.startsWith('toggle_auto_')) {
        const cardId = data.replace('toggle_auto_', '');
        try {
          await toggleCardAutoPayment(supabaseAdmin, chatId, userId, cardId);
        } catch (e) {
          console.error("Erro ao toggle auto payment:", e);
          await editTelegramMessage(chatId, messageId, '❌ Erro ao alterar configuração.');
        }
        return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
      }

      // Callback para toggle lembrete
      if (data.startsWith('toggle_reminder_')) {
        const cardId = data.replace('toggle_reminder_', '');
        try {
          await toggleCardReminder(supabaseAdmin, chatId, userId, cardId);
        } catch (e) {
          console.error("Erro ao toggle reminder:", e);
          await editTelegramMessage(chatId, messageId, '❌ Erro ao alterar configuração.');
        }
        return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
      }

      // Ações de confirmação de transações (sistema antigo)
      const [action, sessionId] = data.split(':');
      const { data: session } = await supabaseAdmin.from('telegram_sessions').select('contexto').eq('id', sessionId).single();
      if (!session || !session.contexto) {
        await editTelegramMessage(chatId, messageId, "Esta confirmação expirou.");
        return new Response('OK', {
          status: 200,
          headers: corsHeaders
        });
      }
      if (action === 'confirm_transaction') {
        const transactionData = session.contexto;
        const { error: transactionError } = await supabaseAdmin.from('transactions').insert(transactionData);
        if (transactionError) throw transactionError;
        const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
        await editTelegramMessage(chatId, messageId, `✅ Lançamento de ${formatCurrency(transactionData.valor)} registrado com sucesso!\n${time}`);
      } else if (action === 'cancel_transaction') {
        await editTelegramMessage(chatId, messageId, "❌ Registo cancelado.");
      }
      await supabaseAdmin.from('telegram_sessions').delete().eq('id', sessionId);
      return new Response('OK', {
        status: 200,
        headers: corsHeaders
      });
    }
    if (!body.message) {
      console.log("Evento do Telegram recebido não é uma mensagem. Ignorando.", body);
      return new Response('OK', {
        status: 200,
        headers: corsHeaders
      });
    }

    const message = body.message;

    // ⚠️ CRÍTICO: Ignorar mensagens enviadas pelo próprio bot para evitar loops
    if (message.from?.is_bot) {
      console.log("Ignorando mensagem do próprio bot para evitar loop");
      return new Response('OK', {
        status: 200,
        headers: corsHeaders
      });
    }

    const chatId = message.chat.id;
    let text = message.text ? message.text.trim() : null;
    const voice = message.voice;
    if (!text && !voice) {
      return new Response('Nenhuma mensagem de texto ou voz encontrada', {
        status: 200,
        headers: corsHeaders
      });
    }
    // Comando /entrar para aceitar convite familiar
    if (text && text.startsWith('/entrar ')) {
      const inviteToken = text.replace('/entrar ', '').trim().toUpperCase();
      console.log('👨‍👩‍👧‍👦 Tentando aceitar convite familiar:', inviteToken);

      // Verificar se usuário está vinculado
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('user_id, nome')
        .eq('telegram_chat_id', chatId)
        .single();

      if (!profile) {
        await sendTelegramMessage(
          chatId,
          '❌ Sua conta não está vinculada. Use `/start SEU_CODIGO` para vincular primeiro.'
        );
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: corsHeaders,
        });
      }

      // Aceitar convite usando a função do banco
      // !! MODIFICAÇÃO IMPORTANTE !!
      // Agora passamos o 'p_user_id'
      const { data: result, error: inviteError } = await supabaseAdmin
        .rpc('accept_family_invite', {
          invite_token: inviteToken,
          p_user_id: profile.user_id // Enviando o ID do usuário
        });

      if (inviteError || !result || !result.success) {
        console.error('Erro ao aceitar convite:', inviteError);

        // !! NOVA LÓGICA DE ERRO !!
        let errorMessage = '❌ Código de convite inválido ou expirado. Verifique o código e tente novamente.';
        if (inviteError && inviteError.message.includes('USER_ALREADY_IN_GROUP')) {
          errorMessage = '⚠️ Você já faz parte de um grupo familiar. Só é permitido um grupo por conta.';
        }

        await sendTelegramMessage(
          chatId,
          errorMessage // Usa a nova mensagem de erro
        );
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: corsHeaders,
        });
      }

      await sendTelegramMessage(
        chatId,
        `✅ *Convite aceito com sucesso!*\n\nVocê agora faz parte do grupo familiar. Bem-vindo(a)! 👨‍👩‍👧‍👦`
      );

      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: corsHeaders,
      });
    }

    // Comando /start para vincular conta
    // Comando /start para vincular conta
    if (text && text.startsWith('/start')) {
      const licenseCode = text.split(' ')[1];
      if (!licenseCode) {
        // Verificar se usuário já está vinculado
        const { data: existingProfile } = await supabaseAdmin
          .from('profiles')
          .select('user_id')
          .eq('telegram_chat_id', chatId)
          .single();

        if (existingProfile) {
          // Usuário já existe, mostra menu principal
          await handleCommand(supabaseAdmin, '/start', existingProfile.user_id, chatId);
        } else {
          await sendTelegramMessage(chatId, '👋 *Bem-vindo ao Zaq - Boas Contas!*\n\nPara vincular sua conta, use o comando:\n`/start SEU_CODIGO_DE_LICENCA`\n\n📍 Você encontra seu código na aba "Licença" do aplicativo web.\n\n❓ Use /ajuda para ver todos os comandos disponíveis.');
        }
      } else {
        const result = await linkUserWithLicense(supabaseAdmin, chatId, licenseCode);
        await sendTelegramMessage(chatId, result.message);
      }
      return new Response('OK', {
        status: 200,
        headers: corsHeaders
      });
    }
    // Buscar perfil do usuário pelo telegram_chat_id
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('user_id')
      .eq('telegram_chat_id', chatId)
      .single();

    if (!profile) {
      await sendTelegramMessage(chatId, '🔗 *Sua conta não está vinculada*\n\nUse:\n`/start SEU_CODIGO_DE_LICENCA`');
      return new Response('Utilizador não vinculado', {
        status: 401,
        headers: corsHeaders
      });
    }
    const userId = profile.user_id;

    // Verificar se está em modo de edição
    const { data: session } = await supabaseAdmin
      .from('telegram_sessions')
      .select('contexto')
      .eq('user_id', userId)
      .eq('telegram_id', message.from.id.toString())
      .single();

    if (session?.contexto?.editing_field && text) {
      const transactionId = session.contexto.editing_transaction_id;
      const field = session.contexto.editing_field;

      const { data: transaction } = await supabaseAdmin
        .from('transactions')
        .select('*')
        .eq('id', transactionId)
        .single();

      if (!transaction) {
        await sendTelegramMessage(chatId, '❌ Transação não encontrada.');
        await supabaseAdmin.from('telegram_sessions').update({ contexto: {} }).eq('user_id', userId);
        return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
      }

      let updateData: any = {};

      try {
        switch (field) {
          case 'description':
            updateData.descricao = text;
            break;
          case 'amount':
            const amount = parseFloat(text.replace(',', '.').replace(/[^\d.]/g, ''));
            if (isNaN(amount)) throw new Error('Valor inválido');
            updateData.valor = amount;
            break;
          case 'category':
            const { data: category } = await supabaseAdmin
              .from('categories')
              .select('id')
              .eq('user_id', userId)
              .ilike('nome', `%${text}%`)
              .single();
            if (!category) throw new Error('Categoria não encontrada');
            updateData.categoria_id = category.id;
            break;
          case 'account':
            const { data: account } = await supabaseAdmin
              .from('accounts')
              .select('id')
              .eq('user_id', userId)
              .ilike('nome', `%${text}%`)
              .single();
            if (!account) throw new Error('Conta não encontrada');
            updateData.conta_origem_id = account.id;
            break;
          case 'date':
            const [day, month, year] = text.split('/');
            const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            if (isNaN(date.getTime())) throw new Error('Data inválida');
            updateData.data_transacao = date.toISOString().split('T')[0];
            break;
        }

        await supabaseAdmin
          .from('transactions')
          .update(updateData)
          .eq('id', transactionId);

        await supabaseAdmin
          .from('telegram_sessions')
          .update({ contexto: {} })
          .eq('user_id', userId);

        await sendTelegramMessage(chatId, '✅ Transação atualizada com sucesso!');
        return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
        await sendTelegramMessage(chatId, `❌ Erro: ${errorMsg}\n\nTente novamente ou use /editar_ultima para recomeçar.`);
        return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
      }
    }

    if (text && text.startsWith('/')) {
      await handleCommand(supabaseAdmin, text.toLowerCase(), userId, chatId);
      return new Response('OK', { status: 200, headers: corsHeaders });
    }

    // Detectar perguntas em linguagem natural
    if (text) {
      const questionKeywords = ['quanto', 'quantos', 'quantas', 'qual', 'quais', 'onde', 'quando', 'como'];
      if (questionKeywords.some(kw => text.toLowerCase().startsWith(kw))) {
        const thinking = await sendTelegramMessage(chatId, '🤔 Deixe-me verificar...');

        try {
          const response = await supabaseAdmin.functions.invoke('query-engine', {
            body: { question: text, userId }
          });

          if (response.error) throw response.error;

          if (thinking?.message_id) {
            await editTelegramMessage(chatId, thinking.message_id, `❓ *Sua pergunta:* ${text}\n\n${response.data.answer}`);
          } else {
            await sendTelegramMessage(chatId, `❓ *Sua pergunta:* ${text}\n\n${response.data.answer}`, { parse_mode: 'Markdown' });
          }
          return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
        } catch (error) {
          console.error('Erro ao processar pergunta:', error);
          const errorMsg = '❌ Desculpe, não consegui processar sua pergunta. Tente usar /perguntar [pergunta]';
          if (thinking?.message_id) {
            await editTelegramMessage(chatId, thinking.message_id, errorMsg);
          } else {
            await sendTelegramMessage(chatId, errorMsg);
          }
          return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
        }
      }
    }

    // Processar como transação (voz ou texto)
    if (true) {
      // Verificação de licença removida para permitir acesso a todos os planos
      const analyzingMessage = await sendTelegramMessage(chatId, voice ? "🎤 Ouvindo e analisando seu áudio..." : "🧠 Analisando sua mensagem...");
      try {
        if (voice) {
          console.log('Iniciando transcrição do áudio...');
          text = await getTranscriptFromAudio(voice.file_id);
          if (analyzingMessage?.message_id) {
            await editTelegramMessage(chatId, analyzingMessage.message_id, `🗣️ *Você disse:* "${text}"\n\n🧠 Agora, estou a analisar o conteúdo...`);
          }
        }
      } catch (transcriptionError) {
        const errorMessage = transcriptionError instanceof Error ? transcriptionError.message : "Ocorreu um erro desconhecido na transcrição.";
        await sendTelegramMessage(chatId, `😥 Desculpe, não consegui transcrever o seu áudio.\n\n*Erro técnico:* \`${errorMessage}\``);
        return new Response('OK', {
          status: 200,
          headers: corsHeaders
        });
      }

      // ========================================================================
      // USAR PARSER ROBUSTO (sem dependência de IA)
      // ========================================================================

      // Buscar contas do usuário para o parser
      const { data: userAccounts } = await supabaseAdmin
        .from('accounts')
        .select('id, nome, tipo')
        .eq('user_id', userId)
        .eq('ativo', true);

      const accounts: AccountData[] = userAccounts || [];

      // Buscar categorias do usuário com keywords para o parser
      const { data: userCategories } = await supabaseAdmin
        .from('categories')
        .select('id, nome, tipo, parent_id, keywords')
        .eq('user_id', userId);

      const categories: CategoryData[] = userCategories || [];
      console.log('[Parser] Categorias carregadas:', JSON.stringify(categories.map(c => ({ id: c.id, nome: c.nome, keywords: c.keywords, parent_id: c.parent_id }))));

      // Executar parser com contas e categorias
      const parsed = parseTransaction(text!, accounts, categories);
      console.log('[Parser] Resultado:', JSON.stringify(parsed));

      // Se não conseguiu extrair valor, mensagem não é transação válida
      if (!parsed.valor) {
        await sendTelegramMessage(chatId,
          `❓ Não entendi o valor da transação.\n\n` +
          `💡 *Exemplos válidos:*\n` +
          `• "gastei 50 no mercado com nubank"\n` +
          `• "200 uber santander"\n` +
          `• "recebi 1000 salário itau"`
        );
        return new Response('OK', { status: 200, headers: corsHeaders });
      }

      // Se falta a conta, PERGUNTAR (não adivinhar!)
      if (parsed.campos_faltantes.includes('conta')) {
        if (accounts.length === 0) {
          await sendTelegramMessage(chatId,
            `❌ Você não tem contas cadastradas.\n\n` +
            `Para registrar transações, primeiro cadastre suas contas no app:\n` +
            `🔗 [Cadastrar Contas](https://app.boascontas.com/accounts)`
          );
          return new Response('OK', { status: 200, headers: corsHeaders });
        }

        // Salvar dados parciais na sessão para completar depois
        const telegramIdSave = message.from.id.toString();
        console.log('[Parser] Salvando sessão:', { userId, telegramIdSave, valor: parsed.valor });

        const { data: upsertResult, error: upsertError } = await supabaseAdmin
          .from('telegram_sessions')
          .upsert({
            user_id: userId,
            telegram_id: telegramIdSave,
            chat_id: chatId.toString(),
            contexto: {
              waiting_for: 'account',
              pending_transaction: {
                valor: parsed.valor,
                tipo: parsed.tipo,
                descricao: parsed.descricao,
                categoria_id: parsed.categoria_id,
                subcategoria_id: parsed.subcategoria_id,
                categoria_nome: parsed.categoria_nome,
                subcategoria_nome: parsed.subcategoria_nome,
                categoria_sugerida: parsed.categoria_sugerida
              }
            },
            status: 'ativo'  // Usando valor válido da constraint
          }, { onConflict: 'telegram_id' })
          .select();

        console.log('[Parser] Resultado upsert:', { upsertResult, upsertError });

        const keyboard = gerarTecladoContas(accounts);

        await sendTelegramMessage(chatId,
          `💳 *Em qual conta foi esse gasto de ${formatCurrency(parsed.valor)}?*\n\n` +
          `📝 ${parsed.descricao}`,
          { reply_markup: keyboard }
        );
        return new Response('OK', { status: 200, headers: corsHeaders });
      }

      // Usar categoria encontrada pelo parser ou buscar por sugestão hardcoded
      let categoriaId: string | null = parsed.subcategoria_id || parsed.categoria_id || null;
      let categoriaNome = parsed.categoria_nome || 'Outros';
      let subcategoriaNome = parsed.subcategoria_nome || null;

      // Se o parser não encontrou nas keywords do usuário, tentar pela sugestão hardcoded
      if (!categoriaId && parsed.categoria_sugerida) {
        const categoriaParts = parsed.categoria_sugerida.split('>').map(s => s.trim());
        const categoriaFilho = categoriaParts[categoriaParts.length - 1];

        // Buscar categoria com parent para montar hierarquia
        const { data: categorias } = await supabaseAdmin
          .from('categories')
          .select('id, nome, parent:categories!parent_id(nome)')
          .eq('user_id', userId)
          .ilike('nome', `%${categoriaFilho}%`)
          .limit(1);

        if (categorias && categorias.length > 0) {
          categoriaId = categorias[0].id;
          // Montar nome hierárquico se tiver parent
          const parentData = categorias[0].parent as unknown;
          if (parentData && Array.isArray(parentData) && parentData.length > 0) {
            categoriaNome = (parentData[0] as { nome: string }).nome;
            subcategoriaNome = categorias[0].nome;
          } else if (parentData && typeof parentData === 'object' && 'nome' in (parentData as object)) {
            categoriaNome = (parentData as { nome: string }).nome;
            subcategoriaNome = categorias[0].nome;
          } else {
            categoriaNome = categorias[0].nome;
            subcategoriaNome = null;
          }
        }
      }

      // Buscar nome da conta
      const contaSelecionada = accounts.find(a => a.id === parsed.conta_origem);
      const contaNome = contaSelecionada?.nome || 'Conta';

      // Buscar contexto atual para saber se é grupo ou pessoal
      const context = await getUserTelegramContext(supabaseAdmin, userId);

      const transactionData = {
        user_id: userId,
        group_id: context.groupId || null,
        valor: parsed.valor,
        descricao: parsed.descricao,
        tipo: parsed.tipo,
        categoria_id: categoriaId,
        conta_origem_id: parsed.conta_origem,
        conta_destino_id: null,
        origem: 'telegram'
      };

      const { data: sessionData, error: sessionError } = await supabaseAdmin.from('telegram_sessions').upsert({
        user_id: userId,
        telegram_id: message.from.id.toString(),
        chat_id: chatId.toString(),
        contexto: transactionData,
        status: 'ativo'
      }, {
        onConflict: 'telegram_id'
      }).select('id').single();

      if (sessionError) throw sessionError;

      // Montar mensagem de confirmação no novo formato
      const tipoEmoji = parsed.tipo === 'receita' ? '💚' : parsed.tipo === 'despesa' ? '💸' : '🔄';
      const tipoLabel = parsed.tipo === 'receita' ? 'Receita' : parsed.tipo === 'despesa' ? 'Despesa' : 'Transferência';

      let confirmationMessage = `✅ *Confirmar registro?*\n\n`;
      confirmationMessage += `*Tipo:* ${tipoLabel}\n`;
      confirmationMessage += `*Descrição:* ${parsed.descricao}\n`;
      confirmationMessage += `*Valor:* ${formatCurrency(parsed.valor!)}\n`;
      confirmationMessage += `*Conta:* ${contaNome}\n`;

      // Exibir Categoria e Subcategoria separadamente
      if (subcategoriaNome) {
        confirmationMessage += `*Categoria:* 🍴 ${categoriaNome}\n`;
        confirmationMessage += `*Subcategoria:* ${subcategoriaNome}\n`;
      } else {
        confirmationMessage += `*Categoria:* ${categoriaNome}\n`;
      }

      if (context.defaultContext === 'group' && context.groupName) {
        confirmationMessage += `\n🏠 *Grupo:* ${context.groupName}`;
      } else {
        confirmationMessage += `\n👤 *Pessoal*`;
      }

      const inline_keyboard = [
        [
          {
            text: "✅ Confirmar",
            callback_data: `confirm_transaction:${sessionData.id}`
          },
          {
            text: "❌ Cancelar",
            callback_data: `cancel_transaction:${sessionData.id}`
          }
        ]
      ];
      await sendTelegramMessage(chatId, confirmationMessage, {
        reply_markup: {
          inline_keyboard
        }
      });
    }
    return new Response(JSON.stringify({
      success: true
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    });
  } catch (error) {
    console.error('Erro no webhook:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({
      error: errorMessage
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 500
    });
  }
});
