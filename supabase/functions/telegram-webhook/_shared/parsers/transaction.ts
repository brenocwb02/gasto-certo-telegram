
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
export function extrairValor(texto: string): number | null {
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

    // Limpar preposições restantes no final (com/sem artigos)
    descricao = descricao.replace(/\s+(com|no|na|em|de|do|da|pelo|pela|para|pro|pra)(?:\s+(o|a|os|as|um|uma|uns|umas))?\s*$/gi, '');

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
        row.push({ text: `💳 ${cartoes[i].nome}`, callback_data: `account_${cartoes[i].id}` });
        if (cartoes[i + 1]) {
            row.push({ text: `💳 ${cartoes[i + 1].nome}`, callback_data: `account_${cartoes[i + 1].id}` });
        }
        keyboard.inline_keyboard.push(row);
    }

    // Adicionar contas bancárias
    for (let i = 0; i < contasBancarias.length; i += 2) {
        const row = [];
        row.push({ text: `🏦 ${contasBancarias[i].nome}`, callback_data: `account_${contasBancarias[i].id}` });
        if (contasBancarias[i + 1]) {
            row.push({ text: `🏦 ${contasBancarias[i + 1].nome}`, callback_data: `account_${contasBancarias[i + 1].id}` });
        }
        keyboard.inline_keyboard.push(row);
    }

    // Adicionar outras contas
    for (const conta of outras) {
        keyboard.inline_keyboard.push([
            { text: `💰 ${conta.nome}`, callback_data: `account_${conta.id}` }
        ]);
    }

    return keyboard;
}
