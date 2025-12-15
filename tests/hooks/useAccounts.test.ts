import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAccounts } from '@/hooks/useAccounts';

describe('useAccounts', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should have correct return shape', async () => {
        const { result } = renderHook(() => useAccounts());

        expect(result.current).toHaveProperty('accounts');
        expect(result.current).toHaveProperty('loading');
        expect(result.current).toHaveProperty('error');
    });

    it('should accept groupId parameter', () => {
        const { result } = renderHook(() => useAccounts('group-123'));
        expect(result.current).toBeDefined();
    });

    it('should return accounts array', () => {
        const { result } = renderHook(() => useAccounts());
        expect(Array.isArray(result.current.accounts)).toBe(true);
    });
});
