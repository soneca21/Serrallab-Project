
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
}

const DB_NAME = 'serrallab-db';
const DB_VERSION = 1;

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
                    db.createObjectStore('pipeline', { keyPath: 'id' }); // Storing as a single object or list, using id for simplicity
                }
            },
        });
    }
    return dbPromise;
}

export async function saveLeadsOffline(leads: any[]) {
    const db = await getDB();
    const tx = db.transaction('leads', 'readwrite');
    await Promise.all([
        ...leads.map(lead => tx.store.put(lead)),
        tx.done
    ]);
}

export async function getLeadsOffline() {
    const db = await getDB();
    return db.getAll('leads');
}

export async function saveOrcamentosOffline(orcamentos: any[]) {
    const db = await getDB();
    const tx = db.transaction('orcamentos', 'readwrite');
    await Promise.all([
        ...orcamentos.map(orc => tx.store.put(orc)),
        tx.done
    ]);
}

export async function getOrcamentosOffline() {
    const db = await getDB();
    return db.getAll('orcamentos');
}

export async function savePipelineOffline(pipeline: any) {
    const db = await getDB();
    // Assuming pipeline is an object structure we want to cache entirely
    // We'll wrap it in an object with a fixed ID
    await db.put('pipeline', { id: 'main_pipeline', data: pipeline });
}

export async function getPipelineOffline() {
    const db = await getDB();
    const result = await db.get('pipeline', 'main_pipeline');
    return result?.data || null;
}

export async function clearOfflineData() {
    const db = await getDB();
    await db.clear('leads');
    await db.clear('orcamentos');
    await db.clear('pipeline');
}
