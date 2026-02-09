import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { v4 as uuidv4 } from 'uuid';
import type { OfflineConflictLogItem } from '@/types/pwa';
import { trackPwaTelemetry } from '@/lib/pwaTelemetry';

interface SerrallabConflictDB extends DBSchema {
    offline_conflicts: {
        key: string;
        value: OfflineConflictLogItem;
        indexes: {
            by_created_at: string;
            by_mutation_type: string;
        };
    };
}

const DB_NAME = 'serrallab-db';
const DB_VERSION = 3;
const STORE_NAME = 'offline_conflicts';

let dbPromise: Promise<IDBPDatabase<SerrallabConflictDB>> | null = null;

async function getDB() {
    if (!dbPromise) {
        dbPromise = openDB<SerrallabConflictDB>(DB_NAME, DB_VERSION, {
            upgrade(db) {
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                    store.createIndex('by_created_at', 'created_at', { unique: false });
                    store.createIndex('by_mutation_type', 'mutation_type', { unique: false });
                    return;
                }

                const store = db.transaction.objectStore(STORE_NAME);
                if (!store.indexNames.contains('by_created_at')) {
                    store.createIndex('by_created_at', 'created_at', { unique: false });
                }
                if (!store.indexNames.contains('by_mutation_type')) {
                    store.createIndex('by_mutation_type', 'mutation_type', { unique: false });
                }
            },
        });
    }

    return dbPromise;
}

export async function logOfflineConflict(
    input: Omit<OfflineConflictLogItem, 'id' | 'created_at' | 'resolution'> & { note?: string | null }
) {
    const db = await getDB();
    const item: OfflineConflictLogItem = {
        id: uuidv4(),
        created_at: new Date().toISOString(),
        mutation_type: input.mutation_type,
        entity: input.entity,
        idempotency_key: input.idempotency_key,
        local_snapshot: input.local_snapshot,
        remote_snapshot: input.remote_snapshot,
        resolution: 'last_write_wins',
        note: input.note ?? null,
    };

    await db.put(STORE_NAME, item);
    void trackPwaTelemetry('conflict_detected', {
        mutation_type: item.mutation_type,
        entity: item.entity,
        idempotency_key: item.idempotency_key,
        resolution: item.resolution,
    });
    return item;
}

export async function listOfflineConflicts(limit = 50) {
    const db = await getDB();
    const items = await db.getAll(STORE_NAME);
    items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return items.slice(0, Math.max(0, limit));
}
