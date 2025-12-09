import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/integrations/supabase/types';

type Transaction = Database['public']['Tables']['transactions']['Row'];

export function useTransactions(groupId?: string) {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTransactions = useCallback(async () => {
        if (!user) {
            setTransactions([]);
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            let query = supabase
                .from('transactions')
                .select('*');

            if (groupId) {
                query = query.eq('group_id', groupId);
            } else {
                query = query.eq('user_id', user.id);
            }

            const { data, error } = await query
                .order('data_transacao', { ascending: false })
                .order('created_at', { ascending: false });

            if (error) throw error;
            setTransactions(data || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao carregar transações');
        } finally {
            setLoading(false);
        }
    }, [user, groupId]);


    useEffect(() => {
        if (!user) return;
        fetchTransactions();

        const channel = supabase
            .channel(`transactions-changes-${groupId || 'personal'}-${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'transactions',
                    filter: groupId ? `group_id=eq.${groupId}` : `user_id=eq.${user.id}`
                },
                () => fetchTransactions()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, groupId, fetchTransactions]);

    const addTransaction = async (transaction: Omit<Transaction, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
        if (!user) return;
        try {
            const transactionData = { ...transaction, user_id: user.id };
            if (groupId && !transactionData.group_id) {
                transactionData.group_id = groupId;
            }

            const { data, error } = await supabase
                .from('transactions')
                .insert([transactionData])
                .select()
                .single();
            if (error) throw error;
            return data;
        } catch (err) {
            throw new Error(err instanceof Error ? err.message : 'Erro ao criar transação');
        }
    };

    const updateTransaction = async (
        id: string,
        updates: Partial<Omit<Transaction, 'id' | 'created_at' | 'updated_at' | 'user_id'>>
    ) => {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .from('transactions')
                .update({ ...updates })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            setTransactions(prev => prev.map(t => (t.id === id ? (data as Transaction) : t)));
            return data as Transaction;
        } catch (err) {
            throw new Error(err instanceof Error ? err.message : 'Erro ao atualizar transação');
        }
    };

    const deleteTransaction = async (id: string) => {
        if (!user) return;
        try {
            const { error } = await supabase
                .from('transactions')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setTransactions(prev => prev.filter(t => t.id !== id));
            return true;
        } catch (err) {
            throw new Error(err instanceof Error ? err.message : 'Erro ao excluir transação');
        }
    };

    return { transactions, loading, error, addTransaction, updateTransaction, deleteTransaction, refetchTransactions: fetchTransactions };
}
