import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useTransactions } from '@/hooks/useTransactions';

// Mock data
const mockTransactions = [
    { id: '1', descricao: 'Mercado', valor: 150, tipo: 'despesa', data_transacao: '2024-12-01' },
    { id: '2', descricao: 'Salário', valor: 5000, tipo: 'receita', data_transacao: '2024-12-01' },
];

describe('useTransactions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return empty array when no user', async () => {
        // Override auth mock for this test
        vi.mock('@/contexts/AuthContext', () => ({
            useAuth: vi.fn(() => ({
                user: null,
                profile: null,
                loading: false,
            })),
        }));

        const { supabase } = await import('@/integrations/supabase/client');

        const { result } = renderHook(() => useTransactions());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.transactions).toEqual([]);
    });

    it('should have correct return shape', async () => {
        const { result } = renderHook(() => useTransactions());

        expect(result.current).toHaveProperty('transactions');
        expect(result.current).toHaveProperty('loading');
        expect(result.current).toHaveProperty('error');
        expect(result.current).toHaveProperty('addTransaction');
        expect(result.current).toHaveProperty('updateTransaction');
        expect(result.current).toHaveProperty('deleteTransaction');
        expect(result.current).toHaveProperty('refetchTransactions');
    });

    it('should accept groupId parameter', () => {
        const { result } = renderHook(() => useTransactions('group-123'));
        expect(result.current).toBeDefined();
    });
});
