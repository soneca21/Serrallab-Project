import { supabase } from '@/lib/customSupabaseClient';

export type PwaTelemetryEventName =
    | 'install_prompt_shown'
    | 'app_installed'
    | 'sync_success'
    | 'sync_error'
    | 'queue_size'
    | 'conflict_detected';

type TelemetryFields = Record<string, unknown>;

type TrackOptions = {
    dedupeSessionKey?: string;
};

let cachedActor: { userId: string; companyId: string | null } | null = null;

function getSessionStorageKey(key: string) {
    return `pwa-telemetry:${key}`;
}

function shouldSkipBySessionDedupe(dedupeSessionKey?: string) {
    if (!dedupeSessionKey || typeof window === 'undefined') return false;
    try {
        const storageKey = getSessionStorageKey(dedupeSessionKey);
        if (window.sessionStorage.getItem(storageKey) === '1') {
            return true;
        }
        window.sessionStorage.setItem(storageKey, '1');
    } catch {
        // Ignore storage errors and continue logging.
    }
    return false;
}

async function getActor() {
    if (cachedActor) return cachedActor;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profileData } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .maybeSingle();

    cachedActor = {
        userId: user.id,
        companyId: profileData?.company_id || null,
    };

    return cachedActor;
}

export async function trackPwaTelemetry(
    eventName: PwaTelemetryEventName,
    fields: TelemetryFields = {},
    options: TrackOptions = {}
) {
    if (shouldSkipBySessionDedupe(options.dedupeSessionKey)) {
        return;
    }

    try {
        const actor = await getActor();
        if (!actor) return;

        await supabase.from('audit_logs').insert({
            user_id: actor.userId,
            company_id: actor.companyId,
            entity: 'pwa_telemetry',
            entity_id: eventName,
            action: 'UPDATE',
            details: {
                event: eventName,
                source: 'pwa',
                occurred_at: new Date().toISOString(),
                ...fields,
            },
        });
    } catch (error) {
        console.warn('[pwa-telemetry] failed to register event', eventName, error);
    }
}
