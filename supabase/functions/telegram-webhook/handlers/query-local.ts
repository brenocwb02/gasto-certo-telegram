/**
 * Handler para Query Engine Local
 * Executa queries e formata respostas - SEM usar IA
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { detectarQuery, formatarMoeda, QueryFilters } from '../_shared/parsers/query-local.ts';
import { sendTelegramMessage } from '../_shared/telegram-api.ts';

interface Transaction {
    id: string;
    descricao: string;
    valor: number;
    tipo: 'receita' | 'despesa' | 'transferencia';
    data_transacao: string;
    category?: { nome: string } | null;
    account?: { nome: string } | null;
}

/**
 * Verifica se a mensagem é uma query e processa localmente
 * Retorna true se processou, false se deve continuar para IA
 */
export async function handleQueryLocal(
    chatId: number,
    texto: string,
    userId: string,
    supabase: ReturnType<typeof createClient>
): Promise<boolean> {
    const query = detectarQuery(texto);

    if (!query.isQuery || !query.filters) {
        return false; // Não é uma query reconhecida, passar para IA
    }

    try {
        // Executar query
        const results = await executeLocalQuery(supabase, userId, query.filters);

        // Formatar resposta
        const response = formatLocalResponse(query.filters, results, query.rawQuestion);

        // Enviar resposta
        await sendTelegramMessage(chatId, response);

        return true; // Processado com sucesso
    } catch (error) {
        console.error('[Query Local] Error:', error);
        return false; // Falhou, passar para IA como fallback
    }
}

/**
 * Executa a query no banco de dados
 */
async function executeLocalQuery(
    supabase: ReturnType<typeof createClient>,
    userId: string,
    filters: QueryFilters
): Promise<Transaction[]> {
    // Se tiver keyword, primeiro buscar categorias que correspondem (incluindo pais)
    let matchingCategoryIds: string[] = [];

    if (filters.keyword) {
        const keywordLower = filters.keyword.toLowerCase();

        // Buscar todas as categorias do usuário
        const { data: allCategories } = await supabase
            .from('categories')
            .select('id, nome, parent_id')
            .eq('user_id', userId);

        if (allCategories) {
            // Encontrar categorias que dão match (pelo nome)
            const matchingParents = allCategories.filter((c: any) =>
                c.nome?.toLowerCase().includes(keywordLower)
            );

            // Adicionar IDs das categorias pai que dão match
            const matchingParentIds = matchingParents.map((c: any) => c.id);

            // Encontrar subcategorias cujo parent_id está nos matchingParentIds
            const childrenOfMatch = allCategories.filter((c: any) =>
                matchingParentIds.includes(c.parent_id)
            );

            // Combinar: categorias que dão match + suas filhas
            matchingCategoryIds = [
                ...matchingParentIds,
                ...childrenOfMatch.map((c: any) => c.id)
            ];

            console.log(`[Query Local] Keyword: "${filters.keyword}", matching categories:`, matchingCategoryIds.length);
        }
    }

    let query = supabase
        .from('transactions')
        .select(`
            id,
            descricao,
            valor,
            tipo,
            data_transacao,
            categoria_id,
            category:categories(nome),
            account:accounts!conta_origem_id(nome)
        `)
        .eq('user_id', userId);

    // Aplicar filtros de data
    if (filters.date_start) {
        query = query.gte('data_transacao', filters.date_start);
    }
    if (filters.date_end) {
        query = query.lte('data_transacao', filters.date_end);
    }

    // Aplicar filtro de tipo
    if (filters.tipo) {
        query = query.eq('tipo', filters.tipo);
    }

    // Ordenar e limitar
    query = query.order('data_transacao', { ascending: false }).limit(filters.limit);

    const { data, error } = await query;
    if (error) throw error;

    let results = (data || []) as any[];

    // Filtrar por keyword na descrição OU categoria
    if (filters.keyword) {
        const keywordLower = filters.keyword.toLowerCase();
        results = results.filter(t => {
            // Buscar na descrição
            if (t.descricao?.toLowerCase().includes(keywordLower)) return true;
            // Buscar no nome da categoria
            if (t.category?.nome?.toLowerCase().includes(keywordLower)) return true;
            // Buscar se a categoria está na lista de matches (inclui subcategorias de categoria pai)
            if (matchingCategoryIds.includes(t.categoria_id)) return true;
            return false;
        });
    }

    return results as Transaction[];
}

/**
 * Formata a resposta da query
 */
function formatLocalResponse(
    filters: QueryFilters,
    results: Transaction[],
    question: string
): string {
    const header = `❓ *${question}*\n\n`;

    if (results.length === 0) {
        return header + '📊 Nenhuma transação encontrada para os critérios.';
    }

    switch (filters.aggregation) {
        case 'sum': {
            // Para saldo mensal, precisa calcular receitas - despesas
            if (filters.tipo === null) {
                const receitas = results
                    .filter(t => t.tipo === 'receita')
                    .reduce((sum, t) => sum + Number(t.valor), 0);
                const despesas = results
                    .filter(t => t.tipo === 'despesa')
                    .reduce((sum, t) => sum + Number(t.valor), 0);
                const saldo = receitas - despesas;
                const emoji = saldo >= 0 ? '💚' : '🔴';
                return header +
                    `${emoji} Saldo: ${formatarMoeda(saldo)}\n` +
                    `💰 Receitas: ${formatarMoeda(receitas)}\n` +
                    `💸 Despesas: ${formatarMoeda(despesas)}\n` +
                    `📊 ${results.length} transações`;
            }

            const total = results.reduce((sum, t) => sum + Number(t.valor), 0);
            const keyword = filters.keyword ? ` com ${filters.keyword}` : '';
            const emoji = filters.tipo === 'receita' ? '💰' : '💸';
            return header + `${emoji} Total${keyword}: ${formatarMoeda(total)} (${results.length} transações)`;
        }

        case 'count': {
            const keyword = filters.keyword ? ` com ${filters.keyword}` : '';
            return header + `📊 ${results.length} transações${keyword}`;
        }

        case 'max': {
            if (results.length === 0) return header + '📊 Nenhum gasto encontrado.';
            // Ordenar por valor decrescente
            const sorted = [...results].sort((a, b) => Number(b.valor) - Number(a.valor));
            const maior = sorted[0];
            const date = new Date(maior.data_transacao).toLocaleDateString('pt-BR');
            return header +
                `💸 Maior gasto: ${formatarMoeda(Number(maior.valor))}\n` +
                `📝 ${maior.descricao}\n` +
                `📅 ${date}`;
        }

        case 'list': {
            const list = results.slice(0, 10).map(t => {
                const emoji = t.tipo === 'receita' ? '💰' : '💸';
                const date = new Date(t.data_transacao).toLocaleDateString('pt-BR');
                return `${emoji} ${t.descricao}: ${formatarMoeda(Number(t.valor))} (${date})`;
            }).join('\n');

            const more = results.length > 10 ? `\n\n... e mais ${results.length - 10}` : '';
            return header + `📋 Transações:\n\n${list}${more}`;
        }

        default:
            return header + `📊 ${results.length} transações encontradas.`;
    }
}
