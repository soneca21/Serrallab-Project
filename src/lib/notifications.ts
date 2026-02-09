import { supabase } from '@/lib/customSupabaseClient';

const DEFAULT_PUSH_PREFERENCES = {
    push_new_message: true,
    push_status_change: true,
    push_pipeline_updates: true,
    push_schedule_reminders: true,
    notify_errors: true,
    notify_success: true,
    notify_warning: true,
    notify_info: false,
};

const EVENT_TYPE_TO_PREFERENCE_KEY: Record<string, keyof typeof DEFAULT_PUSH_PREFERENCES> = {
    message_new: 'push_new_message',
    lead_new: 'push_new_message',
    status_change: 'push_status_change',
    order_status_changed: 'push_status_change',
    pipeline_update: 'push_pipeline_updates',
    pipeline_stage_changed: 'push_pipeline_updates',
    schedule_reminder: 'push_schedule_reminders',
    schedule_failed: 'push_schedule_reminders',
};

const LEVEL_TO_PREFERENCE_KEY: Record<string, keyof typeof DEFAULT_PUSH_PREFERENCES> = {
    error: 'notify_errors',
    success: 'notify_success',
    warning: 'notify_warning',
    info: 'notify_info',
};

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export function buildPushPreferenceSnapshot(rawPreferences?: Record<string, unknown>) {
    return {
        ...DEFAULT_PUSH_PREFERENCES,
        ...(rawPreferences || {}),
    };
}

export function isPushPayloadAllowed(payload: any, preferences?: Record<string, unknown>) {
    const prefs = buildPushPreferenceSnapshot(preferences);
    const eventType = String(payload?.event_type || payload?.eventType || '').toLowerCase();
    const level = String(payload?.type || payload?.level || '').toLowerCase();

    const eventPreferenceKey = EVENT_TYPE_TO_PREFERENCE_KEY[eventType];
    if (eventPreferenceKey && !prefs[eventPreferenceKey]) return false;

    const levelPreferenceKey = LEVEL_TO_PREFERENCE_KEY[level];
    if (levelPreferenceKey && !prefs[levelPreferenceKey]) return false;

    return true;
}

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
        const existingSubscription = await registration.pushManager.getSubscription();
        const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';
        const applicationServerKey = vapidKey ? urlBase64ToUint8Array(vapidKey) : undefined;

        const subscription = existingSubscription || await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey,
        });

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const token = JSON.stringify(subscription);

        await supabase.from('push_tokens').upsert({
            user_id: user.id,
            token,
            user_agent: navigator.userAgent,
        }, { onConflict: 'user_id, token' });

    } catch (error) {
        console.error('Falha ao registrar token de push:', error);
    }
}

export async function syncPushPreferencesToServiceWorker(preferences?: Record<string, unknown>) {
    if (!('serviceWorker' in navigator)) return;
    try {
        const registration = await navigator.serviceWorker.ready;
        registration.active?.postMessage({
            type: 'PUSH_PREFS_UPDATE',
            preferences: buildPushPreferenceSnapshot(preferences),
        });
    } catch (error) {
        console.error('Falha ao sincronizar preferências de push com SW:', error);
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
