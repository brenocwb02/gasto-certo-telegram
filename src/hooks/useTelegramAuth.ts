
import { useEffect, useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from "@/components/ui/use-toast";

declare global {
    interface Window {
        Telegram?: {
            WebApp?: {
                initData: string;
                initDataUnsafe: any;
                ready: () => void;
                expand: () => void;
            }
        }
    }
}

export function useTelegramAuth() {
    const [isTelegram, setIsTelegram] = useState(false);
    const { session } = useAuth();
    const { toast } = useToast();

    useEffect(() => {
        // Check if running in Telegram
        const tg = window.Telegram?.WebApp;
        if (tg?.initData) {
            setIsTelegram(true);
            tg.ready();
            tg.expand();

            // If not logged in, attempt transparent login
            if (!session) {
                attemptTelegramLogin(tg.initData);
            }
        }
    }, [session]);

    // Apply CSS class to body when in Telegram mode
    useEffect(() => {
        if (isTelegram) {
            document.body.classList.add('tma-mode');
        } else {
            document.body.classList.remove('tma-mode');
        }

        return () => {
            document.body.classList.remove('tma-mode');
        };
    }, [isTelegram]);

    const attemptTelegramLogin = async (initData: string) => {
        try {
            console.log('🔄 Tentando login via Telegram...');

            const { data, error } = await supabase.functions.invoke('telegram-auth', {
                body: { initData }
            });

            if (error) throw error;
            if (!data?.token_hash) throw new Error('Token de login não recebido');

            console.log('✅ Token recebido. Autenticando com Supabase...');

            const { error: authError } = await supabase.auth.verifyOtp({
                token_hash: data.token_hash,
                type: 'email',
            });

            if (authError) throw authError;

            toast({
                title: "Bem-vindo de volta!",
                description: "Login automático via Telegram realizado com sucesso.",
            });

        } catch (error: any) {
            console.error('❌ Erro no login Telegram:', error);
            // Optional: Show error only if it's not a "user not found" scenario which might be common
            // toast({
            //   variant: "destructive",
            //   title: "Falha na autenticação automática",
            //   description: error.message
            // });
        }
    };

    return { isTelegram };
}
