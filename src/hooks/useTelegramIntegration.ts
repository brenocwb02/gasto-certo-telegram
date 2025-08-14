import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface TelegramBotConfig {
  id: string;
  bot_token: string;
  bot_username: string;
  webhook_url: string;
  is_active: boolean;
}

export function useTelegramIntegration() {
  const { user } = useAuth();
  const { toast } = useToast();
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
        .from('profiles')
        .select('telegram_bot_token, telegram_chat_id')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      
      if (data?.telegram_bot_token) {
        setConfig({
          id: user.id,
          bot_token: data.telegram_bot_token,
          bot_username: '',
          webhook_url: '',
          is_active: true
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar configuração');
    } finally {
      setLoading(false);
    }
  };

  const validateAndSaveBot = async (botToken: string) => {
    if (!user) return false;

    try {
      setLoading(true);
      setError(null);

      // Validate bot token
      const response = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
      const botInfo = await response.json();

      if (!botInfo.ok) {
        throw new Error('Token inválido. Verifique se o token está correto.');
      }

      // Save to profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          telegram_bot_token: botToken,
          telegram_chat_id: null // Reset chat_id when updating token
        })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Set up webhook using edge function
      const { error: webhookError } = await supabase.functions.invoke('telegram-bot-setup', {
        body: {
          bot_token: botToken,
          webhook_url: `https://dnpwlpxugkzomqczijwy.supabase.co/functions/v1/telegram-webhook/${user.id}`,
        },
      });

      if (webhookError) {
        console.warn('Webhook setup warning:', webhookError);
        // Don't fail completely, just warn
      }

      setConfig({
        id: user.id,
        bot_token: botToken,
        bot_username: botInfo.result.username,
        webhook_url: `https://dnpwlpxugkzomqczijwy.supabase.co/functions/v1/telegram-webhook/${user.id}`,
        is_active: true
      });

      toast({
        title: "Bot configurado com sucesso!",
        description: `Bot @${botInfo.result.username} está ativo. Envie /start para ele para começar.`,
      });

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao configurar bot';
      setError(errorMessage);
      toast({
        title: "Erro ao configurar bot",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const sendTestMessage = async () => {
    if (!config || !user) return false;

    try {
      const { error } = await supabase.functions.invoke('send-telegram-message', {
        body: {
          user_id: user.id,
          message: '🎉 Teste de integração com sucesso! Seu bot está funcionando perfeitamente.',
        },
      });

      if (error) throw error;

      toast({
        title: "Mensagem enviada!",
        description: "Verifique seu Telegram para ver a mensagem de teste.",
      });

      return true;
    } catch (err) {
      toast({
        title: "Erro ao enviar mensagem",
        description: "Certifique-se de que você já enviou /start para o bot.",
        variant: "destructive",
      });
      return false;
    }
  };

  const deactivateBot = async () => {
    if (!user) return false;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('profiles')
        .update({ 
          telegram_bot_token: null,
          telegram_chat_id: null
        })
        .eq('user_id', user.id);

      if (error) throw error;
      
      setConfig(null);
      toast({
        title: "Bot desativado",
        description: "A integração com Telegram foi removida.",
      });

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
    validateAndSaveBot,
    sendTestMessage,
    deactivateBot,
    refreshConfig: fetchBotConfig,
  };
}