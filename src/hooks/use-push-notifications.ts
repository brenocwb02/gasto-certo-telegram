import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export interface PushNotificationState {
    permission: NotificationPermission;
    isSupported: boolean;
}

export const usePushNotifications = () => {
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [isSupported, setIsSupported] = useState(false);

    useEffect(() => {
        // Verificar suporte
        if (!('Notification' in window)) {
            setIsSupported(false);
            return;
        }
        setIsSupported(true);
        setPermission(Notification.permission);
    }, []);

    const requestPermission = async () => {
        if (!isSupported) {
            toast.error('Notificações não suportadas neste dispositivo');
            return false;
        }

        try {
            const result = await Notification.requestPermission();
            setPermission(result);

            if (result === 'granted') {
                toast.success('Notificações ativadas! Teste agora.');
                return true;
            } else {
                toast.info('Permissão negada. Desbloqueie no ícone de "cadeado" do navegador.');
                return false;
            }
        } catch (error) {
            console.error('Error requesting permission:', error);
            return false;
        }
    };

    const sendLocalNotification = async (title: string, body: string) => {
        console.log('--- INICIO ENVIO NOTIFICACAO ---');

        // 1. Verificação de Contexto Seguro
        if (!window.isSecureContext) {
            toast.error('Erro de Segurança: Notificações exigem HTTPS ou Localhost.');
            return;
        }

        // 2. Verificação de Permissão
        if (Notification.permission !== 'granted') {
            toast.warning(`Permissão atual: ${Notification.permission}. RE-HABILITE no navegador.`);
            return;
        }

        try {
            // TENTATIVA 1: Via Service Worker (Padrão PWA)
            const registration = await navigator.serviceWorker.ready;

            if (registration && registration.active) {
                console.log('Modo: SERVICE WORKER (Background Capable)');
                await registration.showNotification(title, {
                    body: body,
                    icon: '/pwa-icon.svg',
                    vibrate: [200, 100, 200],
                    requireInteraction: true,
                    tag: 'gasto-certo-notification',
                    renotify: true,
                    data: {
                        dateOfArrival: Date.now()
                    }
                });
                toast.success('Notificação enviada via Service Worker!');
            } else {
                throw new Error('Service Worker não está pronto ou ativo.');
            }
        } catch (swError) {
            console.warn('Falha no SW, tentando API Nativa:', swError);

            // TENTATIVA 2: Fallback API Nativa (Foreground)
            try {
                console.log('Modo: FALLBACK NATIVE (Foreground)');
                const notification = new Notification(title, {
                    body: body,
                    icon: '/pwa-icon.svg',
                    requireInteraction: true,
                    silent: false
                });

                notification.onclick = () => {
                    window.focus();
                    notification.close();
                };

                toast.success('Notificação enviada via API Nativa!');
            } catch (nativeError) {
                console.error('ERRO CRÍTICO: Falha em ambos os métodos.', nativeError);
                toast.error('Não foi possível exibir a notificação.');
            }
        }
    };

    return {
        permission,
        isSupported,
        requestPermission,
        sendLocalNotification
    };
};
