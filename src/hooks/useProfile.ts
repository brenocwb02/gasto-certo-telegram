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
            const { error } = await supabase
                .from('profiles')
                .update({ onboarding_completed: completed })
                .eq('user_id', user.id);

            if (error) throw error;

            setProfile(prev => prev ? { ...prev, onboarding_completed: completed } : null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao atualizar onboarding');
        }
    };

    return { profile, loading, error, updateOnboardingCompleted };
}
