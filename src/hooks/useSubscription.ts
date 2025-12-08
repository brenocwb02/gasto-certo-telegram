import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SubscriptionInfo {
  subscribed: boolean;
  product_id?: string;
  product_name?: string;
  subscription_end?: string;
}

export const useSubscription = () => {
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const checkSubscription = async (silent = false) => {
    if (!user) {
      setSubscriptionInfo(null);
      setLoading(false);
      return;
    }

    try {
      // Apenas mostra loading na primeira verificação, não nos refreshes silenciosos
      if (!silent) {
        setLoading(true);
      }
      setError(null);

      const { data, error: functionError } = await supabase.functions.invoke('check-subscription');

      if (functionError) {
        throw functionError;
      }

      console.log('[useSubscription] Response from check-subscription:', data);
      setSubscriptionInfo(data);
    } catch (err) {
      console.error('Error checking subscription:', err);
      setError(err instanceof Error ? err.message : 'Failed to check subscription');
      setSubscriptionInfo({ subscribed: false });
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

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
    checkSubscription();
  }, [user]);

  // Auto-refresh subscription status every 5 minutes (silently, without showing loading)
  useEffect(() => {
    const interval = setInterval(() => {
      if (user) {
        checkSubscription(true);  // silent=true para não mostrar loading
      }
    }, 300000);  // 5 minutos ao invés de 1 minuto

    return () => clearInterval(interval);
  }, [user]);

  // Consider any active subscription as premium (Pessoal or Família)
  const isPremium = subscriptionInfo?.subscribed === true;

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