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
        trend: 0,
        incomeTrend: 0,
        expenseTrend: 0,
        savingsTrend: 0
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

                // Calculate Previous Month Data for Trends
                const previousMonthDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
                const firstDayOfPrevMonth = new Date(previousMonthDate.getFullYear(), previousMonthDate.getMonth(), 1);
                const lastDayOfPrevMonth = new Date(previousMonthDate.getFullYear(), previousMonthDate.getMonth() + 1, 0);

                // Re-create query for previous month to avoid filter pollution
                let prevTransactionsQuery = supabase
                    .from('transactions')
                    .select('valor, tipo');

                if (groupId) {
                    prevTransactionsQuery = prevTransactionsQuery.eq('group_id', groupId);
                } else {
                    prevTransactionsQuery = prevTransactionsQuery.eq('user_id', user.id);
                }

                const { data: prevTransactions } = await prevTransactionsQuery
                    .gte('data_transacao', firstDayOfPrevMonth.toISOString().split('T')[0])
                    .lte('data_transacao', lastDayOfPrevMonth.toISOString().split('T')[0]);

                const prevMonthlyIncome = prevTransactions
                    ?.filter(t => t.tipo === 'receita')
                    .reduce((sum, t) => sum + Number(t.valor), 0) || 0;

                const prevMonthlyExpenses = prevTransactions
                    ?.filter(t => t.tipo === 'despesa')
                    .reduce((sum, t) => sum + Number(t.valor), 0) || 0;

                const prevMonthlySavings = prevMonthlyIncome - prevMonthlyExpenses;

                // Calculate Trends (Percentage Change)
                const calculateTrend = (current: number, previous: number) => {
                    if (previous === 0) return current > 0 ? 100 : 0;
                    return ((current - previous) / Math.abs(previous)) * 100;
                };

                const incomeTrend = calculateTrend(monthlyIncome, prevMonthlyIncome);
                const expenseTrend = calculateTrend(monthlyExpenses, prevMonthlyExpenses);
                const savingsTrend = calculateTrend(monthlySavings, prevMonthlySavings);

                // Balance Trend (Total Net Worth change is hard to track without history table, 
                // typically we use Savings Trend as proxy or just keep it 0 for now unless we track daily balance history).
                // Let's use Savings Trend for the main card for now, or just 0 if stable.

                setStats({
                    totalBalance,
                    monthlyIncome,
                    monthlyExpenses,
                    monthlySavings,
                    incomeTrend,
                    expenseTrend,
                    savingsTrend,
                    trend: savingsTrend // Default trend legacy
                });
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Erro ao carregar estatísticas');
            } finally {
                setLoading(false);
            }
        };

        fetchStats();

        const channel = supabase
            .channel(`financial-stats-changes-${groupId || 'personal'}-${user.id}`)
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
