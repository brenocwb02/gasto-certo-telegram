import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/integrations/supabase/types';

type Tables = Database['public']['Tables'];
type Transaction = Tables['transactions']['Row'];
type Account = Tables['accounts']['Row'];
type Category = Tables['categories']['Row'];
type Profile = Tables['profiles']['Row'];
type Goal = Tables['goals']['Row'];


export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;
        setProfile(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar perfil');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const updateOnboardingCompleted = async (completed: boolean = true) => {
    if (!user || !profile) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ onboarding_completed: completed })
        .eq('user_id', user.id);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, onboarding_completed: completed } : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar onboarding');
    }
  };

  return { profile, loading, error, updateOnboardingCompleted };
}

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
      .channel('transactions-changes')
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

  return { transactions, loading, error, addTransaction, updateTransaction, deleteTransaction };
}

export function useAccounts(groupId?: string) {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setAccounts([]);
      setLoading(false);
      return;
    }

    const fetchAccounts = async () => {
      try {
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
    };

    fetchAccounts();

    const channel = supabase
      .channel('accounts-changes')
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
  }, [user, groupId]);

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

  return { accounts, loading, error, addAccount, updateAccount, deleteAccount, getTotalBalance };
}

export function useCategories(groupId?: string) {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setCategories([]);
      setLoading(false);
      return;
    }

    const fetchCategories = async () => {
      try {
        let query = supabase
          .from('categories')
          .select('*')
          .order('nome');

        if (groupId) {
          query = query.eq('group_id', groupId);
        } else {
          query = query.eq('user_id', user.id);
        }

        const { data, error } = await query;

        if (error) throw error;
        setCategories(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar categorias');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();

    const channel = supabase
      .channel('categories-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'categories',
          filter: groupId ? `group_id=eq.${groupId}` : `user_id=eq.${user.id}`
        },
        () => {
          fetchCategories();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, groupId]);

  return { categories, loading, error };
}


export function useGoals(groupId?: string) {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGoals = useCallback(async () => {
    if (!user) {
      setGoals([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      let query = supabase
        .from('goals')
        .select('*, categories(nome, cor)');

      if (groupId) {
        query = query.eq('group_id', groupId);
      } else {
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGoals(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar metas');
    } finally {
      setLoading(false);
    }
  }, [user, groupId]);

  useEffect(() => {
    if (!user) return;
    fetchGoals();

    const channel = supabase
      .channel('goals-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'goals',
          filter: groupId ? `group_id=eq.${groupId}` : `user_id=eq.${user.id}`
        },
        () => fetchGoals()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, groupId, fetchGoals]);

  const deleteGoal = async (goalId: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', goalId);

      if (error) throw error;
      setGoals(prev => prev.filter(g => g.id !== goalId));
      return true;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erro ao excluir meta');
    }
  };

  return { goals, loading, error, refetchGoals: fetchGoals, deleteGoal };
}

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

// Hook para gerenciar perfil financeiro (quiz de saúde financeira)
export function useFinancialProfile() {
  const { user } = useAuth();
  const [financialProfile, setFinancialProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setFinancialProfile(null);
      setLoading(false);
      return;
    }

    const fetchFinancialProfile = async () => {
      try {
        const { data, error } = await (supabase as any)
          .from('financial_profile')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;
        setFinancialProfile(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar perfil financeiro');
      } finally {
        setLoading(false);
      }
    };

    fetchFinancialProfile();
  }, [user]);

  const submitFinancialProfile = async (answers: {
    emergency_fund: string;
    debt_situation: string;
    savings_rate: string;
    investment_knowledge: string;
    financial_goals: string;
    budget_control: string;
    insurance_coverage: string;
    retirement_planning: string;
  }) => {
    if (!user) return;

    try {
      setLoading(true);

      // Usar upsert para criar ou atualizar o perfil
      const { data, error } = await (supabase as any)
        .from('financial_profile')
        .upsert({
          user_id: user.id,
          ...answers,
          completed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      setFinancialProfile(data);
      setError(null);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao salvar perfil financeiro';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getFinancialHealthLevel = (score: number) => {
    if (score >= 80) return { level: 'Excelente', color: 'text-green-600', bgColor: 'bg-green-100' };
    if (score >= 60) return { level: 'Bom', color: 'text-blue-600', bgColor: 'bg-blue-100' };
    if (score >= 40) return { level: 'Regular', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    if (score >= 20) return { level: 'Precisa Melhorar', color: 'text-orange-600', bgColor: 'bg-orange-100' };
    return { level: 'Crítico', color: 'text-red-600', bgColor: 'bg-red-100' };
  };

  const getRecommendations = () => {
    if (!financialProfile?.recommendations) return [];

    try {
      return Array.isArray(financialProfile.recommendations)
        ? financialProfile.recommendations
        : JSON.parse(financialProfile.recommendations as string);
    } catch {
      return [];
    }
  };

  return {
    financialProfile,
    loading,
    error,
    submitFinancialProfile,
    getFinancialHealthLevel,
    getRecommendations,
    hasCompletedQuiz: !!financialProfile
  };
}
