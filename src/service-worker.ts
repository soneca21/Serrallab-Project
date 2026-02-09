/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope;

const SW_VERSION = 'v2';
const SHELL_CACHE = `shell-${SW_VERSION}`;
const ASSET_CACHE = `assets-${SW_VERSION}`;
const IMAGE_CACHE = `images-${SW_VERSION}`;
const API_CACHE = `api-read-${SW_VERSION}`;
const PUSH_PREFS_CACHE = `push-prefs-${SW_VERSION}`;
const PUSH_PREFS_KEY = '/__push_prefs__';
const CACHE_NAMES = [SHELL_CACHE, ASSET_CACHE, IMAGE_CACHE, API_CACHE, PUSH_PREFS_CACHE];
const APP_SHELL_URLS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/pwa-192x192.png',
    '/pwa-512x512.png',
    '/apple-touch-icon.png',
];

const MAX_ASSET_ENTRIES = 80;
const MAX_IMAGE_ENTRIES = 120;
const MAX_API_ENTRIES = 120;

function isMutationMethod(method: string) {
    return method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE';
}

function isStaticAsset(request: Request) {
    return (
        request.destination === 'style' ||
        request.destination === 'script' ||
        request.destination === 'worker' ||
        request.destination === 'font'
    );
}

function isImage(request: Request) {
    return request.destination === 'image';
}

function hasSensitiveAuthSignal(request: Request, url: URL) {
    const hasAuthHeader = request.headers.has('authorization');
    const authPath = url.pathname.includes('/auth/v1');
    const tokenRefreshPath = url.pathname.includes('/token');
    return hasAuthHeader || authPath || tokenRefreshPath;
}

function isSupabaseReadApi(request: Request, url: URL) {
    if (request.method !== 'GET') return false;
    if (!url.hostname.includes('supabase.co')) return false;

    const isRestRead = url.pathname.includes('/rest/v1/');
    const isStoragePublicRead = url.pathname.includes('/storage/v1/object/public/');
    return isRestRead || isStoragePublicRead;
}

async function putInCache(cacheName: string, request: Request, response: Response, maxEntries: number) {
    const cache = await caches.open(cacheName);
    await cache.put(request, response);
    const keys = await cache.keys();

    if (keys.length > maxEntries) {
        const overflow = keys.length - maxEntries;
        await Promise.all(keys.slice(0, overflow).map((key) => cache.delete(key)));
    }
}

async function networkFirstWithFallback(request: Request, cacheName: string, maxEntries: number) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            await putInCache(cacheName, request, response.clone(), maxEntries);
        }
        return response;
    } catch {
        const cached = await caches.match(request);
        if (cached) return cached;
        return new Response(null, { status: 504, statusText: 'Network Error' });
    }
}

async function staleWhileRevalidate(request: Request, cacheName: string, maxEntries: number) {
    const cached = await caches.match(request);
    const networkPromise = fetch(request)
        .then(async (response) => {
            if (response.ok) {
                await putInCache(cacheName, request, response.clone(), maxEntries);
            }
            return response;
        })
        .catch(() => cached);

    return cached || networkPromise;
}

async function cacheFirst(request: Request, cacheName: string, maxEntries: number) {
    const cached = await caches.match(request);
    if (cached) return cached;

    const response = await fetch(request);
    if (response.ok) {
        await putInCache(cacheName, request, response.clone(), maxEntries);
    }
    return response;
}

function normalizePushPayload(raw: any) {
    const base = raw?.data && typeof raw.data === 'object' ? { ...raw, ...raw.data } : (raw || {});
    return {
        title: base.title || 'Serrallab',
        body: base.body || 'Nova notificacao',
        event_type: base.event_type || base.eventType || null,
        level: base.level || base.type || null,
        route: base.route || base.url || '/app/notificacoes',
        icon: base.icon || '/pwa-192x192.png',
        badge: base.badge || '/pwa-192x192.png',
        data: base.data || {},
    };
}

function resolvePushPreferenceKey(eventType: string | null, level: string | null) {
    const eventMap: Record<string, string> = {
        message_new: 'push_new_message',
        lead_new: 'push_new_message',
        status_change: 'push_status_change',
        order_status_changed: 'push_status_change',
        pipeline_update: 'push_pipeline_updates',
        pipeline_stage_changed: 'push_pipeline_updates',
        schedule_reminder: 'push_schedule_reminders',
        schedule_failed: 'push_schedule_reminders',
    };
    const levelMap: Record<string, string> = {
        error: 'notify_errors',
        success: 'notify_success',
        warning: 'notify_warning',
        info: 'notify_info',
    };

    return {
        eventPreference: eventType ? eventMap[eventType.toLowerCase()] : null,
        levelPreference: level ? levelMap[level.toLowerCase()] : null,
    };
}

