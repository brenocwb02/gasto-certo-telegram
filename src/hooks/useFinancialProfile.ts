import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Hook para gerenciar perfil financeiro (quiz de saúde financeira)
export function useFinancialProfile() {
    const { user } = useAuth();
    const [financialProfile, setFinancialProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user) {
            setFinancialProfile(null);
            setLoading(false);
            return;
        }

        const fetchFinancialProfile = async () => {
            try {
                const { data, error } = await (supabase as any)
                    .from('financial_profile')
                    .select('*')
                    .eq('user_id', user.id)
                    .maybeSingle();

                if (error) throw error;
                setFinancialProfile(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Erro ao carregar perfil financeiro');
            } finally {
                setLoading(false);
            }
        };

        fetchFinancialProfile();
    }, [user]);

    const submitFinancialProfile = async (answers: {
        emergency_fund: string;
        debt_situation: string;
        savings_rate: string;
        investment_knowledge: string;
        financial_goals: string;
        budget_control: string;
        insurance_coverage: string;
        retirement_planning: string;
    }) => {
        if (!user) return;

        try {
            setLoading(true);

            // Usar upsert para criar ou atualizar o perfil
            const { data, error } = await (supabase as any)
                .from('financial_profile')
                .upsert({
                    user_id: user.id,
                    ...answers,
                    completed_at: new Date().toISOString()
                })
                .select()
                .single();

            if (error) throw error;

            setFinancialProfile(data);
            setError(null);
            return data;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Erro ao salvar perfil financeiro';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const getFinancialHealthLevel = (score: number) => {
        if (score >= 80) return { level: 'Excelente', color: 'text-green-600', bgColor: 'bg-green-100' };
        if (score >= 60) return { level: 'Bom', color: 'text-blue-600', bgColor: 'bg-blue-100' };
        if (score >= 40) return { level: 'Regular', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
        if (score >= 20) return { level: 'Precisa Melhorar', color: 'text-orange-600', bgColor: 'bg-orange-100' };
        return { level: 'Crítico', color: 'text-red-600', bgColor: 'bg-red-100' };
    };

    const getRecommendations = () => {
        if (!financialProfile?.recommendations) return [];

        try {
            return Array.isArray(financialProfile.recommendations)
                ? financialProfile.recommendations
                : JSON.parse(financialProfile.recommendations as string);
        } catch {
            return [];
        }
    };

    return {
        financialProfile,
        loading,
        error,
        submitFinancialProfile,
        getFinancialHealthLevel,
        getRecommendations,
        hasCompletedQuiz: !!financialProfile
    };
}
