
import { useState, useEffect, useCallback } from 'react';
import { syncAll, registerBackgroundSync } from '@/lib/sync';

type OfflineSyncSnapshot = {
    isSyncing: boolean;
    isOnline: boolean;
    lastSync: Date | null;
};

const store = {
    initialized: false,
    backgroundSyncRegistered: false,
    state: {
        isSyncing: false,
        isOnline: typeof navigator === 'undefined' ? true : navigator.onLine,
        lastSync: null as Date | null,
    },
    listeners: new Set<(snapshot: OfflineSyncSnapshot) => void>(),
    syncPromise: null as Promise<any> | null,
};

function notify() {
    const snapshot = { ...store.state };
    store.listeners.forEach((listener) => listener(snapshot));
}

function setStoreState(partial: Partial<OfflineSyncSnapshot>) {
    store.state = { ...store.state, ...partial };
    notify();
}

async function runSync() {
    if (!store.state.isOnline) {
        return { success: false, reason: 'offline' };
    }

    if (store.syncPromise) {
        return store.syncPromise;
    }

    setStoreState({ isSyncing: true });
    store.syncPromise = (async () => {
        try {
            const result = await syncAll();
            if (result.success && result.timestamp) {
                setStoreState({ lastSync: result.timestamp });
            }
            return result;
        } finally {
            store.syncPromise = null;
            setStoreState({ isSyncing: false });
        }
    })();

    return store.syncPromise;
}

function initializeStore() {
    if (store.initialized || typeof window === 'undefined') {
        return;
    }

    store.initialized = true;

    const handleOnline = () => {
        setStoreState({ isOnline: true });
        void runSync();
    };
    const handleOffline = () => setStoreState({ isOnline: false });

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (!store.backgroundSyncRegistered) {
        store.backgroundSyncRegistered = true;
        void registerBackgroundSync();
    }

    if (navigator.onLine) {
        void runSync();
    }
}

export function useOfflineSync() {
    const [snapshot, setSnapshot] = useState<OfflineSyncSnapshot>({ ...store.state });

    useEffect(() => {
        initializeStore();

        const listener = (nextSnapshot: OfflineSyncSnapshot) => setSnapshot(nextSnapshot);
        store.listeners.add(listener);
        setSnapshot({ ...store.state });

        return () => {
            store.listeners.delete(listener);
        };
    }, []);

    const sync = useCallback(() => runSync(), []);

    return {
        isSyncing: snapshot.isSyncing,
        lastSync: snapshot.lastSync,
        sync,
        isOnline: snapshot.isOnline,
    };
}
