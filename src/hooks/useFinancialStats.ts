import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useFinancialStats(groupId?: string) {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        totalBalance: 0,
        monthlyIncome: 0,
        monthlyExpenses: 0,
        monthlySavings: 0,
        trend: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const fetchStats = async () => {
            try {
                const currentMonth = new Date();
                const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
                const lastDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

                let accountsQuery = supabase
                    .from('accounts')
                    .select('saldo_atual')
                    .eq('ativo', true);

                if (groupId) {
                    accountsQuery = accountsQuery.eq('group_id', groupId);
                } else {
                    accountsQuery = accountsQuery.eq('user_id', user.id);
                }

                const { data: accounts, error: accountsError } = await accountsQuery;

                if (accountsError) throw accountsError;

                const totalBalance = accounts?.reduce((sum, acc) => sum + Number(acc.saldo_atual), 0) || 0;

                let transactionsQuery = supabase
                    .from('transactions')
                    .select('valor, tipo');

                if (groupId) {
                    transactionsQuery = transactionsQuery.eq('group_id', groupId);
                } else {
                    transactionsQuery = transactionsQuery.eq('user_id', user.id);
                }

                const { data: transactions, error: transactionsError } = await transactionsQuery
                    .gte('data_transacao', firstDayOfMonth.toISOString().split('T')[0])
                    .lte('data_transacao', lastDayOfMonth.toISOString().split('T')[0]);

                if (transactionsError) throw transactionsError;

                const monthlyIncome = transactions
                    ?.filter(t => t.tipo === 'receita')
                    .reduce((sum, t) => sum + Number(t.valor), 0) || 0;

                const monthlyExpenses = transactions
                    ?.filter(t => t.tipo === 'despesa')
                    .reduce((sum, t) => sum + Number(t.valor), 0) || 0;

                const monthlySavings = monthlyIncome - monthlyExpenses;

                const trend = monthlySavings > 0 ? 12 : -5;

                setStats({
                    totalBalance,
                    monthlyIncome,
                    monthlyExpenses,
                    monthlySavings,
                    trend
                });
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Erro ao carregar estatísticas');
            } finally {
                setLoading(false);
            }
        };

        fetchStats();

        const channel = supabase
            .channel('financial-stats-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'transactions',
                    filter: groupId ? `group_id=eq.${groupId}` : `user_id=eq.${user.id}`
                },
                () => fetchStats()
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'accounts',
                    filter: groupId ? `group_id=eq.${groupId}` : `user_id=eq.${user.id}`
                },
                () => fetchStats()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, groupId]);

    return { stats, loading, error };
}
