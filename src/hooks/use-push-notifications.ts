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

        if (permission === 'granted' && isSupported) {
            try {
                // FORÇANDO API NATIVA (Ignorando SW quebrado do screenshot)
                console.log('Modo: FORCED NATIVE (Ignorando Service Worker)');

                const notification = new Notification(title, {
                    body: body,
                    // icon: '/pwa-icon.svg', // Comentado para evitar erro 404 quebrando o fluxo
                    requireInteraction: true,
                    silent: false
                });

                notification.onshow = () => {
                    console.log('Evento onshow disparado!');
                    toast.success('Evento de notificação disparado pelo navegador!');
                };

                notification.onclick = () => {
                    console.log('Notificação clicada');
                    window.focus();
                    notification.close();
                };

                notification.onerror = (e) => {
                    console.error('ERRO CRÍTICO no evento onerror:', e);
                    toast.error('Navegador reportou erro ao exibir. Verifique "Não Perturbe".');
                };

            } catch (error) {
                console.error('Exception no envio:', error);
                toast.error('Exception: ' + (error as Error).message);
            }
        } else {
            toast.warning('Estado interno inconsistente (hook permission != granted).');
        }
    };

    return {
        permission,
        isSupported,
        requestPermission,
        sendLocalNotification
    };
};
