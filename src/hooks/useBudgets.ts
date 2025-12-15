import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useBudgets(month: Date, groupId?: string) {
    const { user } = useAuth();
    const [budgets, setBudgets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Create a stable string representation of the month to use in dependencies
    const monthString = month.toISOString().slice(0, 7); // YYYY-MM

    const fetchBudgets = useCallback(async () => {
        if (!user) {
            setBudgets([]);
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            const monthDate = `${monthString}-01`;

            const { data: budgetsData, error: budgetsError } = await supabase
                .rpc('get_budgets_with_spent', {
                    p_month: monthDate,
                    p_group_id: groupId ?? undefined
                });

            if (budgetsError) {
                console.error('Budget RPC error:', budgetsError);
                throw budgetsError;
            }

            setBudgets(budgetsData || []);
        } catch (err) {
            console.error("Erro ao carregar orçamentos:", err);
            if (err && typeof err === 'object') {
                console.error("Detalhes do erro:", JSON.stringify(err, null, 2));
            }
            setError(err instanceof Error ? err.message : 'Erro ao carregar orçamentos');
        } finally {
            setLoading(false);
        }
    }, [user, monthString, groupId]); // Dependency array is now stable

    useEffect(() => {
        if (!user) return;

        fetchBudgets();

        // Inscreve em mudanças de budgets e transactions para refetch automático

        const channel = supabase
            .channel(`budgets-transactions-changes-${groupId || 'personal'}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'budgets' }, // Ouvir tudo e deixar o fetch filtrar é mais seguro se o filtro for complexo
                () => fetchBudgets()
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'transactions' },
                () => fetchBudgets()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };

    }, [user, fetchBudgets, groupId]); // fetchBudgets is now stable

    const addBudget = async (categoryId: string, amount: number) => {
        if (!user) return;
        try {
            const monthDate = `${monthString}-01`;
            const { error } = await supabase
                .from('budgets')
                .insert({
                    user_id: user.id,
                    group_id: groupId || null,
                    category_id: categoryId,
                    amount,
                    month: monthDate
                });

            if (error) throw error;
            await fetchBudgets();
        } catch (err) {
            console.error("Erro ao adicionar orçamento:", err);
            throw err;
        }
    };

    const updateBudget = async (budgetId: string, amount: number) => {
        try {
            const { error } = await supabase
                .from('budgets')
                .update({ amount })
                .eq('id', budgetId);

            if (error) throw error;
            await fetchBudgets();
        } catch (err) {
            console.error("Erro ao atualizar orçamento:", err);
            throw err;
        }
    };

    const deleteBudget = async (budgetId: string) => {
        try {
            const { error } = await supabase
                .from('budgets')
                .delete()
                .eq('id', budgetId);

            if (error) throw error;
            await fetchBudgets();
        } catch (err) {
            console.error("Erro ao excluir orçamento:", err);
            throw err;
        }
    };

    return { budgets, loading, error, refetchBudgets: fetchBudgets, addBudget, updateBudget, deleteBudget };
}
