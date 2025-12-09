import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/integrations/supabase/types';

type Account = Database['public']['Tables']['accounts']['Row'];

export function useAccounts(groupId?: string) {
    const { user } = useAuth();
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAccounts = useCallback(async () => {
        if (!user) {
            setAccounts([]);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            let query = supabase
                .from('accounts')
                .select('*')
                .eq('ativo', true)
                .order('created_at');

            if (groupId) {
                query = query.eq('group_id', groupId);
            } else {
                query = query.eq('user_id', user.id);
            }

            const { data, error } = await query;

            if (error) throw error;
            setAccounts(data || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao carregar contas');
        } finally {
            setLoading(false);
        }
    }, [user, groupId]);

    useEffect(() => {
        if (!user) return;

        fetchAccounts();

        const channel = supabase
            .channel(`accounts-changes-${groupId || 'personal'}-${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'accounts',
                    filter: groupId ? `group_id=eq.${groupId}` : `user_id=eq.${user.id}`
                },
                () => {
                    fetchAccounts();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, groupId, fetchAccounts]);

    const addAccount = async (account: Omit<Account, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
        if (!user) return;

        try {
            const accountData = { ...account, user_id: user.id };
            if (groupId && !accountData.group_id) {
                accountData.group_id = groupId;
            }

            const { data, error } = await supabase
                .from('accounts')
                .insert([accountData])
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (err) {
            throw new Error(err instanceof Error ? err.message : 'Erro ao criar conta');
        }
    };

    const updateAccount = async (
        id: string,
        updates: Partial<Omit<Account, 'id' | 'created_at' | 'updated_at' | 'user_id'>>
    ) => {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .from('accounts')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data as Account;
        } catch (err) {
            throw new Error(err instanceof Error ? err.message : 'Erro ao atualizar conta');
        }
    };

    const deleteAccount = async (id: string) => {
        if (!user) return;
        try {
            const { error } = await supabase
                .from('accounts')
                .update({ ativo: false })
                .eq('id', id);

            if (error) throw error;
            return true;
        } catch (err) {
            throw new Error(err instanceof Error ? err.message : 'Erro ao excluir conta');
        }
    };

    const getTotalBalance = () => {
        return accounts.reduce((total, account) => total + Number(account.saldo_atual), 0);
    };

    return { accounts, loading, error, addAccount, updateAccount, deleteAccount, getTotalBalance, refetchAccounts: fetchAccounts };
}
