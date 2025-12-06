import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from './useSubscription';
import { startOfMonth } from 'date-fns';

export interface LimitsState {
    transactionLimit: number;
    transactionUsage: number;
    isTransactionLimitReached: boolean;
    aiLimit: number;
    aiUsage: number;
    isAiLimitReached: boolean;
    plan: 'gratuito' | 'premium' | 'familia' | 'familia_plus';
    isTrial: boolean;
    daysRemainingInTrial: number;
    loading: boolean;
}

export function useLimits() {
    const { user } = useAuth();
    const { subscriptionInfo, loading: subscriptionLoading, isPremium } = useSubscription();
    const [state, setState] = useState<LimitsState>({
        transactionLimit: 75,
        transactionUsage: 0,
        isTransactionLimitReached: false,
        aiLimit: 20,
        aiUsage: 0,
        isAiLimitReached: false,
        plan: 'gratuito',
        isTrial: false,
        daysRemainingInTrial: 0,
        loading: true
    });

    useEffect(() => {
        if (!user || subscriptionLoading) return;

        const fetchUsage = async () => {
            try {
                // Determine Plan based on subscription
                const plan = isPremium ? 'premium' : 'gratuito';

                // If Premium/Family, limits are effectively infinite
                if (isPremium) {
                    setState({
                        transactionLimit: -1,
                        transactionUsage: 0,
                        isTransactionLimitReached: false,
                        aiLimit: -1,
                        aiUsage: 0,
                        isAiLimitReached: false,
                        plan: 'premium',
                        isTrial: false,
                        daysRemainingInTrial: 0,
                        loading: false
                    });
                    return;
                }

                // Calculate Trial Status
                const createdAt = new Date(user.created_at);
                const now = new Date();
                const diffTime = Math.abs(now.getTime() - createdAt.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                const isTrial = diffDays <= 30;
                const daysRemainingInTrial = Math.max(0, 30 - diffDays);

                // Determine Transaction Limit
                const transactionLimit = isTrial ? 100 : 75;

                // Fetch Transaction Usage for Current Month
                const startOfMonthDate = startOfMonth(new Date()).toISOString();

                const { count, error } = await supabase
                    .from('transactions')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', user.id)
                    .is('group_id', null)
                    .gte('data_transacao', startOfMonthDate.split('T')[0]);

                if (error) throw error;

                const transactionUsage = count || 0;

                // AI Usage - placeholder
                const aiUsage = 0;
                const aiLimit = 20;

                setState({
                    transactionLimit,
                    transactionUsage,
                    isTransactionLimitReached: transactionUsage >= transactionLimit,
                    aiLimit,
                    aiUsage,
                    isAiLimitReached: aiUsage >= aiLimit,
                    plan,
                    isTrial,
                    daysRemainingInTrial,
                    loading: false
                });

            } catch (error) {
                console.error('Error fetching limits:', error);
                setState(prev => ({ ...prev, loading: false }));
            }
        };

        fetchUsage();
    }, [user, subscriptionInfo, subscriptionLoading, isPremium]);

    return state;
}
