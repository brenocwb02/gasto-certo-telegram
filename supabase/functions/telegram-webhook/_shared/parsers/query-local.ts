/**
 * Query Engine Local - Interpreta perguntas financeiras usando regex (sem IA)
 * Usado para responder perguntas como "quanto gastei com mercado este mês"
 */

export interface QueryFilters {
    date_start: string | null;
    date_end: string | null;
    tipo: 'receita' | 'despesa' | 'transferencia' | null;
    keyword: string | null;
    aggregation: 'sum' | 'count' | 'max' | 'avg' | 'list';
    group_by: 'category' | 'account' | 'day' | null;
    limit: number;
}

export interface ParsedQuery {
    isQuery: boolean;
    filters: QueryFilters | null;
    rawQuestion: string;
}

/**
 * Helpers de data
 */
function getToday(): Date {
    return new Date();
}

function getStartOfMonth(date: Date): string {
    return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
}

function getEndOfMonth(date: Date): string {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];
}

function getStartOfLastMonth(): string {
    const d = getToday();
    return new Date(d.getFullYear(), d.getMonth() - 1, 1).toISOString().split('T')[0];
}

function getEndOfLastMonth(): string {
    const d = getToday();
    return new Date(d.getFullYear(), d.getMonth(), 0).toISOString().split('T')[0];
}

function getStartOfWeek(): string {
    const d = getToday();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff)).toISOString().split('T')[0];
}

function getTodayStr(): string {
    return getToday().toISOString().split('T')[0];
}

/**
 * Padrões de regex para interpretar perguntas
 */
const QUERY_PATTERNS: Array<{
    regex: RegExp;
    handler: string;
    extractKeyword?: boolean;
}> = [
        // === GASTOS ===
        {
            regex: /quanto\s+(?:gastei|paguei)\s+(?:com|em|no|na)\s+(.+?)(?:\s+(?:este|esse|neste)\s+m[eê]s)?$/i,
            handler: 'sumByKeywordThisMonth',
            extractKeyword: true
        },
        {
            regex: /quanto\s+(?:gastei|paguei)\s+(?:com|em|no|na)\s+(.+?)\s+(?:m[eê]s\s+passado|[uú]ltimo\s+m[eê]s)/i,
            handler: 'sumByKeywordLastMonth',
            extractKeyword: true
        },
        {
            regex: /quanto\s+(?:gastei|paguei)\s+hoje/i,
            handler: 'sumToday'
        },
        {
            regex: /quanto\s+(?:gastei|paguei)\s+(?:esta|essa|nesta)\s+semana/i,
            handler: 'sumThisWeek'
        },
        {
            regex: /quanto\s+(?:gastei|paguei)\s+(?:este|esse|neste)\s+m[eê]s/i,
            handler: 'sumThisMonth'
        },
        {
            regex: /qual\s+(?:foi\s+)?(?:meu|o)\s+maior\s+gasto(?:\s+(?:este|esse|neste)\s+m[eê]s)?/i,
            handler: 'maxExpense'
        },
        {
            regex: /quantas?\s+vezes\s+(?:comprei|gastei|fui)\s+(?:com|em|no|na)\s+(.+)/i,
            handler: 'countByKeyword',
            extractKeyword: true
        },
        {
            regex: /(?:gastos?|despesas?)\s+(?:acima|maior|mais)\s+(?:de|que)\s+(\d+)/i,
            handler: 'expensesAbove',
            extractKeyword: true
        },

        // === RENDA ===
        {
            regex: /quanto\s+(?:recebi|ganhei|entrou)\s+(?:este|esse|neste)\s+m[eê]s/i,
            handler: 'sumIncomeThisMonth'
        },
        {
            regex: /(?:sobrou|sobra|faltou|falta|saldo)\s+(?:dinheiro|grana)?/i,
            handler: 'monthBalance'
        },
        {
            regex: /(?:qual|quanto\s+[eé])\s+(?:meu\s+)?saldo\s+total/i,
            handler: 'totalBalance'
        },

        // === COMPARATIVOS ===
        {
            regex: /gastei\s+mais\s+(?:ou\s+menos|que)\s+(?:m[eê]s\s+passado|antes)/i,
            handler: 'compareWithLastMonth'
        },

        // === CARTÕES ===
        {
            regex: /(?:qual|quanto\s+[eé])\s+(?:o\s+)?valor\s+(?:da\s+)?(?:pr[oó]xima|próximo)\s+fatura/i,
            handler: 'nextInvoiceValue'
        },
        {
            regex: /quanto\s+(?:tenho|está)\s+parcelado/i,
            handler: 'totalInstallments'
        },
        {
            regex: /quantas?\s+parcelas?\s+(?:faltam|restam)/i,
            handler: 'remainingInstallments'
        },

        // === ORÇAMENTO ===
        {
            regex: /quanto\s+(?:ainda\s+)?posso\s+gastar\s+(?:com|em)\s+(.+)/i,
            handler: 'budgetRemaining',
            extractKeyword: true
        },
        {
            regex: /(?:algum\s+)?or[çc]amento\s+(?:j[aá]\s+)?(?:estourou|passou)/i,
            handler: 'bustedBudgets'
        },

        // === PATRIMÔNIO ===
        {
            regex: /qual\s+conta\s+(?:tem|possui)\s+mais/i,
            handler: 'accountWithMostMoney'
        },
        {
            regex: /quanto\s+falta\s+(?:para|pra)\s+(?:minha\s+)?meta/i,
            handler: 'goalProgress'
        },

        // === LISTAGEM ===
        {
            regex: /(?:mostra|lista|quais)\s+(?:meus\s+)?(?:últimos|ultimos)?\s*(?:\d+)?\s*(?:gastos?|despesas?)/i,
            handler: 'listExpenses'
        },
    ];

