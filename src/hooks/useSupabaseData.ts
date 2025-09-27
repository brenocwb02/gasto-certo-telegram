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
type Budget = Tables['budgets']['Row'];


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

  return { profile, loading, error };
}

export function useTransactions() {
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
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('data_transacao', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar transações');
    } finally {
      setLoading(false);
    }
  }, [user]);


  useEffect(() => {
    if(!user) return;
    fetchTransactions();

    const channel = supabase
      .channel('transactions-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${user.id}` },
        () => fetchTransactions()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchTransactions]);

  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert([{ ...transaction, user_id: user.id }])
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
        .eq('user_id', user.id)
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
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      setTransactions(prev => prev.filter(t => t.id !== id));
      return true;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erro ao excluir transação');
    }
  };

  return { transactions, loading, error, addTransaction, updateTransaction, deleteTransaction };
}

export function useAccounts() {
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
        const { data, error } = await supabase
          .from('accounts')
          .select('*')
          .eq('user_id', user.id)
          .eq('ativo', true)
          .order('created_at');

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
        { event: '*', schema: 'public', table: 'accounts', filter: `user_id=eq.${user.id}` },
        () => {
          fetchAccounts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const addAccount = async (account: Omit<Account, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('accounts')
        .insert([{ ...account, user_id: user.id }])
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
        .eq('user_id', user.id)
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
        .eq('id', id)
        .eq('user_id', user.id);

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

export function useCategories() {
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
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .eq('user_id', user.id)
          .order('nome');

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
        { event: '*', schema: 'public', table: 'categories', filter: `user_id=eq.${user.id}` },
        () => {
          fetchCategories();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { categories, loading, error };
}


export function useGoals() {
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
      const { data, error } = await supabase
        .from('goals')
        .select('*, categories(nome, cor)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGoals(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar metas');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if(!user) return;
    fetchGoals();

    const channel = supabase
      .channel('goals-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'goals', filter: `user_id=eq.${user.id}` },
        () => fetchGoals()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchGoals]);

  const deleteGoal = async (goalId: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', goalId)
        .eq('user_id', user.id);

      if (error) throw error;
      setGoals(prev => prev.filter(g => g.id !== goalId));
      return true;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erro ao excluir meta');
    }
  };

  return { goals, loading, error, refetchGoals: fetchGoals, deleteGoal };
}

export function useBudgets(month: Date) {
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
          p_month: monthDate
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
  }, [user, monthString]); // Dependency array is now stable

  useEffect(() => {
    if (!user) return;
    
    fetchBudgets();
    
    const channel = supabase
      .channel('budgets-transactions-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'budgets', filter: `user_id=eq.${user.id}` },
        () => fetchBudgets()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${user.id}` },
        () => fetchBudgets()
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };

  }, [user, fetchBudgets]); // fetchBudgets is now stable
  
  return { budgets, loading, error, refetchBudgets: fetchBudgets };
}

export function useFinancialStats() {
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
        
        const { data: accounts, error: accountsError } = await supabase
          .from('accounts')
          .select('saldo_atual')
          .eq('user_id', user.id)
          .eq('ativo', true);

        if (accountsError) throw accountsError;

        const totalBalance = accounts?.reduce((sum, acc) => sum + Number(acc.saldo_atual), 0) || 0;

        const { data: transactions, error: transactionsError } = await supabase
          .from('transactions')
          .select('valor, tipo')
          .eq('user_id', user.id)
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
        { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${user?.id}` },
        () => fetchStats()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'accounts', filter: `user_id=eq.${user?.id}` },
        () => fetchStats()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { stats, loading, error };
}

