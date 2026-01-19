
import { useState, useEffect } from 'react';
import { requestNotificationPermission, registerPushToken, sendNotification } from '@/lib/notifications';

export function usePushNotifications() {
    const [hasPermission, setHasPermission] = useState(false);

    useEffect(() => {
        if ('Notification' in window) {
            setHasPermission(Notification.permission === 'granted');
            if (Notification.permission === 'granted') {
                registerPushToken();
            }
        }

        // Listen for messages from service worker
        const handleMessage = (event: MessageEvent) => {
            if (event.data && event.data.type === 'PUSH_NOTIFICATION') {
                // Handle foreground notification logic if needed
                console.log('Push recebido em primeiro plano', event.data);
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
    }, []);

    const requestPermission = async () => {
        const permission = await requestNotificationPermission();
        if (permission === 'granted') {
            setHasPermission(true);
            await registerPushToken();
        }
        return permission;
    };

    return { hasPermission, requestPermission, sendNotification };
}
