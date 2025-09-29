import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SubscriptionInfo {
  subscribed: boolean;
  product_id?: string;
  subscription_end?: string;
}

export const useSubscription = () => {
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, session } = useAuth(); // Usar a sessão para revalidar

  const checkSubscription = useCallback(async () => {
    if (!user) {
      setSubscriptionInfo(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const { data, error: functionError } = await supabase.functions.invoke('check-subscription');
      
      if (functionError) {
        throw functionError;
      }

      setSubscriptionInfo(data);
    } catch (err) {
      console.error('Error checking subscription:', err);
      setError(err instanceof Error ? err.message : 'Failed to check subscription');
      setSubscriptionInfo({ subscribed: false });
    } finally {
      setLoading(false);
    }
  }, [user]); // Manter user como dependência primária

  const createCheckout = async () => {
    if (!user) {
      throw new Error('User must be authenticated to create checkout');
    }

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout');
      
      if (error) {
        throw error;
      }

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (err) {
      console.error('Error creating checkout:', err);
      throw err;
    }
  };

  const openCustomerPortal = async () => {
    if (!user) {
      throw new Error('User must be authenticated to access customer portal');
    }

    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) {
        throw error;
      }

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (err) {
      console.error('Error opening customer portal:', err);
      throw err;
    }
  };

  useEffect(() => {
    // Re-executa a verificação sempre que a sessão do usuário mudar
    if (session) {
      checkSubscription();
    }
  }, [session, checkSubscription]);

  const isPremium = subscriptionInfo?.subscribed && subscriptionInfo?.product_id === 'prod_T85pcP4M0yhBaG';

  return {
    subscriptionInfo,
    loading,
    error,
    isPremium,
    checkSubscription,
    createCheckout,
    openCustomerPortal,
  };
};
