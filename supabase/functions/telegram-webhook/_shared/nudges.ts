/**
 * Nudges Comportamentais
 * 
 * Sistema de reflexão inteligente antes de confirmar gastos.
 * Ajuda o usuário a tomar decisões conscientes.
 */

export interface NudgeResult {
    message: string;
    severity: 'info' | 'warning' | 'danger';
    categoryName?: string;
    percentUsed?: number;
}

/**
 * Gera um nudge baseado no orçamento e contexto do usuário
 * Usa queries diretas em vez de RPC para evitar problemas com auth.uid()
 */
export async function generateNudge(
    supabase: any,
    userId: string,
    categoryId: string | null,
    valor: number
): Promise<NudgeResult | null> {
    if (!categoryId) return null;

    try {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        const monthStart = `${year}-${String(month).padStart(2, '0')}-01`;
        const monthEnd = `${year}-${String(month).padStart(2, '0')}-31`;

        console.log(`[Nudges] Buscando budget para user=${userId}, category=${categoryId}`);

        // Primeiro, descobrir a categoria pai (se for subcategoria)
        const { data: categoryInfo } = await supabase
            .from('categories')
            .select('id, nome, parent_id')
            .eq('id', categoryId)
            .single();

        // Determinar qual ID usar para buscar orçamento (parent se existir)
        const budgetCategoryId = categoryInfo?.parent_id || categoryId;
        console.log(`[Nudges] Category info: nome=${categoryInfo?.nome}, parent=${categoryInfo?.parent_id}, budgetCatId=${budgetCategoryId}`);

        // Buscar orçamento do mês para esta categoria
        const { data: budgetData, error: budgetError } = await supabase
            .from('budgets')
            .select('id, amount, category:categories(id, nome)')
            .eq('user_id', userId)
            .eq('category_id', budgetCategoryId)
            .gte('month', monthStart)
            .lte('month', monthEnd)
            .maybeSingle();

        if (budgetError) {
            console.error('[Nudges] Erro ao buscar budget:', budgetError);
        }

        // Se não tem budget específico do mês, tentar default
        let budget = budgetData;
        if (!budget) {
            console.log('[Nudges] Não encontrou budget do mês, tentando default...');
            const { data: defaultBudget, error: defaultError } = await supabase
                .from('default_budgets')
                .select('id, amount, category:categories(id, nome)')
                .eq('user_id', userId)
                .eq('category_id', budgetCategoryId)
                .maybeSingle();

            if (defaultError) {
                console.error('[Nudges] Erro ao buscar default budget:', defaultError);
            }
            budget = defaultBudget;
        }

        if (!budget) {
            console.log('[Nudges] Nenhum orçamento encontrado para esta categoria');
            return null;
        }

        const budgetAmount = parseFloat(budget.amount);
        const categoryName = (budget.category as any)?.nome || 'Esta categoria';
        console.log(`[Nudges] Budget encontrado: ${categoryName} = R$ ${budgetAmount}`);

        // Calcular gasto atual do mês (transações da categoria OU subcategorias dela)
        // Primeiro buscar subcategorias
        const { data: subcategories } = await supabase
            .from('categories')
            .select('id')
            .eq('parent_id', budgetCategoryId);

        const validCategoryIds = [budgetCategoryId];
        subcategories?.forEach((sub: any) => validCategoryIds.push(sub.id));
        console.log(`[Nudges] Buscando transações para categorias:`, validCategoryIds);

        // Buscar transações do mês dessas categorias
        const { data: transactions, error: txError } = await supabase
            .from('transactions')
            .select('valor')
            .eq('user_id', userId)
            .eq('tipo', 'despesa')
            .in('categoria_id', validCategoryIds)
            .gte('data_transacao', monthStart)
            .lte('data_transacao', monthEnd);

        if (txError) {
            console.error('[Nudges] Erro ao buscar transações:', txError);
        }

        let currentSpent = 0;
        if (transactions) {
            for (const tx of transactions) {
                currentSpent += parseFloat(tx.valor);
            }
        }

        const newTotal = currentSpent + valor;
        const percentBefore = (currentSpent / budgetAmount) * 100;
        const percentAfter = (newTotal / budgetAmount) * 100;

        console.log(`[Nudges] ${categoryName}: R$${currentSpent.toFixed(2)}/${budgetAmount.toFixed(2)} (${percentBefore.toFixed(0)}% -> ${percentAfter.toFixed(0)}%)`);

        // Lógica de Nudges

        // Caso 1: Vai ultrapassar 100%
        if (percentAfter > 100 && percentBefore <= 100) {
            return {
                message: `Este gasto vai *estourar* o orçamento de *${categoryName}*!\n` +
                    `📊 Atual: ${percentBefore.toFixed(0)}% → Depois: ${percentAfter.toFixed(0)}%\n\n` +
                    `_Tem certeza que quer continuar?_`,
                severity: 'danger',
                categoryName: categoryName,
                percentUsed: percentAfter
            };
        }

        // Caso 2: Vai passar de 80% (zona de alerta)
        if (percentAfter > 80 && percentBefore <= 80) {
            return {
                message: `⚠️ *${categoryName}* vai atingir *${percentAfter.toFixed(0)}%* do orçamento.\n\n` +
                    `Você ainda tem R$ ${(budgetAmount - newTotal).toFixed(2)} disponível este mês.\n\n` +
                    `_Isso te aproxima dos seus objetivos?_`,
                severity: 'warning',
                categoryName: categoryName,
                percentUsed: percentAfter
            };
        }

        // Caso 3: Já está acima de 80% e vai aumentar mais
        if (percentBefore >= 80 && percentAfter > percentBefore) {
            return {
                message: `🔴 *${categoryName}* já está em ${percentBefore.toFixed(0)}%!\n\n` +
                    `Este gasto vai levar para ${percentAfter.toFixed(0)}%.\n\n` +
                    `_Pense bem antes de confirmar._`,
                severity: 'danger',
                categoryName: categoryName,
                percentUsed: percentAfter
            };
        }

        return null;

    } catch (error) {
        console.error('[Nudges] Erro ao gerar nudge:', error);
        return null;
    }
}

/**
 * Retorna frase motivacional aleatória
 */
export function getMotivationalPhrase(): string {
    const phrases = [
        "Pequenas escolhas fazem grandes diferenças! 💪",
        "Cada real economizado é um passo para seu sonho! 🎯",
        "Controle hoje, liberdade amanhã! 🚀",
        "Você está no caminho certo! 📈",
        "Decisões conscientes = vida tranquila! 😌"
    ];
    return phrases[Math.floor(Math.random() * phrases.length)];
}
