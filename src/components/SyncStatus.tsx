
import React from 'react';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { RefreshCw, WifiOff, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const SyncStatus: React.FC = () => {
    const { isSyncing, lastSync, isOnline } = useOfflineSync();

    if (!isOnline) {
        return (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <WifiOff className="h-3 w-3" />
                <span>Offline</span>
            </div>
        );
    }

    if (isSyncing) {
        return (
            <div className="flex items-center gap-2 text-xs text-primary">
                <RefreshCw className="h-3 w-3 animate-spin" />
                <span>Sincronizando...</span>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2 text-xs text-green-500">
            <CheckCircle className="h-3 w-3" />
            <span>
                {lastSync 
                    ? `Atualizado às ${format(lastSync, 'HH:mm', { locale: ptBR })}` 
                    : 'Sincronizado'}
            </span>
        </div>
    );
};

export default SyncStatus;
