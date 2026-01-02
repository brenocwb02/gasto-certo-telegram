import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface DefaultBudget {
    id: string;
    user_id: string;
    category_id: string;
    amount: number;
    group_id: string | null;
    created_at: string;
    updated_at: string;
    category_name?: string;
    category_color?: string;
}

export function useDefaultBudgets(groupId?: string) {
    const { user } = useAuth();
    const [defaultBudgets, setDefaultBudgets] = useState<DefaultBudget[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchDefaultBudgets = useCallback(async () => {
        if (!user) {
            setDefaultBudgets([]);
            setLoading(false);
            return;
        }
        
        try {
            setLoading(true);
            
            let query = supabase
                .from('default_budgets')
                .select(`
                    *,
                    categories:category_id (
                        nome,
                        cor
                    )
                `);
            
            if (groupId) {
                query = query.eq('group_id', groupId);
            } else {
                query = query.is('group_id', null).eq('user_id', user.id);
            }
            
            const { data, error: fetchError } = await query;
            
            if (fetchError) throw fetchError;
            
            const formattedData = (data || []).map((item: any) => ({
                ...item,
                category_name: item.categories?.nome,
                category_color: item.categories?.cor
            }));
            
            setDefaultBudgets(formattedData);
        } catch (err) {
            console.error("Erro ao carregar orçamentos padrão:", err);
            setError(err instanceof Error ? err.message : 'Erro ao carregar orçamentos padrão');
        } finally {
            setLoading(false);
        }
    }, [user, groupId]);

    useEffect(() => {
        if (!user) return;
        
        fetchDefaultBudgets();
        
        const channel = supabase
            .channel(`default-budgets-changes-${groupId || 'personal'}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'default_budgets' },
                () => fetchDefaultBudgets()
            )
            .subscribe();
        
        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, fetchDefaultBudgets, groupId]);

    const addDefaultBudget = async (categoryId: string, amount: number) => {
        if (!user) return;
        
        try {
            const { error } = await supabase
                .from('default_budgets')
                .insert({
                    user_id: user.id,
                    group_id: groupId || null,
                    category_id: categoryId,
                    amount
                });
            
            if (error) throw error;
            await fetchDefaultBudgets();
        } catch (err) {
            console.error("Erro ao adicionar orçamento padrão:", err);
            throw err;
        }
    };

    const updateDefaultBudget = async (budgetId: string, amount: number) => {
        try {
            const { error } = await supabase
                .from('default_budgets')
                .update({ amount })
                .eq('id', budgetId);
            
            if (error) throw error;
            await fetchDefaultBudgets();
        } catch (err) {
            console.error("Erro ao atualizar orçamento padrão:", err);
            throw err;
        }
    };

    const deleteDefaultBudget = async (budgetId: string) => {
        try {
            const { error } = await supabase
                .from('default_budgets')
                .delete()
                .eq('id', budgetId);
            
            if (error) throw error;
            await fetchDefaultBudgets();
        } catch (err) {
            console.error("Erro ao excluir orçamento padrão:", err);
            throw err;
        }
    };

    return { 
        defaultBudgets, 
        loading, 
        error, 
        refetchDefaultBudgets: fetchDefaultBudgets, 
        addDefaultBudget, 
        updateDefaultBudget, 
        deleteDefaultBudget 
    };
}
