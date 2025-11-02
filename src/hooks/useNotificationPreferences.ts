import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface NotificationPreferences {
  id?: string;
  user_id: string;
  daily_summary: boolean;
  weekly_summary: boolean;
  monthly_summary: boolean;
  spending_alerts: boolean;
  goal_reminders: boolean;
  bill_reminders: boolean;
  budget_alerts: boolean;
  telegram_enabled: boolean;
  email_enabled: boolean;
  preferred_time: string;
  created_at?: string;
  updated_at?: string;
}

export function useNotificationPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPreferences = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (data) {
        setPreferences(data as NotificationPreferences);
      } else {
        // Create default preferences if none exist
        const defaultPrefs = {
          user_id: user.id,
          daily_summary: false,
          weekly_summary: true,
          monthly_summary: true,
          spending_alerts: true,
          goal_reminders: true,
          bill_reminders: true,
          budget_alerts: true,
          telegram_enabled: false,
          email_enabled: false,
          preferred_time: '09:00:00',
        };

        const { data: newData, error: insertError } = await supabase
          .from('notification_preferences')
          .insert([defaultPrefs])
          .select()
          .single();

        if (insertError) throw insertError;
        setPreferences(newData as NotificationPreferences);
      }
    } catch (err) {
      console.error('Error loading notification preferences:', err);
      setError('Erro ao carregar preferências de notificação');
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (updates: Partial<NotificationPreferences>) => {
    if (!user || !preferences) return;

    try {
      const { data, error: updateError } = await supabase
        .from('notification_preferences')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) throw updateError;
      setPreferences(data as NotificationPreferences);
      return { success: true };
    } catch (err) {
      console.error('Error updating notification preferences:', err);
      throw err;
    }
  };

  useEffect(() => {
    loadPreferences();
  }, [user]);

  return {
    preferences,
    loading,
    error,
    updatePreferences,
    loadPreferences,
  };
}
