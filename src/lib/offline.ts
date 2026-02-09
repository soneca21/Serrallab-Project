import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface SerrallabDB extends DBSchema {
    leads: {
        key: string;
        value: any;
    };
    orcamentos: {
        key: string;
        value: any;
    };
    pipeline: {
        key: string;
        value: any;
    };
    offline_mutation_queue: {
        key: string;
        value: any;
        indexes: {
            by_status: string;
            by_created_at: string;
            by_idempotency_key: string;
        };
    };
    offline_conflicts: {
        key: string;
        value: any;
        indexes: {
            by_created_at: string;
            by_mutation_type: string;
        };
    };
}

const DB_NAME = 'serrallab-db';
const DB_VERSION = 3;
const MAIN_PIPELINE_ID = 'main_pipeline';

let dbPromise: Promise<IDBPDatabase<SerrallabDB>> | null = null;

function getDB() {
    if (!dbPromise) {
        dbPromise = openDB<SerrallabDB>(DB_NAME, DB_VERSION, {
            upgrade(db) {
                if (!db.objectStoreNames.contains('leads')) {
                    db.createObjectStore('leads', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('orcamentos')) {
                    db.createObjectStore('orcamentos', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('pipeline')) {
                    db.createObjectStore('pipeline', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('offline_mutation_queue')) {
                    const queueStore = db.createObjectStore('offline_mutation_queue', { keyPath: 'id' });
                    queueStore.createIndex('by_status', 'status', { unique: false });
                    queueStore.createIndex('by_created_at', 'created_at', { unique: false });
                    queueStore.createIndex('by_idempotency_key', 'idempotency_key', { unique: true });
                }
                if (!db.objectStoreNames.contains('offline_conflicts')) {
                    const conflictsStore = db.createObjectStore('offline_conflicts', { keyPath: 'id' });
                    conflictsStore.createIndex('by_created_at', 'created_at', { unique: false });
                    conflictsStore.createIndex('by_mutation_type', 'mutation_type', { unique: false });
                }
            },
        });
    }
    return dbPromise;
}

async function replaceStoreItems(storeName: 'leads' | 'orcamentos', items: any[]) {
    const db = await getDB();
    const tx = db.transaction(storeName, 'readwrite');

    await tx.store.clear();
    for (const item of items || []) {
        await tx.store.put(item);
    }

    await tx.done;
}

function sortByCreatedAtDesc(items: any[]) {
    return [...(items || [])].sort((a, b) => {
        const timeA = new Date(a?.created_at || 0).getTime();
        const timeB = new Date(b?.created_at || 0).getTime();
        return timeB - timeA;
    });
}

export async function saveLeadsOffline(leads: any[]) {
    await replaceStoreItems('leads', leads || []);
}

export async function getLeadsOffline() {
    const db = await getDB();
    const data = await db.getAll('leads');
    return sortByCreatedAtDesc(data);
}

export async function saveOrcamentosOffline(orcamentos: any[]) {
    await replaceStoreItems('orcamentos', orcamentos || []);
}

export async function getOrcamentosOffline() {
    const db = await getDB();
    const data = await db.getAll('orcamentos');
    return sortByCreatedAtDesc(data);
}

export async function savePipelineOffline(pipeline: any) {
    const db = await getDB();
    await db.put('pipeline', {
        id: MAIN_PIPELINE_ID,
        data: pipeline || {},
        updated_at: new Date().toISOString(),
    });
}

export async function getPipelineOffline() {
    const db = await getDB();
    const result = await db.get('pipeline', MAIN_PIPELINE_ID);
    return result?.data || null;
}

export async function clearOfflineData() {
    const db = await getDB();
    await db.clear('leads');
    await db.clear('orcamentos');
    await db.clear('pipeline');
}
