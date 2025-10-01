import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface TelegramBotConfig {
  id: string;
  bot_token: string;
  bot_username: string | null;
  webhook_url: string | null;
  is_active: boolean;
}

export function useTelegramBot() {
  const { user } = useAuth();
  const [config, setConfig] = useState<TelegramBotConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setConfig(null);
      setLoading(false);
      return;
    }

    fetchBotConfig();
  }, [user]);

  const fetchBotConfig = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('telegram_bot_configs')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setConfig(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar configuração');
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async (botToken: string, botUsername: string) => {
    if (!user) return false;

    try {
      setLoading(true);
      setError(null);

      // Configurar webhook
      const webhookUrl = `https://dnpwlpxugkzomqczijwy.supabase.co/functions/v1/telegram-webhook`;
      
      const configData = {
        user_id: user.id,
        bot_token: botToken,
        bot_username: botUsername,
        webhook_url: webhookUrl,
        is_active: true,
      };

      if (config) {
        // Update
        const { error } = await supabase
          .from('telegram_bot_configs')
          .update(configData)
          .eq('id', config.id);

        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from('telegram_bot_configs')
          .insert([configData]);

        if (error) throw error;
      }

      // Chamar função para configurar webhook
      const { error: webhookError } = await supabase.functions.invoke('telegram-bot-setup', {
        body: {
          bot_token: botToken,
          webhook_url: webhookUrl,
        },
      });

      if (webhookError) {
        console.error('Erro ao configurar webhook:', webhookError);
        // Não falhar por causa do webhook, apenas logar
      }

      await fetchBotConfig();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar configuração');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deactivateBot = async () => {
    if (!config || !user) return false;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('telegram_bot_configs')
        .update({ is_active: false })
        .eq('id', config.id);

      if (error) throw error;
      
      await fetchBotConfig();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao desativar bot');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    config,
    loading,
    error,
    saveConfig,
    deactivateBot,
    refreshConfig: fetchBotConfig,
  };
}