import { useState, useEffect, useCallback } from 'react';
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
  const { user, session } = useAuth();

  const checkSubscription = useCallback(async (silent = false) => {
    // Only check if we have both user AND session
    if (!user || !session) {
      setSubscriptionInfo(null);
      setLoading(false);
      return;
    }

    try {
      if (!silent) {
        setLoading(true);
      }
      setError(null);

      const { data, error: functionError } = await supabase.functions.invoke('check-subscription');

      // Handle 401 gracefully - user might not have subscription
      if (functionError) {
        // Check if it's an auth error - don't throw, just set as not subscribed
        if (data?.error?.includes('Auth') || data?.error?.includes('session')) {
          console.log('[useSubscription] Auth error, treating as not subscribed');
          setSubscriptionInfo({ subscribed: false });
          return;
        }
        throw functionError;
      }

      console.log('[useSubscription] Response from check-subscription:', data);
      
      // Handle error response from function
      if (data?.error) {
        console.log('[useSubscription] Function returned error:', data.error);
        setSubscriptionInfo({ subscribed: false });
        return;
      }
      
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
  }, [user, session]);

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
    // Add small delay to ensure session is fully established
    const timer = setTimeout(() => {
      checkSubscription();
    }, 100);
    return () => clearTimeout(timer);
  }, [user, session, checkSubscription]);

  // Auto-refresh subscription status every 5 minutes (silently)
  useEffect(() => {
    if (!user || !session) return;
    
    const interval = setInterval(() => {
      checkSubscription(true);
    }, 300000);

    return () => clearInterval(interval);
  }, [user, session, checkSubscription]);

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