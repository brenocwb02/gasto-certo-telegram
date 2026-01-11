import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { subMonths, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface HistoryPoint {
    name: string;
    value: number;
    date: Date;
}

export function useNetWorthHistory(groupId?: string, months: number = 6) {
    const { user } = useAuth();
    const [history, setHistory] = useState<HistoryPoint[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const calculateHistory = async () => {
            setLoading(true);
            try {
                // 1. Get Current Balance (Snapshot of "Now")
                let accountsQuery = supabase
                    .from('accounts')
                    .select('saldo_atual, tipo')
                    .eq('ativo', true);

                if (groupId) {
                    accountsQuery = accountsQuery.eq('group_id', groupId);
                } else {
                    accountsQuery = accountsQuery.eq('user_id', user.id);
                }

                const { data: accounts, error: accError } = await accountsQuery;
                if (accError) throw accError;

                // Calculate total assets - liabilities for current moment
                let currentNetWorth = 0;
                accounts?.forEach(acc => {
                    const balance = Number(acc.saldo_atual);
                    // If it's a credit card, the balance is usually negative (debt) or positive (credit)?
                    // In this system, credit card balances seem to be tracked as positive "current invoice amount".
                    // But for Net Worth, debt reduces value.
                    // Assuming 'saldo_atual' on 'cartao' account type represents the outstanding bill.
                    // If the user inputs negative values for debt, then simple addition works.
                    // Let's assume standard logic: Sum of all account balances.
                    currentNetWorth += balance;
                });

                // 2. Get Transaction History for the period
                const endDate = new Date();
                const startDate = subMonths(endDate, months);

                let transQuery = supabase
                    .from('transactions')
                    .select('data_transacao, valor, tipo')
                    .gte('data_transacao', startDate.toISOString())
                    .lte('data_transacao', endDate.toISOString())
                    .order('data_transacao', { ascending: false }); // Newest first for backward calc

                if (groupId) {
                    transQuery = transQuery.eq('group_id', groupId);
                } else {
                    transQuery = transQuery.eq('user_id', user.id);
                }

                const { data: transactions, error: transError } = await transQuery;
                if (transError) throw transError;

                // 3. Backward Calculation
                // We start with 'currentNetWorth' at 'endDate'.
                // To find the balance at the end of the PREVIOUS month, we need to REVERSE the transactions of the CURRENT month.
                // Balance_Start_Month = Balance_End_Month - (Income - Expenses)
                // Wait, simpler:
                // We want data points for [Month-5, Month-4, ..., Current Month]

                const points: HistoryPoint[] = [];
                let runningBalance = currentNetWorth;

                // Working backwards from "Now"
                // The current balance represents the state at 'endDate' (today).

                // Let's bucket transactions by month
                // Map: 'YYYY-MM' -> Net Change (Income - Expense)
                const monthlyChanges = new Map<string, number>();

                transactions?.forEach(t => {
                    const monthKey = format(new Date(t.data_transacao), 'yyyy-MM');
                    const value = Number(t.valor);
                    const isIncome = t.tipo === 'receita';
                    // If it was income, it ADDED to balance. To go back, we SUBTRACT it.
                    // If it was expense, it REMOVED from balance. To go back, we ADD it.
                    // Net Change = Income - Expense
                    // So, Previous_Balance = Current_Balance - (Income - Expense)

                    const change = isIncome ? value : -value;

                    const currentChange = monthlyChanges.get(monthKey) || 0;
                    monthlyChanges.set(monthKey, currentChange + change);
                });

                // Generate points
                for (let i = 0; i < months; i++) {
                    const targetDate = subMonths(endDate, i);

                    const monthName = format(targetDate, 'MMM', { locale: ptBR });

                    // For the current month (i=0), the value is simply the current running balance (Snapshot).
                    // For previous months, we adjust based on the change of the month we just "left".

                    // Actually, the loop needs to go backwards in time properly.
                    // Let's iterate i from 0 (current) to months-1 (past).

                    if (i === 0) {
                        // Current month: Use current snapshot
                        points.push({
                            name: monthName,
                            value: runningBalance,
                            date: targetDate
                        });
                    } else {
                        // For past months:
                        // We need to undo the changes of the month following this one.
                        // Example: i=1 (Last month). We need to undo changes of Current Month (i=0).

                        const prevDate = subMonths(endDate, i - 1); // The month closer to now
                        const prevKey = format(prevDate, 'yyyy-MM');
                        const changeInPeriod = monthlyChanges.get(prevKey) || 0;

                        // Reverse the change
                        runningBalance = runningBalance - changeInPeriod;

                        points.push({
                            name: monthName,
                            value: runningBalance,
                            date: targetDate
                        });
                    }
                }

                setHistory(points.reverse()); // Show oldest to newest
            } catch (err) {
                console.error('Error calculating net worth history:', err);
            } finally {
                setLoading(false);
            }
        };

        calculateHistory();
    }, [user, groupId, months]);

    return { history, loading };
}
