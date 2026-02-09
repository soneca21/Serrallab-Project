import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import {
    requestNotificationPermission,
    registerPushToken,
    sendNotification,
    isPushPayloadAllowed,
    syncPushPreferencesToServiceWorker,
} from '@/lib/notifications';

export function usePushNotifications() {
    const { profile } = useAuth();
    const navigate = useNavigate();
    const [hasPermission, setHasPermission] = useState(false);

    useEffect(() => {
        if ('Notification' in window) {
            setHasPermission(Notification.permission === 'granted');
            if (Notification.permission === 'granted') {
                void registerPushToken();
            }
        }

        void syncPushPreferencesToServiceWorker(profile?.preferences || {});

        const handleMessage = (event: MessageEvent) => {
            if (event.data?.type === 'PUSH_NAVIGATE') {
                const route = typeof event.data?.route === 'string' ? event.data.route : '/app/notificacoes';
                navigate(route.startsWith('/') ? route : `/${route}`);
                return;
            }

            const payload = event.data?.payload;
            if (!payload) return;

            if (!isPushPayloadAllowed(payload, profile?.preferences || {})) {
                return;
            }

            if (event.data?.type === 'PUSH_NOTIFICATION' && document.visibilityState === 'visible') {
                // Foreground hint for debugging and optional UI wiring.
                console.info('[push][foreground]', {
                    title: payload?.title,
                    event_type: payload?.event_type,
                    route: payload?.route || payload?.url,
                });
            }
        };

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', handleMessage);
        }

        return () => {
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.removeEventListener('message', handleMessage);
            }
        };
    }, [navigate, profile?.preferences]);

    const requestPermission = async () => {
        const permission = await requestNotificationPermission();
        if (permission === 'granted') {
            setHasPermission(true);
            await registerPushToken();
            await syncPushPreferencesToServiceWorker(profile?.preferences || {});
        }
        return permission;
    };

    return { hasPermission, requestPermission, sendNotification };
}
