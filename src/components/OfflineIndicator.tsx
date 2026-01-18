
import React from 'react';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { WifiOff } from 'lucide-react';

const OfflineIndicator: React.FC = () => {
    const { isOnline } = useOfflineSync();

    if (isOnline) return null;

    return (
        <div className="bg-destructive text-destructive-foreground text-xs font-bold py-1 px-4 text-center sticky top-0 z-[60] flex items-center justify-center gap-2">
            <WifiOff className="h-3 w-3" />
            <span>Sem conexão com a internet. Modo offline ativado.</span>
        </div>
    );
};

export default OfflineIndicator;
