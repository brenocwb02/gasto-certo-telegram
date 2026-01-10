
import { ParsedTransaction, AccountData, CategoryData } from '../types.ts';

/**
 * Calcula similaridade entre duas strings (Levenshtein simplificado)
 */
export function calcularSimilaridade(str1: string, str2: string): number {
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();

    if (s1 === s2) return 100;
    if (s1.includes(s2) || s2.includes(s1)) return 85;

    // Comparar palavras em comum
    const palavras1 = s1.split(/\s+/);
    const palavras2 = s2.split(/\s+/);
    let matches = 0;

    for (const p1 of palavras1) {
        for (const p2 of palavras2) {
            if (p1.length > 2 && p2.length > 2) {
                if (p1 === p2) matches += 2;
                else if (p1.includes(p2) || p2.includes(p1)) matches += 1;
            }
        }
    }

    const maxPalavras = Math.max(palavras1.length, palavras2.length);
    return Math.min(100, Math.round((matches / maxPalavras) * 50));
}

/**
 * Encontra a conta mais similar ao termo digitado
 */
export function encontrarContaSimilar(termo: string, contas: AccountData[]): { conta: AccountData | null, similaridade: number } {
    if (!termo || !contas?.length) return { conta: null, similaridade: 0 };

    let melhorMatch: AccountData | null = null;
    let melhorSimilaridade = 0;

    const termoLower = termo.toLowerCase().trim();

    // Aliases expandidos para bancos brasileiros (25+ entradas)
    const aliases: Record<string, string[]> = {
        // === Bancos Digitais ===
        'nubank': ['nu', 'nub', 'roxinho', 'roxo', 'nubanck'],
        'inter': ['inter', 'bancointer', 'laranjinha', 'banco inter'],
        'c6': ['c6', 'c6bank', 'c6 bank', 'cseis'],
        'next': ['next', 'nextbank', 'banco next'],
        'neon': ['neon', 'neonbank', 'banco neon'],
        'picpay': ['picpay', 'pic', 'pic pay', 'picbank'],
        'original': ['original', 'banco original'],
        'sofisa': ['sofisa', 'sofisa direto'],
        'modal': ['modal', 'banco modal', 'modalmais'],
        'btg': ['btg', 'btg pactual', 'btgpactual'],
        'xp': ['xp', 'xp investimentos', 'xpinvest'],
        'rico': ['rico', 'rico investimentos'],
        'clear': ['clear', 'clear corretora'],

        // === Bancos Tradicionais ===
        'santander': ['san', 'sant', 'stdr', 'vermelhinho', 'vermelho', 'santand'],
        'itau': ['itaú', 'ita', 'itauzão', 'itauzao', 'laranja', 'itau'],
        'bradesco': ['bra', 'brad', 'bradescão', 'bradescao', 'bradesquinho'],
        'caixa': ['cef', 'caixa economica', 'caixinha', 'cx', 'caixa econômica'],
        'bb': ['banco do brasil', 'brasil', 'amarelão', 'amarelao', 'bdb', 'bancodobrasil'],
        'sicredi': ['sicredi', 'sicred'],
        'sicoob': ['sicoob', 'sicob'],
        'banrisul': ['banrisul', 'banri'],
        'banestes': ['banestes'],

        // === Carteiras Digitais ===
        'mercadopago': ['mp', 'mercado pago', 'meli', 'mercadolivre', 'mercado livre'],
        'pagseguro': ['pag', 'pagseguro', 'pagbank', 'pag seguro'],
        'paypal': ['pp', 'paypal', 'pay pal'],
        'iti': ['iti', 'iti itau'],
        'ame': ['ame', 'ame digital'],
        'recargapay': ['recargapay', 'recarga pay'],

        // === Genéricos ===
        'pix': ['pix', 'pixzinho'],
        'dinheiro': ['din', 'cash', 'espécie', 'especie', 'vivo', 'na mão', 'namao', 'na mao'],
        'carteira': ['wallet', 'bolso', 'carteira', 'crt'],
        'credito': ['crédito', 'cred', 'cc', 'cartao de credito'],
        'debito': ['débito', 'deb', 'dc', 'cartao de debito'],
        'poupanca': ['poupança', 'poupanca', 'pp', 'caderneta'],
        'investimento': ['invest', 'investimentos', 'aplicação', 'aplicacao'],
    };

    for (const conta of contas) {
        const nomeContaLower = conta.nome.toLowerCase();
        // Versão sem acentos para comparação de aliases
        const nomeContaSemAcento = removeAcentos(nomeContaLower);

        // Match exato
        if (nomeContaLower === termoLower || nomeContaLower.includes(termoLower)) {
            return { conta, similaridade: 100 };
        }

        // Verificar aliases (remover acentos para comparação)
        const termoSemAcento = removeAcentos(termoLower);
        for (const [chave, aliasList] of Object.entries(aliases)) {
            // Verificar se o termo está na lista de aliases (com ou sem acento)
            const aliasMatch = aliasList.some(alias =>
                removeAcentos(alias) === termoSemAcento || alias === termoLower
            );
            // Verificar se o nome da conta contém a chave (com ou sem acento)
            if (aliasMatch && (nomeContaSemAcento.includes(chave) || nomeContaLower.includes(chave))) {
                console.log(`[Alias Match] "${termoLower}" → "${chave}" → conta "${conta.nome}"`);
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
 * Normaliza variações de palavras numéricas
 * cinquentas → cinquenta, cincoenta → cinquenta, etc.
 */
function normalizarPalavraNumero(palavra: string): string {
    // Remover 's' final comum em typos
    let norm = palavra.replace(/s$/, '');

    // Correções de typos comuns
    const correcoes: Record<string, string> = {
        'cincoenta': 'cinquenta',
        'cincuenta': 'cinquenta',
        'sinquenta': 'cinquenta',
        'quareta': 'quarenta',
        'sesenta': 'sessenta',
        'seteta': 'setenta',
        'oiteta': 'oitenta',
        'noveta': 'noventa',
        'doiz': 'dois',
        'trez': 'tres',
    };

    return correcoes[norm] || norm;
}

/**
 * Aliases de contas/bancos para identificação no texto
 */
const ALIASES_CONTAS = [
    // Apelidos de bancos
    'roxinho', 'roxo', 'vermelhinho', 'vermelho', 'laranja', 'laranjinha',
    'amarelao', 'amarelão', 'bradesquinho', 'itauzao', 'itauzão', 'bradescao', 'bradescão',
    // Abreviações
    'nu', 'nub', 'nubank', 'san', 'sant', 'santander', 'stdr',
    'ita', 'itau', 'itaú', 'bra', 'brad', 'bradesco',
    'cef', 'caixa', 'bb', 'inter', 'c6', 'next', 'neon', 'picpay',
    'mp', 'pag', 'pagseguro', 'pic', 'mercadopago',
];

/**
 * Mapa de números por extenso para valores numéricos
 */
const NUMEROS_EXTENSO: Record<string, number> = {
    // Unidades
    'zero': 0, 'um': 1, 'uma': 1, 'dois': 2, 'duas': 2,
    'tres': 3, 'três': 3, 'quatro': 4, 'cinco': 5, 'seis': 6,
    'sete': 7, 'oito': 8, 'nove': 9, 'dez': 10,
    // 11-19
    'onze': 11, 'doze': 12, 'treze': 13, 'quatorze': 14, 'catorze': 14,
    'quinze': 15, 'dezesseis': 16, 'dezessete': 17,
    'dezoito': 18, 'dezenove': 19,
    // Dezenas
    'vinte': 20, 'trinta': 30, 'quarenta': 40, 'cinquenta': 50,
    'sessenta': 60, 'setenta': 70, 'oitenta': 80, 'noventa': 90,
    // Centenas
    'cem': 100, 'cento': 100, 'duzentos': 200, 'trezentos': 300,
    'quatrocentos': 400, 'quinhentos': 500, 'seiscentos': 600,
    'setecentos': 700, 'oitocentos': 800, 'novecentos': 900,
    // Milhares
    'mil': 1000,
    // Gírias brasileiras
    'conto': 1000, 'contos': 1000,
    'pau': 1000, 'paus': 1000,
    'pila': 1, 'pilas': 1,
    'mango': 1, 'mangos': 1,
    'pratas': 1, 'prata': 1,
    // NOTA: 'real' e 'reais' NÃO devem estar aqui - são indicadores de moeda, não valores!
};

/**
 * Modificadores especiais
 */
const MODIFICADORES: Record<string, number> = {
    'meio': 0.5, 'meia': 0.5,
    'metade': 0.5,
};

/**
 * Converte números por extenso para valor numérico
 * Exemplos:
 *   "cinquenta" → 50
 *   "cento e cinquenta" → 150  
 *   "dois mil e quinhentos" → 2500
 *   "meio conto" → 500
 *   "vinte e cinco" → 25
 */
export function converterNumeroExtenso(texto: string): number | null {
    const textoNorm = texto.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove acentos
        .replace(/\s+/g, ' ')
        .trim();

    // Padrão especial: "meio conto" → 500
    if (textoNorm.match(/meio\s+conto/)) {
        return 500;
    }

    // Padrão especial: "meia duzia" → 6
    if (textoNorm.match(/meia?\s+duzia/)) {
        return 6;
    }

    // Tentar extrair padrões compostos
    // "vinte e cinco" → 25, "cento e cinquenta" → 150
    const palavras = textoNorm.split(/\s+/);
    let total = 0;
    let atual = 0;
    let temNumero = false;
    let modificador = 1;

    for (const palavra of palavras) {
        // Ignorar conectivos e indicadores de moeda
        if (['e', 'de', 'com', 'reais', 'real'].includes(palavra)) continue;

        // Ignorar aliases de banco (eles vão ser usados para conta, não valor)
        if (ALIASES_CONTAS.includes(palavra)) continue;

        // Verificar modificador
        if (MODIFICADORES[palavra]) {
            modificador = MODIFICADORES[palavra];
            continue;
        }

        // Normalizar palavra para lidar com variações (cinquentas → cinquenta)
        const palavraNorm = normalizarPalavraNumero(palavra);

        // Verificar se é número por extenso
        const valor = NUMEROS_EXTENSO[palavraNorm] ?? NUMEROS_EXTENSO[palavra];
        if (valor !== undefined) {
            temNumero = true;

            // "mil" multiplica o que veio antes
            if (palavra === 'mil') {
                if (atual === 0) atual = 1;
                total += atual * 1000;
                atual = 0;
            }
            // "conto" multiplica por 1000
            else if (['conto', 'contos', 'pau', 'paus'].includes(palavra)) {
                if (atual === 0) atual = 1;
                total += atual * 1000 * modificador;
                atual = 0;
                modificador = 1;
            }
            // Centenas somam ao atual
            else if (valor >= 100 && valor < 1000) {
                atual += valor;
            }
            // Dezenas e unidades somam
            else {
                atual += valor;
            }
        }
    }

    // Somar o que restou
    total += atual * modificador;

    return temNumero && total > 0 ? total : null;
}

/**
 * Extrai valor numérico da mensagem
 * Suporta: "R$ 50", "50 reais", "cinquenta", "meio conto", "vinte e cinco"
 */
export function extrairValor(texto: string): number | null {
    // 1. Primeiro tentar padrões numéricos (regex)
    const patterns = [
        /R\$\s*(\d+(?:\.\d{3})*(?:,\d{1,2})?)/i, // R$ 1.200,50 ou R$ 1200,50
        /(\d+(?:\.\d{3})*(?:,\d{1,2})?)\s*reais?/i, // 1.200,50 reais
        /(\d+(?:\.\d{3})*(?:,\d{1,2})?)\s*(?:conto|pila|real)/i,
        /(\d+(?:\.\d{1,2}))/, // 1200.50 (Genérico com ponto - Prioridade)
        /(\d+(?:,\d{1,2})?)/  // 1200,50 (Genérico com vírgula)
    ];

    for (const pattern of patterns) {
        const match = texto.match(pattern);
        if (match) {
            let valorStr = match[1];

            // Se tiver ponto e vírgula, assume formato BR (ponto = milhar)
            if (valorStr.includes('.') && valorStr.includes(',')) {
                valorStr = valorStr.replace(/\./g, '').replace(',', '.');
            }
            // Se tiver apenas vírgula, troca por ponto
            else if (valorStr.includes(',')) {
                valorStr = valorStr.replace(',', '.');
            }
            // Se tiver apenas ponto
            else if (valorStr.includes('.')) {
                // Se tiver mais de 2 casas decimais ou parecer milhar (ex: 1.000), remove ponto
                // Mas aqui estamos pegando \d.\d{1,2}, então é seguro assumir decimal se o regex casou
                // O regex anterior já pegou os casos de milhar (1.200.000)
            }

            const num = parseFloat(valorStr);
            if (!isNaN(num) && num > 0 && num < 1000000) {
                return num;
            }
        }
    }

    // 2. Fallback: tentar converter número por extenso
    // "cinquenta reais", "meio conto", "vinte e cinco"
    const valorExtenso = converterNumeroExtenso(texto);
    if (valorExtenso !== null && valorExtenso > 0) {
        return valorExtenso;
    }

    return null;
}

/**
 * Identifica o tipo de transação pelos verbos
 */
export function identificarTipo(texto: string): 'despesa' | 'receita' | 'transferencia' | null {
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
 * Sugere categoria com base em palavras-chave (fallback hardcoded)
 */
export function sugerirCategoria(texto: string): string | null {
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
 * Remove acentos de uma string (NFD normalization)
 */
export function removeAcentos(str: string): string {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/**
 * Helper: Verifica se keyword é palavra completa no texto (não substring de outra palavra)
 * Robusto para acentos (Café == Cafe)
 */
function matchPalavraCompleta(texto: string, keyword: string): boolean {
    const textoNorm = removeAcentos(texto.toLowerCase());
    const keywordNorm = removeAcentos(keyword.toLowerCase());

    // Escape special regex characters in keyword
    const escaped = keywordNorm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Use word boundary (\b) to match complete words only
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');

    return regex.test(textoNorm);
}

/**
 * Encontra categoria do usuário baseado nas keywords cadastradas
 * Retorna a categoria/subcategoria com seus nomes
 */
export function encontrarCategoriaPorKeywords(
    texto: string,
    categorias: CategoryData[]
): {
    categoria_id: string | null;
    subcategoria_id: string | null;
    categoria_nome: string | null;
    subcategoria_nome: string | null;
} {
    const textoLower = texto.toLowerCase();
    // console.log('[CatMatch] Buscando categoria para texto:', textoLower);

    // Primeiro, buscar nas subcategorias (que têm parent_id)
    for (const cat of categorias) {
        if (cat.parent_id && cat.keywords && cat.keywords.length > 0) {
            for (const keyword of cat.keywords) {
                const keywordLower = keyword.toLowerCase();
                if (matchPalavraCompleta(textoLower, keywordLower)) {
                    // console.log(`[CatMatch] MATCH! Keyword "${keywordLower}" em categoria "${cat.nome}" (sub de ${cat.parent_id})`);
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
export function extrairDescricao(texto: string, contaEncontrada: string | null): string {
    let descricao = texto;

    // Remover verbos comuns
    const verbos = ['gastei', 'paguei', 'comprei', 'recebi', 'ganhei', 'transferi', 'passei'];
    for (const verbo of verbos) {
        descricao = descricao.replace(new RegExp(verbo, 'gi'), '');
    }

    // Remover valores numéricos
    descricao = descricao.replace(/R\$\s*[\d.,]+/gi, '');
    descricao = descricao.replace(/[\d.,]+\s*reais?/gi, '');
    descricao = descricao.replace(/\b\d+(?:[.,]\d+)?\b/g, '');

    // Remover números por extenso e indicadores de moeda
    const numerosExtenso = [
        // Unidades (0-9)
        'zero', 'um', 'uma', 'dois', 'duas', 'tres', 'três', 'quatro', 'cinco',
        'seis', 'sete', 'oito', 'nove', 'dez',
        // 11-19
        'onze', 'doze', 'treze', 'quatorze', 'catorze', 'quinze',
        'dezesseis', 'dezessete', 'dezoito', 'dezenove',
        // Dezenas
        'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa',
        // Centenas
        'cem', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos',
        'seiscentos', 'setecentos', 'oitocentos', 'novecentos',
        // Milhares e gírias
        'mil', 'conto', 'contos', 'pau', 'paus', 'pila', 'pilas', 'mango', 'mangos',
        // Indicadores de moeda
        'reais', 'real', 'prata', 'pratas',
        // Modificadores
        'meio', 'meia'
    ];
    for (const num of numerosExtenso) {
        descricao = descricao.replace(new RegExp(`\\b${num}\\b`, 'gi'), '');
    }

    // Remover preposições e conectores no início
    descricao = descricao.replace(/^[\s,.]*(no|na|em|de|do|da|com|pelo|pela|para|pro|pra)\s+/gi, '');

    // Remover padrão "com/no cartão X" ou "pelo/na conta X"
    // Atualizado para suportar artigos (o/a) e nomes compostos de até 4 palavras
    descricao = descricao.replace(/\s+(?:no|na|em|de|do|da|com|pelo|pela|para|pro|pra)(?:\s+(?:o|a|os|as|um|uma))?\s+(?:cart[aã]o|conta|pix)\s+[\w\u00C0-\u00FF]+(?:\s+[\w\u00C0-\u00FF]+){0,3}[.,;?!]?\s*$/gi, '');

    // Remover nome da conta se encontrada
    if (contaEncontrada) {
        const palavrasConta = contaEncontrada.toLowerCase().split(/\s+/);
        for (const palavra of palavrasConta) {
            if (palavra.length > 2) {
                descricao = descricao.replace(new RegExp(`\\b${palavra}\\b`, 'gi'), '');
            }
        }
    }

    // Remover aliases populares de bancos (que podem estar no texto)
    const aliasesParaRemover = [
        // Apelidos de bancos
        'roxinho', 'roxo', 'vermelhinho', 'vermelho', 'laranja', 'laranjinha',
        'amarelão', 'amarelao', 'bradesquinho', 'itauzão', 'itauzao', 'bradescão', 'bradescao',
        // Abreviações
        'nu', 'nub', 'san', 'sant', 'stdr', 'ita', 'bra', 'brad', 'cef', 'bb',
        'mp', 'pag', 'pic', 'inter',
        // Tipos
        'cred', 'deb', 'cc', 'dc'
    ];
    for (const alias of aliasesParaRemover) {
        descricao = descricao.replace(new RegExp(`\\b${alias}\\b`, 'gi'), '');
    }

    // Remover "cartão", "pix", etc
    descricao = descricao.replace(/\b(cartão|cartao|pix|débito|debito|crédito|credito|conta)\b/gi, '');

    // Limpar preposições restantes no final (com/sem artigos)
    descricao = descricao.replace(/\s+(com|no|na|em|de|do|da|pelo|pela|para|pro|pra)(?:\s+(o|a|os|as|um|uma|uns|umas))?\s*$/gi, '');

    // Remover conectivos órfãos ("e" sozinho entre espaços ou no final)
    descricao = descricao.replace(/\s+e\s*$/gi, ''); // "e" no final
    descricao = descricao.replace(/\s+e\s+/gi, ' '); // "e" no meio (substituir por espaço único)

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
export function parseTransaction(texto: string, contasUsuario: AccountData[], categoriasUsuario: CategoryData[] = []): ParsedTransaction {
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

    // 7. Extrair Parcelas
    // Padrões: "10x", "10x50", "10 x 50", "em 10x", "10 vezes", "10 parcelas", "parcelado em 10"
    const regexParcelas = [
        /\b(\d+)\s*x\b/i,                       // 10x (isolado)
        /\b(\d+)\s*x(?=\d)/i,                   // 10x50 (10x seguido de numero)
        /em\s+(\d+)\s*(?:x|vezes|parcelas)/i,   // em 10x, em 10 vezes
        /\b(\d+)\s*(?:vezes|parcelas)\b/i,      // 10 vezes, 10 parcelas
        /parcelad[oa]\s+(?:em\s+)?(\d+)/i       // parcelado em 10
    ];

    let matchParcelas = null;
    for (const regex of regexParcelas) {
        matchParcelas = texto.match(regex);
        if (matchParcelas) break;
    }

    if (matchParcelas) {
        const parcelas = parseInt(matchParcelas[1]);
        if (parcelas > 1 && parcelas <= 60) {
            resultado.parcelas = parcelas;
            resultado.is_installment = true;
        }
    }

    resultado.confianca = confianca;

    return resultado;
}

/**
 * Gera teclado inline para seleção de conta
 */
export function gerarTecladoContas(contas: AccountData[]): any {
    const keyboard: any = { inline_keyboard: [] };

    // Organizar contas por tipo
    const cartoes = contas.filter(c => c.tipo === 'cartao_credito');
    const contasBancarias = contas.filter(c => c.tipo === 'conta_corrente' || c.tipo === 'poupanca');
    const outras = contas.filter(c => !['cartao_credito', 'conta_corrente', 'poupanca'].includes(c.tipo));

    // Adicionar cartões primeiro (2 por linha)
    for (let i = 0; i < cartoes.length; i += 2) {
        const row = [];
        row.push({ text: `💳 ${cartoes[i].nome}`, callback_data: `select_account_${cartoes[i].id}` });
        if (cartoes[i + 1]) {
            row.push({ text: `💳 ${cartoes[i + 1].nome}`, callback_data: `select_account_${cartoes[i + 1].id}` });
        }
        keyboard.inline_keyboard.push(row);
    }

    // Adicionar contas bancárias
    for (let i = 0; i < contasBancarias.length; i += 2) {
        const row = [];
        row.push({ text: `🏦 ${contasBancarias[i].nome}`, callback_data: `select_account_${contasBancarias[i].id}` });
        if (contasBancarias[i + 1]) {
            row.push({ text: `🏦 ${contasBancarias[i + 1].nome}`, callback_data: `select_account_${contasBancarias[i + 1].id}` });
        }
        keyboard.inline_keyboard.push(row);
    }

    // Adicionar outras contas
    for (const conta of outras) {
        keyboard.inline_keyboard.push([
            { text: `💰 ${conta.nome}`, callback_data: `select_account_${conta.id}` }
        ]);
    }

    return keyboard;
}

/**
 * Gera teclado inline para seleção de categorias (Apenas Pais)
 */
export function gerarTecladoCategorias(categorias: CategoryData[]): any {
    const keyboard: any = { inline_keyboard: [] };

    // Filtrar apenas categorias pai (que não têm parent_id)
    const categoriasPai = categorias.filter(c => !c.parent_id);

    // Ordenar alfabeticamente
    categoriasPai.sort((a, b) => a.nome.localeCompare(b.nome));

    // Adicionar 2 por linha
    for (let i = 0; i < categoriasPai.length; i += 2) {
        const row = [];
        row.push({ text: categoriasPai[i].nome, callback_data: `select_category_${categoriasPai[i].id}` });
        if (categoriasPai[i + 1]) {
            row.push({ text: categoriasPai[i + 1].nome, callback_data: `select_category_${categoriasPai[i + 1].id}` });
        }
        keyboard.inline_keyboard.push(row);
    }

    // Adicionar opção "Outros" se não existir na lista
    const temOutros = categoriasPai.some(c => c.nome.toLowerCase() === 'outros');
    if (!temOutros) {
        keyboard.inline_keyboard.push([
            { text: '➕ Outros', callback_data: 'select_category_outros' }
        ]);
    }

    // Botão de Cancelar
    keyboard.inline_keyboard.push([
        { text: '❌ Cancelar', callback_data: 'cancel_transaction_parse' }
    ]);

    return keyboard;
}

/**
 * Gera teclado inline para seleção de subcategorias
 */
export function gerarTecladoSubcategorias(subcategorias: CategoryData[], parentId: string): any {
    const keyboard: any = { inline_keyboard: [] };

    // Adicionar opção "Selecionar Própria Categoria Pai" (ex: Gastar na categoria "Alimentação" genericamente)
    // keyboard.inline_keyboard.push([
    //    { text: '📁 Usar Categoria Principal', callback_data: `select_subcategory_none_${parentId}` }
    // ]);

    // Ordenar
    subcategorias.sort((a, b) => a.nome.localeCompare(b.nome));

    // 2 por linha
    for (let i = 0; i < subcategorias.length; i += 2) {
        const row = [];
        row.push({ text: subcategorias[i].nome, callback_data: `select_subcategory_${subcategorias[i].id}` });
        if (subcategorias[i + 1]) {
            row.push({ text: subcategorias[i + 1].nome, callback_data: `select_subcategory_${subcategorias[i + 1].id}` });
        }
        keyboard.inline_keyboard.push(row);
    }

    // Botão Voltar
    keyboard.inline_keyboard.push([
        { text: '◀️ Voltar', callback_data: 'back_to_categories' }
    ]);

    return keyboard;
}
