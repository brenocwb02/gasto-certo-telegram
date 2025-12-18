import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/integrations/supabase/types';

type Category = Database['public']['Tables']['categories']['Row'];

export function useCategories(groupId?: string) {
    const { user } = useAuth();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchCategories = useCallback(async () => {
        if (!user) {
            setCategories([]);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            let query = supabase
                .from('categories')
                .select('*')
                .order('nome');

            if (groupId) {
                // Em um grupo, mostramos APENAS categorias do grupo para evitar duplicidade
                // e garantir que transações do grupo usem categorias do grupo.
                query = query.eq('group_id', groupId);
            } else {
                // Apenas categorias pessoais (sem grupo)
                query = query.eq('user_id', user.id).is('group_id', null);
            }

            const { data, error } = await query;

            if (error) throw error;
            setCategories(data || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao carregar categorias');
        } finally {
            setLoading(false);
        }
    }, [user, groupId]);

    useEffect(() => {
        if (!user) return;

        fetchCategories();

        // Configurar realtime subscription para atualizações automáticas
        // Para categorias pessoais (sem grupo), ouvimos todas as mudanças do usuário
        const channel = supabase
            .channel(`categories-changes-${groupId || 'personal'}-${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'categories',
                    // Removido filtro específico para capturar todas as mudanças do usuário
                },
                (payload) => {
                    // Verificar se a mudança é relevante para este usuário/grupo
                    const record = payload.new as any || payload.old as any;
                    if (record && record.user_id === user.id) {
                        fetchCategories();
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, groupId, fetchCategories]);

    return { categories, loading, error, refetchCategories: fetchCategories };
}
