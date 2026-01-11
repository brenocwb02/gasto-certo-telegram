
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

        console.log("🔍 [TMA Debug] Checking Telegram WebApp...", tg);

        if (tg) {
            if (tg.initData) {
                console.log("✅ [TMA Debug] initData found!", tg.initData.substring(0, 20) + "...");

                setIsTelegram(true);
                tg.ready();
                tg.expand();

                toast({
                    title: "🔄 Conectando com Telegram...",
                    description: "Aguarde enquanto validamos suas credenciais.",
                    duration: 3000,
                });

                // If not logged in, attempt transparent login
                if (!session) {
                    attemptTelegramLogin(tg.initData);
                } else {
                    console.log("ℹ️ [TMA Debug] Already logged in via session.");
                }
            } else {
                console.warn("⚠️ [TMA Debug] Telegram WebApp detected but initData is empty.");
                // Only toast if we are sure it's a TMA context (some browsers might expose window.Telegram?)
                // Usually safe to ignore if empty, but for debugging user issue:
                // toast({ title: "Debug", description: "Telegram detetado mas sem dados.", variant: "destructive" });
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
                title: "Login realizado! 🚀",
                description: "Bem-vindo de volta ao Boas Contas.",
                duration: 3000,
            });

        } catch (error: any) {
            console.error('❌ Erro no login Telegram:', error);

            let message = "Não foi possível fazer login automático.";
            if (error.message?.includes('User not linked')) {
                message = "Este Telegram não está vinculado a uma conta. Faça login com email para conectar.";
            }

            toast({
                variant: "destructive",
                title: "Atenção",
                description: message,
                duration: 5000,
            });
        }
    };

    return { isTelegram };
}
