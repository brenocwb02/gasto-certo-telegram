import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAccounts } from './useAccounts';
import { endOfMonth, differenceInDays } from 'date-fns';

interface CashFlowProjection {
    currentBalance: number;
    projectedIncome: number;
    projectedExpenses: number;
    projectedBalance: number;
    daysUntilEndOfMonth: number;
    loading: boolean;
    error: string | null;
}

/**
 * Hook para calcular projeção de fluxo de caixa até fim do mês
 * Baseado em:
 * - Saldo atual das contas
 * - Receitas recorrentes previstas
 * - Despesas recorrentes previstas
 */
export function useCashFlowProjection(): CashFlowProjection {
    const { user } = useAuth();
    const { accounts } = useAccounts();
    const [state, setState] = useState<CashFlowProjection>({
        currentBalance: 0,
        projectedIncome: 0,
        projectedExpenses: 0,
        projectedBalance: 0,
        daysUntilEndOfMonth: 0,
        loading: true,
        error: null
    });

    useEffect(() => {
        if (!user) return;

        const calculateProjection = async () => {
            try {
                const today = new Date();
                const endOfMonthDate = endOfMonth(today);
                const daysUntilEndOfMonth = differenceInDays(endOfMonthDate, today);
                const currentDay = today.getDate();
                const lastDay = endOfMonthDate.getDate();

                // 1. Calcular saldo atual das contas (excluindo cartões de crédito)
                const currentBalance = accounts
                    .filter(acc => acc.tipo !== 'cartao_credito')
                    .reduce((sum, acc) => sum + Number(acc.saldo_atual || 0), 0);

                // 2. Buscar transações recorrentes ativas
                const { data: recurrences, error: recError } = await supabase
                    .from('recurring_transactions')
                    .select('tipo, valor, dia_vencimento')
                    .eq('user_id', user.id)
                    .eq('ativa', true);

                if (recError) throw recError;

                let projectedIncome = 0;
                let projectedExpenses = 0;

                // 3. Calcular valores a receber/pagar até fim do mês
                if (recurrences) {
                    recurrences.forEach(rec => {
                        const dueDay = rec.dia_vencimento || 1;

                        // Só considerar se vencimento é no futuro (ou hoje)
                        if (dueDay >= currentDay && dueDay <= lastDay) {
                            const valor = Number(rec.valor || 0);
                            if (rec.tipo === 'receita') {
                                projectedIncome += valor;
                            } else if (rec.tipo === 'despesa') {
                                projectedExpenses += valor;
                            }
                        }
                    });
                }

                // 4. Calcular saldo projetado
                const projectedBalance = currentBalance + projectedIncome - projectedExpenses;

                setState({
                    currentBalance,
                    projectedIncome,
                    projectedExpenses,
                    projectedBalance,
                    daysUntilEndOfMonth,
                    loading: false,
                    error: null
                });

            } catch (error) {
                console.error('Erro na projeção de fluxo de caixa:', error);
                setState(prev => ({
                    ...prev,
                    loading: false,
                    error: 'Erro ao calcular projeção'
                }));
            }
        };

        calculateProjection();
    }, [user, accounts]);

    return state;
}