async function readStoredPushPreferences() {
    const cache = await caches.open(PUSH_PREFS_CACHE);
    const response = await cache.match(PUSH_PREFS_KEY);
    if (!response) return null;
    try {
        return await response.json();
    } catch {
        return null;
    }
}

async function writeStoredPushPreferences(preferences: Record<string, unknown>) {
    const cache = await caches.open(PUSH_PREFS_CACHE);
    await cache.put(
        PUSH_PREFS_KEY,
        new Response(JSON.stringify(preferences || {}), {
            headers: { 'content-type': 'application/json' },
        })
    );
}

async function shouldDisplayPush(payload: ReturnType<typeof normalizePushPayload>) {
    const preferences = await readStoredPushPreferences();
    if (!preferences) return true;

    const { eventPreference, levelPreference } = resolvePushPreferenceKey(payload.event_type, payload.level);
    if (eventPreference && preferences[eventPreference] === false) return false;
    if (levelPreference && preferences[levelPreference] === false) return false;
    return true;
}

self.addEventListener('install', (event) => {
    event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.addAll(APP_SHELL_URLS)).catch(() => undefined));
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => Promise.all(keys.filter((key) => !CACHE_NAMES.includes(key)).map((key) => caches.delete(key))))
    );
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    if (!url.protocol.startsWith('http')) {
        return;
    }

    if (isMutationMethod(request.method)) {
        return;
    }

    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then(async (response) => {
                    if (response.ok) {
                        const shellCache = await caches.open(SHELL_CACHE);
                        await shellCache.put('/index.html', response.clone());
                    }
                    return response;
                })
                .catch(async () => {
                    const fallback = await caches.match('/index.html');
                    return fallback || new Response('Offline', { status: 503, statusText: 'Offline' });
                })
        );
        return;
    }

    if (isStaticAsset(request)) {
        event.respondWith(staleWhileRevalidate(request, ASSET_CACHE, MAX_ASSET_ENTRIES));
        return;
    }

    if (isImage(request)) {
        event.respondWith(cacheFirst(request, IMAGE_CACHE, MAX_IMAGE_ENTRIES));
        return;
    }

    if (isSupabaseReadApi(request, url) && !hasSensitiveAuthSignal(request, url)) {
        event.respondWith(networkFirstWithFallback(request, API_CACHE, MAX_API_ENTRIES));
    }
});

self.addEventListener('push', (event) => {
    let raw: any = {};
    try {
        raw = event.data?.json() || {};
    } catch {
        raw = {};
    }
    const payload = normalizePushPayload(raw);

    event.waitUntil((async () => {
        const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
        clients.forEach((client) => {
            client.postMessage({
                type: 'PUSH_NOTIFICATION',
                payload,
            });
        });

        const allowed = await shouldDisplayPush(payload);
        if (!allowed) {
            return;
        }

        const hasFocusedClient = clients.some((client) => {
            const windowClient = client as WindowClient;
            return Boolean(windowClient.focused || windowClient.visibilityState === 'visible');
        });
        if (hasFocusedClient) {
            return;
        }

        await self.registration.showNotification(payload.title, {
            body: payload.body,
            icon: payload.icon,
            badge: payload.badge,
            tag: payload.event_type || payload.level || 'serrallab-push',
            data: {
                ...payload.data,
                route: payload.route,
                url: payload.route,
                event_type: payload.event_type,
                level: payload.level,
            },
        });
    })());
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil((async () => {
        const route = event.notification.data?.route || event.notification.data?.url || '/app/notificacoes';
        const normalizedRoute = route.startsWith('/') ? route : `/${route}`;
        const targetUrl = route.startsWith('http') ? route : `${self.location.origin}${normalizedRoute}`;
        const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });

        for (const client of clients) {
            const windowClient = client as WindowClient;
            if (windowClient.url.startsWith(self.location.origin)) {
                windowClient.postMessage({
                    type: 'PUSH_NAVIGATE',
                    route: normalizedRoute,
                });
                if ('navigate' in windowClient && windowClient.url !== targetUrl) {
                    try {
                        await windowClient.navigate(targetUrl);
                    } catch {
                        // Ignore and fallback to focus + app-side navigation.
                    }
                }
                await windowClient.focus();
                return;
            }
        }

        await self.clients.openWindow(targetUrl);
    })());
});

self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-data') {
        event.waitUntil(Promise.resolve());
    }
});

self.addEventListener('message', (event) => {
    if (event.data?.type === 'SKIP_WAITING') {
        event.waitUntil(self.skipWaiting());
        return;
    }

    if (event.data?.type === 'PUSH_PREFS_UPDATE') {
        event.waitUntil(writeStoredPushPreferences(event.data.preferences || {}));
    }
});
