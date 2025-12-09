import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/integrations/supabase/types';

type Goal = Database['public']['Tables']['goals']['Row'];

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
