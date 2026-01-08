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
    plan: 'gratuito' | 'pessoal' | 'premium' | 'familia' | 'familia_plus' | 'individual';
    isTrial: boolean;
    daysRemainingInTrial: number;
    isTrialActive: boolean; // True if within 7-day trial period
    loading: boolean;
}

// Plan limits configuration
const PLAN_LIMITS = {
    free: {
        transactions: 30,
        aiCredits: 2,
        accounts: 1,
        categories: 5
    },
    trial: {
        transactions: -1, // Unlimited during trial
        aiCredits: -1,    // Unlimited during trial
        accounts: -1,
        categories: -1
    },
    paid: {
        transactions: -1, // Unlimited
        aiCredits: -1,    // Unlimited
        accounts: -1,
        categories: -1
    }
};

const TRIAL_DURATION_DAYS = 7;

export function useLimits() {
    const { user } = useAuth();
    const { subscriptionInfo, loading: subscriptionLoading, isPremium } = useSubscription();
    const [state, setState] = useState<LimitsState>({
        transactionLimit: PLAN_LIMITS.free.transactions,
        transactionUsage: 0,
        isTransactionLimitReached: false,
        aiLimit: PLAN_LIMITS.free.aiCredits,
        aiUsage: 0,
        isAiLimitReached: false,
        plan: 'gratuito',
        isTrial: false,
        daysRemainingInTrial: 0,
        isTrialActive: false,
        loading: true
    });

    useEffect(() => {
        if (!user || subscriptionLoading) return;

        const fetchUsage = async () => {
            try {
                // Calculate Trial Status (7 days)
                const createdAt = new Date(user.created_at);
                const now = new Date();
                const diffTime = now.getTime() - createdAt.getTime();
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                const isTrialActive = diffDays < TRIAL_DURATION_DAYS;
                const daysRemainingInTrial = Math.max(0, TRIAL_DURATION_DAYS - diffDays);

                // Check license table first (for manual/admin licenses)
                const { data: license } = await supabase
                    .from('licenses')
                    .select('plano, status')
                    .eq('user_id', user.id)
                    .eq('status', 'ativo')
                    .maybeSingle();

                const hasActiveLicense = license && license.plano !== 'gratuito';
                const licensePlan = license?.plano || 'gratuito';

                // Determine Plan based on license OR subscription
                let plan: LimitsState['plan'] = 'gratuito';
                let hasPaidAccess = isPremium || hasActiveLicense;

                if (hasPaidAccess) {
                    // Check specific plan from license first, then subscription
                    if (hasActiveLicense) {
                        plan = licensePlan as LimitsState['plan'];
                    } else if (isPremium) {
                        const productName = subscriptionInfo?.product_name?.toLowerCase() || '';
                        if (productName.includes('família') || productName.includes('familia')) {
                            plan = 'familia';
                        } else {
                            plan = 'pessoal';
                        }
                    }
                }

                // If has paid access (via License OR Stripe), limits are infinite
                if (hasPaidAccess) {
                    setState({
                        transactionLimit: -1,
                        transactionUsage: 0,
                        isTransactionLimitReached: false,
                        aiLimit: -1,
                        aiUsage: 0,
                        isAiLimitReached: false,
                        plan,
                        isTrial: false,
                        daysRemainingInTrial: 0,
                        isTrialActive: false,
                        loading: false
                    });
                    return;
                }

                // If in trial period, give full access
                if (isTrialActive) {
                    setState({
                        transactionLimit: -1, // Unlimited during trial
                        transactionUsage: 0,
                        isTransactionLimitReached: false,
                        aiLimit: -1, // Unlimited during trial
                        aiUsage: 0,
                        isAiLimitReached: false,
                        plan: 'gratuito',
                        isTrial: true,
                        daysRemainingInTrial,
                        isTrialActive: true,
                        loading: false
                    });
                    return;
                }

                // Free plan after trial - apply limits
                const transactionLimit = PLAN_LIMITS.free.transactions;
                const aiLimit = PLAN_LIMITS.free.aiCredits;

                // Fetch Transaction Usage for Current Month
                const startOfMonthDate = startOfMonth(new Date()).toISOString();

                const { count: transactionCount, error: txError } = await supabase
                    .from('transactions')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', user.id)
                    .is('group_id', null)
                    .gte('data_transacao', startOfMonthDate.split('T')[0]);

                if (txError) throw txError;

                const transactionUsage = transactionCount || 0;

                // AI Usage - using ai_usage_logs table
                let aiUsage = 0;
                try {
                    const { count: aiCount } = await supabase
                        .from('ai_usage_logs')
                        .select('*', { count: 'exact', head: true })
                        .eq('user_id', user.id)
                        .gte('created_at', startOfMonthDate);

                    aiUsage = aiCount || 0;
                } catch {
                    // Table might not exist yet, ignore
                    aiUsage = 0;
                }

                setState({
                    transactionLimit,
                    transactionUsage,
                    isTransactionLimitReached: transactionUsage >= transactionLimit,
                    aiLimit,
                    aiUsage,
                    isAiLimitReached: aiUsage >= aiLimit,
                    plan: 'gratuito',
                    isTrial: false,
                    daysRemainingInTrial: 0,
                    isTrialActive: false,
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

// Export limits config for use elsewhere
export { PLAN_LIMITS, TRIAL_DURATION_DAYS };
