
import { supabase } from '@/lib/customSupabaseClient';

export async function requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
        console.log('Este navegador não oferece suporte a notificações na área de trabalho');
        return 'denied';
    }
    return await Notification.requestPermission();
}

export async function registerPushToken() {
    if (!('serviceWorker' in navigator)) return;

    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nkx8Wk' // VAPID Public Key - replace with env var in prod
        });

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const token = JSON.stringify(subscription);

        await supabase.from('push_tokens').upsert({
            user_id: user.id,
            token: token,
            user_agent: navigator.userAgent
        }, { onConflict: 'user_id, token' });

    } catch (error) {
        console.error('Falha ao registrar token de push:', error);
    }
}

export function sendNotification(title: string, options?: NotificationOptions) {
    if (Notification.permission === 'granted') {
        navigator.serviceWorker.ready.then(registration => {
            registration.showNotification(title, options);
        });
    }
}

export function handlePushMessage(event: any) {
    if (event.data) {
        const { title, ...options } = event.data.json();
        sendNotification(title, options);
    }
}
