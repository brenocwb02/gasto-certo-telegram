import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];

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
            // Atualizar status do onboarding
            const { error } = await supabase
                .from('profiles')
                .update({ onboarding_completed: completed })
                .eq('user_id', user.id);

            if (error) throw error;

            // Se completou o onboarding, criar categorias padrão
            if (completed) {
                // Chamada à função que será criada na migração
                const { data: seedResult, error: seedError } = await (supabase as any)
                    .rpc('seed_default_categories', { p_user_id: user.id });

                if (seedError) {
                    console.warn('Aviso: Não foi possível criar categorias padrão:', seedError.message);
                    // Não bloqueia o fluxo - categorias podem ser criadas depois
                } else if (seedResult) {
                    console.log('Categorias padrão criadas:', seedResult);
                }
            }

            setProfile(prev => prev ? { ...prev, onboarding_completed: completed } : null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao atualizar onboarding');
        }
    };

    return { profile, loading, error, updateOnboardingCompleted };
}
