import { useState, useEffect, useCallback, useRef } from 'react';
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

  // Ref to track if we already have data to avoid flashing loading state on session refresh
  const hasDataRef = useRef(false);

  const checkSubscription = useCallback(async (silent = false) => {
    // Only check if we have both user AND session with access token
    if (!user || !session?.access_token) {
      console.log('[useSubscription] No user or session, skipping check');
      setSubscriptionInfo({ subscribed: false });
      setLoading(false);
      return;
    }

    try {
      if (!silent) {
        setLoading(true);
      }
      setError(null);

      console.log('[useSubscription] Calling check-subscription...');
      const { data, error: functionError } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      // Handle function errors (including 401 auth errors and non-2xx responses)
      if (functionError) {
        const errorString = String(functionError?.message || JSON.stringify(functionError) || '');
        console.log('[useSubscription] Function error:', errorString);
        
        // Any function error (including FunctionsHttpError for non-2xx) - treat as not subscribed
        // This is expected when auth session is not ready or missing
        console.log('[useSubscription] Function error detected, treating as not subscribed');
        setSubscriptionInfo({ subscribed: false });
        setLoading(false);
        return;
      }

      console.log('[useSubscription] Response from check-subscription:', data);

      // Handle error response in data body (e.g., { subscribed: false, error: "..." })
      if (data?.error) {
        console.log('[useSubscription] Function returned error in body:', data.error);
        // Still use the subscribed value from response if present
        setSubscriptionInfo({ subscribed: data?.subscribed === true });
        setLoading(false);
        return;
      }

      setSubscriptionInfo(data);
      hasDataRef.current = true;
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
      // If we already have data, perform a silent check (no loading screen)
      checkSubscription(hasDataRef.current);
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