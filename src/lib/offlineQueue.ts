import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type {
    EnqueueOfflineMutationInput,
    OfflineMutationQueueItem,
    OfflineMutationStatus,
} from '@/types/pwa';

interface SerrallabQueueDB extends DBSchema {
    offline_mutation_queue: {
        key: string;
        value: OfflineMutationQueueItem;
        indexes: {
            by_status: OfflineMutationStatus;
            by_created_at: string;
            by_idempotency_key: string;
        };
    };
}

const DB_NAME = 'serrallab-db';
const DB_VERSION = 3;
const STORE_NAME = 'offline_mutation_queue';

let dbPromise: Promise<IDBPDatabase<SerrallabQueueDB>> | null = null;

function generateQueueItemId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function getDB() {
    if (!dbPromise) {
        dbPromise = openDB<SerrallabQueueDB>(DB_NAME, DB_VERSION, {
            upgrade(db) {
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    const queueStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                    queueStore.createIndex('by_status', 'status', { unique: false });
                    queueStore.createIndex('by_created_at', 'created_at', { unique: false });
                    queueStore.createIndex('by_idempotency_key', 'idempotency_key', { unique: true });
                    return;
                }

                const queueStore = db.transaction.objectStore(STORE_NAME);
                if (!queueStore.indexNames.contains('by_status')) {
                    queueStore.createIndex('by_status', 'status', { unique: false });
                }
                if (!queueStore.indexNames.contains('by_created_at')) {
                    queueStore.createIndex('by_created_at', 'created_at', { unique: false });
                }
                if (!queueStore.indexNames.contains('by_idempotency_key')) {
                    queueStore.createIndex('by_idempotency_key', 'idempotency_key', { unique: true });
                }
            },
        });
    }

    return dbPromise;
}

export async function enqueueOfflineMutation(input: EnqueueOfflineMutationInput) {
    const db = await getDB();
    const now = new Date().toISOString();

    const existing = await db.getFromIndex(STORE_NAME, 'by_idempotency_key', input.idempotency_key);
    if (existing) {
        return existing;
    }

    const item: OfflineMutationQueueItem = {
        id: generateQueueItemId(),
        created_at: now,
        updated_at: now,
        idempotency_key: input.idempotency_key,
        mutation_type: input.mutation_type,
        entity: input.entity,
        payload: input.payload,
        retry_count: input.retry_count ?? 0,
        last_error: input.last_error ?? null,
        status: input.status ?? 'pending',
        failure_type: input.failure_type ?? null,
    };

    await db.put(STORE_NAME, item);
    return item;
}

export async function listOfflineMutations(options?: {
    status?: OfflineMutationStatus;
    limit?: number;
}) {
    const db = await getDB();
    const { status, limit } = options || {};

    let items: OfflineMutationQueueItem[] = [];
    if (status) {
        items = await db.getAllFromIndex(STORE_NAME, 'by_status', status);
    } else {
        items = await db.getAll(STORE_NAME);
    }

    items.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    if (typeof limit === 'number') {
        return items.slice(0, Math.max(0, limit));
    }
    return items;
}

export async function updateOfflineMutationStatus(
    id: string,
    status: OfflineMutationStatus,
    params?: {
        retry_count?: number;
        last_error?: string | null;
        failure_type?: 'temporary' | 'permanent' | null;
    }
) {
    const db = await getDB();
    const current = await db.get(STORE_NAME, id);
    if (!current) return null;

    const next: OfflineMutationQueueItem = {
        ...current,
        status,
        updated_at: new Date().toISOString(),
        retry_count: params?.retry_count ?? current.retry_count,
        last_error: params?.last_error ?? current.last_error,
        failure_type: params?.failure_type ?? current.failure_type ?? null,
    };

    await db.put(STORE_NAME, next);
    return next;
}

export async function incrementOfflineMutationRetry(id: string, errorMessage?: string) {
    const db = await getDB();
    const current = await db.get(STORE_NAME, id);
    if (!current) return null;

    const nextRetryCount = (current.retry_count || 0) + 1;
    return updateOfflineMutationStatus(id, 'failed', {
        retry_count: nextRetryCount,
        last_error: errorMessage ?? current.last_error ?? null,
        failure_type: 'temporary',
    });
}

export async function removeOfflineMutation(id: string) {
    const db = await getDB();
    await db.delete(STORE_NAME, id);
}

export async function requeueOfflineMutation(id: string) {
    return updateOfflineMutationStatus(id, 'pending', {
        last_error: null,
        failure_type: null,
    });
}

export async function clearProcessedOfflineMutations() {
    const db = await getDB();
    const processed = await db.getAllFromIndex(STORE_NAME, 'by_status', 'processed');
    await Promise.all(processed.map((item) => db.delete(STORE_NAME, item.id)));
    return processed.length;
}

export async function countOfflineMutations(status?: OfflineMutationStatus) {
    const db = await getDB();
    if (!status) {
        return db.count(STORE_NAME);
    }
    return db.countFromIndex(STORE_NAME, 'by_status', status);
}
