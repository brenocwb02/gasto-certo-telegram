import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useFamily } from './useFamily';

export interface RecurringTransaction {
  id: string;
  user_id: string;
  group_id?: string;
  title: string;
  description?: string;
  amount: number;
  type: 'receita' | 'despesa';
  frequency: 'diaria' | 'semanal' | 'mensal' | 'trimestral' | 'semestral' | 'anual';
  day_of_month?: number;
  day_of_week?: number;
  start_date: string;
  end_date?: string;
  is_active: boolean;
  last_generated?: string;
  next_due_date: string;
  created_at: string;
  updated_at: string;
  category?: {
    id: string;
    nome: string;
    cor: string;
  };
  account?: {
    id: string;
    nome: string;
  };
  family_group?: {
    id: string;
    name: string;
  };
}

export interface RecurringGenerationLog {
  id: string;
  recurring_id: string;
  generated_date: string;
  transaction_id?: string;
  status: 'success' | 'failed' | 'skipped';
  error_message?: string;
  created_at: string;
}

export function useRecurringTransactions() {
  const { user } = useAuth();
  const { currentGroup } = useFamily();
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
  const [generationLogs, setGenerationLogs] = useState<RecurringGenerationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar transações recorrentes
  const loadRecurringTransactions = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('recurring_transactions')
        .select(`
          *,
          category:categories(id, nome, cor),
          account:accounts(id, nome),
          family_group:family_groups(id, name)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Se há grupo familiar selecionado, incluir transações do grupo
      if (currentGroup) {
        query = supabase
          .from('recurring_transactions')
          .select(`
            *,
            category:categories(id, nome, cor),
            account:accounts(id, nome),
            family_group:family_groups(id, name)
          `)
          .or(`user_id.eq.${user.id},group_id.eq.${currentGroup.id}`)
          .order('created_at', { ascending: false });
      }

      const { data, error } = await query;

      if (error) throw error;

      setRecurringTransactions(data || []);
    } catch (err) {
      console.error('Erro ao carregar transações recorrentes:', err);
      setError('Erro ao carregar transações recorrentes');
    } finally {
      setLoading(false);
    }
  };

  // Carregar logs de geração
  const loadGenerationLogs = async (recurringId?: string) => {
    if (!user) return;

    try {
      let query = supabase
        .from('recurring_generation_log')
        .select(`
          *,
          recurring_transaction:recurring_transactions!inner(
            user_id,
            group_id,
            title
          )
        `)
        .order('generated_date', { ascending: false })
        .limit(50);

      if (recurringId) {
        query = query.eq('recurring_id', recurringId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Filtrar apenas logs que o usuário tem acesso
      const filteredLogs = data?.filter(log => {
        const recurring = log.recurring_transaction;
        return recurring.user_id === user.id || 
               (recurring.group_id && currentGroup?.id === recurring.group_id);
      }) || [];

      setGenerationLogs(filteredLogs);
    } catch (err) {
      console.error('Erro ao carregar logs de geração:', err);
    }
  };

  // Criar transação recorrente
  const createRecurringTransaction = async (transactionData: {
    title: string;
    description?: string;
    amount: number;
    type: 'receita' | 'despesa';
    frequency: 'diaria' | 'semanal' | 'mensal' | 'trimestral' | 'semestral' | 'anual';
    start_date: string;
    end_date?: string;
    category_id?: string;
    account_id?: string;
    group_id?: string;
    day_of_month?: number;
    day_of_week?: number;
  }) => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      const { data, error } = await supabase.rpc('create_recurring_transaction', {
        p_title: transactionData.title,
        p_description: transactionData.description,
        p_amount: transactionData.amount,
        p_type: transactionData.type,
        p_frequency: transactionData.frequency,
        p_start_date: transactionData.start_date,
        p_end_date: transactionData.end_date,
        p_category_id: transactionData.category_id,
        p_account_id: transactionData.account_id,
        p_group_id: transactionData.group_id || currentGroup?.id,
        p_day_of_month: transactionData.day_of_month,
        p_day_of_week: transactionData.day_of_week
      });

      if (error) throw error;

      if (data.success) {
        await loadRecurringTransactions();
        return { success: true, message: data.message, recurring_id: data.recurring_id };
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      console.error('Erro ao criar transação recorrente:', err);
      throw err;
    }
  };

  // Pausar/reativar transação recorrente
  const toggleRecurringTransaction = async (recurringId: string, isActive: boolean) => {
    try {
      const { data, error } = await supabase.rpc('toggle_recurring_transaction', {
        p_recurring_id: recurringId,
        p_is_active: isActive
      });

      if (error) throw error;

      if (data.success) {
        await loadRecurringTransactions();
        return { success: true, message: data.message };
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      console.error('Erro ao alterar status da transação recorrente:', err);
      throw err;
    }
  };

  // Deletar transação recorrente
  const deleteRecurringTransaction = async (recurringId: string) => {
    try {
      const { error } = await supabase
        .from('recurring_transactions')
        .delete()
        .eq('id', recurringId);

      if (error) throw error;

      await loadRecurringTransactions();
    } catch (err) {
      console.error('Erro ao deletar transação recorrente:', err);
      throw err;
    }
  };

  // Gerar transações recorrentes manualmente
  const generateRecurringTransactions = async () => {
    try {
      const { data, error } = await supabase.rpc('generate_recurring_transactions');

      if (error) throw error;

      if (data.success) {
        await loadRecurringTransactions();
        await loadGenerationLogs();
        return { 
          success: true, 
          message: data.message,
          generated_count: data.generated_count,
          error_count: data.error_count
        };
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      console.error('Erro ao gerar transações recorrentes:', err);
      throw err;
    }
  };

  // Obter estatísticas das transações recorrentes
  const getRecurringStats = () => {
    const total = recurringTransactions.length;
    const active = recurringTransactions.filter(t => t.is_active).length;
    const paused = total - active;
    
    const totalAmount = recurringTransactions
      .filter(t => t.is_active)
      .reduce((sum, t) => sum + (t.type === 'receita' ? t.amount : -t.amount), 0);

    const nextDue = recurringTransactions
      .filter(t => t.is_active)
      .sort((a, b) => new Date(a.next_due_date).getTime() - new Date(b.next_due_date).getTime())[0];

    return {
      total,
      active,
      paused,
      totalAmount,
      nextDue
    };
  };

  // Obter frequência em português
  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case 'diaria': return 'Diária';
      case 'semanal': return 'Semanal';
      case 'mensal': return 'Mensal';
      case 'trimestral': return 'Trimestral';
      case 'semestral': return 'Semestral';
      case 'anual': return 'Anual';
      default: return frequency;
    }
  };

  // Obter dia da semana em português
  const getDayOfWeekLabel = (dayOfWeek: number) => {
    const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    return days[dayOfWeek] || '';
  };

  // Verificar se transação está próxima do vencimento
  const isDueSoon = (nextDueDate: string, days: number = 3) => {
    const dueDate = new Date(nextDueDate);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= days && diffDays >= 0;
  };

  // Verificar se transação está atrasada
  const isOverdue = (nextDueDate: string) => {
    const dueDate = new Date(nextDueDate);
    const today = new Date();
    return dueDate < today;
  };

  useEffect(() => {
    if (user) {
      loadRecurringTransactions();
      loadGenerationLogs();
    }
  }, [user, currentGroup]);

  return {
    recurringTransactions,
    generationLogs,
    loading,
    error,
    createRecurringTransaction,
    toggleRecurringTransaction,
    deleteRecurringTransaction,
    generateRecurringTransactions,
    loadRecurringTransactions,
    loadGenerationLogs,
    getRecurringStats,
    getFrequencyLabel,
    getDayOfWeekLabel,
    isDueSoon,
    isOverdue
  };
}
