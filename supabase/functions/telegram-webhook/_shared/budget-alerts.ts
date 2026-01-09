/**
 * Budget Alerts
 * 
 * Sistema de alertas proativos quando orçamento atinge 80%.
 */

export interface BudgetAlertResult {
    message: string;
    categoryName: string;
    percentUsed: number;
}

/**
 * Verifica se a transação fez o orçamento atingir 80%+ e retorna alerta
 */
export async function checkBudgetThreshold(
    supabase: any,
    userId: string,
    categoryId: string | null,
    transactionAmount: number
): Promise<BudgetAlertResult | null> {
    if (!categoryId) return null;

    try {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const month = firstDay.toISOString().split('T')[0];

        // Buscar orçamento da categoria
        const { data: budgets } = await supabase
            .rpc('get_budgets_with_defaults', { p_month: month });

        if (!budgets || budgets.length === 0) return null;

        // Encontrar orçamento desta categoria
        const budget = budgets.find((b: any) => b.category_id === categoryId);
        if (!budget) return null;

        const budgetAmount = parseFloat(budget.amount);
        const newSpent = parseFloat(budget.spent); // Já inclui a transação recém adicionada
        const percentNow = (newSpent / budgetAmount) * 100;

        // Verificar thresholds
        if (percentNow >= 100) {
            return {
                message: `🚨 *Orçamento Estourado!*\n\n` +
                    `*${budget.category_name}* atingiu *${percentNow.toFixed(0)}%* do limite.\n` +
                    `Você gastou R$ ${newSpent.toFixed(2)} de R$ ${budgetAmount.toFixed(2)} disponível.\n\n` +
                    `_Considere revisar seus gastos nesta categoria._`,
                categoryName: budget.category_name,
                percentUsed: percentNow
            };
        }

        if (percentNow >= 80) {
            return {
                message: `⚠️ *Atenção ao Orçamento*\n\n` +
                    `*${budget.category_name}* atingiu *${percentNow.toFixed(0)}%* do limite.\n` +
                    `Restam R$ ${(budgetAmount - newSpent).toFixed(2)} para o mês.\n\n` +
                    `_Fique de olho nos próximos gastos!_`,
                categoryName: budget.category_name,
                percentUsed: percentNow
            };
        }

        return null;

    } catch (error) {
        console.error('[BudgetAlerts] Erro ao verificar threshold:', error);
        return null;
    }
}
