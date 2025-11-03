import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Investment {
  id: string;
  user_id: string;
  ticker: string;
  asset_type: 'acao' | 'fii' | 'etf' | 'renda_fixa' | 'cripto';
  quantity: number | null;
  average_price: number | null;
  current_price: number | null;
  last_price_update: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvestmentTransaction {
  id: string;
  user_id: string;
  investment_id: string | null;
  ticker: string;
  transaction_type: string;
  quantity: number | null;
  price: number | null;
  total_value: number;
  transaction_date: string;
  notes: string | null;
  created_at: string;
}

export const useInvestments = () => {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [transactions, setTransactions] = useState<InvestmentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingPrices, setUpdatingPrices] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchInvestments = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('investments')
        .select('*')
        .order('ticker', { ascending: true });

      if (fetchError) throw fetchError;
      setInvestments(data || []);
    } catch (err: any) {
      setError(err.message);
      toast({
        title: 'Erro ao carregar investimentos',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('investment_transactions')
        .select('*')
        .order('transaction_date', { ascending: false });

      if (fetchError) throw fetchError;
      setTransactions(data || []);
    } catch (err: any) {
      toast({
        title: 'Erro ao carregar transações',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  const addTransaction = async (transaction: Omit<InvestmentTransaction, 'id' | 'user_id' | 'created_at'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error: insertError } = await supabase
        .from('investment_transactions')
        .insert([{ ...transaction, user_id: user.id }]);

      if (insertError) throw insertError;

      toast({
        title: 'Transação registrada',
        description: 'Operação de investimento registrada com sucesso!',
      });

      await fetchInvestments();
      await fetchTransactions();
    } catch (err: any) {
      toast({
        title: 'Erro ao registrar transação',
        description: err.message,
        variant: 'destructive',
      });
      throw err;
    }
  };

  const getTotalValue = () => {
    return investments.reduce((sum, inv) => {
      const price = inv.current_price || inv.average_price || 0;
      const quantity = inv.quantity || 0;
      return sum + (quantity * price);
    }, 0);
  };

  const getTotalProfit = () => {
    return investments.reduce((sum, inv) => {
      const quantity = inv.quantity || 0;
      const currentValue = quantity * (inv.current_price || inv.average_price || 0);
      const costBasis = quantity * (inv.average_price || 0);
      return sum + (currentValue - costBasis);
    }, 0);
  };

  const updateStockPrices = async () => {
    setUpdatingPrices(true);
    try {
      const { data, error: updateError } = await supabase.functions.invoke('update-stock-prices');
      
      if (updateError) throw updateError;
      
      toast({
        title: 'Preços atualizados',
        description: `${data?.updated || 0} ativos atualizados com sucesso!`,
      });
      
      await fetchInvestments();
    } catch (err: any) {
      toast({
        title: 'Erro ao atualizar preços',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setUpdatingPrices(false);
    }
  };

  useEffect(() => {
    fetchInvestments();
    fetchTransactions();

    // Realtime subscription
    const channel = supabase
      .channel('investments-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'investments' }, () => {
        fetchInvestments();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'investment_transactions' }, () => {
        fetchTransactions();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    investments,
    transactions,
    loading,
    updatingPrices,
    error,
    addTransaction,
    getTotalValue,
    getTotalProfit,
    updateStockPrices,
    refetch: () => {
      fetchInvestments();
      fetchTransactions();
    }
  };
};
