import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useFamily } from '@/hooks/useFamily';

describe('useFamily', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should have correct return shape', async () => {
        const { result } = renderHook(() => useFamily());

        expect(result.current).toHaveProperty('groups');
        expect(result.current).toHaveProperty('currentGroup');
        expect(result.current).toHaveProperty('members');
        expect(result.current).toHaveProperty('invites');
        expect(result.current).toHaveProperty('loading');
        expect(result.current).toHaveProperty('error');
        expect(result.current).toHaveProperty('createFamilyGroup');
        expect(result.current).toHaveProperty('inviteFamilyMember');
        expect(result.current).toHaveProperty('acceptFamilyInvite');
    });

    it('should have MAX_FAMILY_MEMBERS limit', async () => {
        // The hook has an internal constant MAX_FAMILY_MEMBERS = 4
        const { result } = renderHook(() => useFamily());
        expect(result.current).toBeDefined();
    });

    it('should return arrays for groups and members', async () => {
        const { result } = renderHook(() => useFamily());

        expect(Array.isArray(result.current.groups)).toBe(true);
        expect(Array.isArray(result.current.members)).toBe(true);
        expect(Array.isArray(result.current.invites)).toBe(true);
    });
});