/**
 * Detecta se a mensagem é uma pergunta/query financeira
 */
export function detectarQuery(texto: string): ParsedQuery {
    const textoNorm = texto.toLowerCase().trim();

    // Verificar se começa com palavras de pergunta
    const palavrasPergunta = ['quanto', 'quantas', 'quantos', 'qual', 'quais', 'sobrou', 'faltou', 'mostra', 'lista'];
    const ehPergunta = palavrasPergunta.some(p => textoNorm.startsWith(p));

    if (!ehPergunta) {
        return { isQuery: false, filters: null, rawQuestion: texto };
    }

    // Tentar casar com padrões conhecidos
    for (const pattern of QUERY_PATTERNS) {
        const match = textoNorm.match(pattern.regex);
        if (match) {
            const filters = buildFilters(pattern.handler, pattern.extractKeyword ? match[1] : null);
            return { isQuery: true, filters, rawQuestion: texto };
        }
    }

    // É uma pergunta mas não reconhecemos o padrão - retornar para IA processar
    return { isQuery: false, filters: null, rawQuestion: texto };
}

/**
 * Constrói os filtros baseado no handler identificado
 */
function buildFilters(handler: string, keyword: string | null): QueryFilters {
    const today = getTodayStr();
    const startOfMonth = getStartOfMonth(getToday());
    const endOfMonth = getEndOfMonth(getToday());

    // Limpar pontuação e espaços da keyword
    const cleanKeyword = keyword
        ?.replace(/[?!.,;:]/g, '')  // Remove pontuação
        .trim() || null;

    const baseFilters: QueryFilters = {
        date_start: null,
        date_end: null,
        tipo: null,
        keyword: cleanKeyword,
        aggregation: 'sum',
        group_by: null,
        limit: 50
    };

    switch (handler) {
        case 'sumByKeywordThisMonth':
            return { ...baseFilters, date_start: startOfMonth, date_end: endOfMonth, tipo: 'despesa', aggregation: 'sum' };

        case 'sumByKeywordLastMonth':
            return { ...baseFilters, date_start: getStartOfLastMonth(), date_end: getEndOfLastMonth(), tipo: 'despesa', aggregation: 'sum' };

        case 'sumToday':
            return { ...baseFilters, date_start: today, date_end: today, tipo: 'despesa', aggregation: 'sum' };

        case 'sumThisWeek':
            return { ...baseFilters, date_start: getStartOfWeek(), date_end: today, tipo: 'despesa', aggregation: 'sum' };

        case 'sumThisMonth':
            return { ...baseFilters, date_start: startOfMonth, date_end: endOfMonth, tipo: 'despesa', aggregation: 'sum' };

        case 'maxExpense':
            return { ...baseFilters, date_start: startOfMonth, date_end: endOfMonth, tipo: 'despesa', aggregation: 'max', limit: 1 };

        case 'countByKeyword':
            return { ...baseFilters, date_start: startOfMonth, date_end: endOfMonth, aggregation: 'count' };

        case 'expensesAbove':
            return { ...baseFilters, tipo: 'despesa', aggregation: 'list' };

        case 'sumIncomeThisMonth':
            return { ...baseFilters, date_start: startOfMonth, date_end: endOfMonth, tipo: 'receita', aggregation: 'sum' };

        case 'monthBalance':
            return { ...baseFilters, date_start: startOfMonth, date_end: endOfMonth, aggregation: 'sum' };

        case 'totalBalance':
            return { ...baseFilters, aggregation: 'sum' };

        case 'compareWithLastMonth':
            return { ...baseFilters, date_start: getStartOfLastMonth(), date_end: endOfMonth, tipo: 'despesa', group_by: null, aggregation: 'sum' };

        case 'listExpenses':
            return { ...baseFilters, tipo: 'despesa', aggregation: 'list', limit: 10 };

        default:
            return baseFilters;
    }
}

/**
 * Formata valor monetário
 */
export function formatarMoeda(valor: number): string {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(valor);
}
