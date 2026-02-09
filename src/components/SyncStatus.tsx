import React from 'react';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { SystemStatusInline } from '@/components/SystemStatus';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

const SyncStatus: React.FC = () => {
    const { isSyncing, lastSync, isOnline } = useOfflineSync();
    const prefersReducedMotion = useReducedMotion();
    const statusKey = !isOnline ? 'offline' : isSyncing ? 'syncing' : 'synced';
    const label = !isOnline
        ? 'Offline'
        : isSyncing
            ? 'Sincronizando...'
            : (lastSync ? `Atualizado as ${format(lastSync, 'HH:mm', { locale: ptBR })}` : 'Sincronizado');

    return (
        <AnimatePresence mode="wait" initial={false}>
            <motion.div
                key={`${statusKey}-${label}`}
                initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 4 }}
                animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -3 }}
                transition={{ duration: prefersReducedMotion ? 0.05 : 0.16, ease: 'easeOut' }}
            >
                <SystemStatusInline status={statusKey as 'offline' | 'syncing' | 'synced'} label={label} />
            </motion.div>
        </AnimatePresence>
    );
};

export default SyncStatus;
