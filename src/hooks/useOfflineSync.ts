
import { useState, useEffect, useCallback } from 'react';
import { syncAll, registerBackgroundSync } from '@/lib/sync';
import { usePWA } from './usePWA';

export function useOfflineSync() {
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSync, setLastSync] = useState<Date | null>(null);
    const { isOnline } = usePWA();

    const sync = useCallback(async () => {
        if (!isOnline) return;
        setIsSyncing(true);
        try {
            const result = await syncAll();
            if (result.success && result.timestamp) {
                setLastSync(result.timestamp);
            }
        } finally {
            setIsSyncing(false);
        }
    }, [isOnline]);

    useEffect(() => {
        // Initial sync on mount
        sync();
        registerBackgroundSync();

        // Sync when coming back online
        const handleOnline = () => sync();
        window.addEventListener('online', handleOnline);

        return () => window.removeEventListener('online', handleOnline);
    }, [sync]);

    return { isSyncing, lastSync, sync, isOnline };
}
