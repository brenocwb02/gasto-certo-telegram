/**
 * Re-exports de hooks individuais para manter compatibilidade
 * com imports existentes: import { useTransactions } from '@/hooks/useSupabaseData'
 * 
 * Cada hook agora está em seu próprio arquivo para melhor organização.
 */

export { useProfile } from './useProfile';
export { useTransactions } from './useTransactions';
export { useAccounts } from './useAccounts';
export { useCategories } from './useCategories';
export { useGoals } from './useGoals';
export { useBudgets } from './useBudgets';
export { useFinancialStats } from './useFinancialStats';
export { useFinancialProfile } from './useFinancialProfile';
