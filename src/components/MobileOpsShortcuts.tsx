import React, { useCallback, useEffect, useState } from 'react';
import { RefreshCcw, ListChecks } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { countOfflineMutations } from '@/lib/offlineQueue';
import { useToast } from '@/components/ui/use-toast';

const MobileOpsShortcuts: React.FC = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { sync, isSyncing, isOnline } = useOfflineSync();
    const [queueSize, setQueueSize] = useState(0);

    const loadQueueSize = useCallback(async () => {
        try {
            const total = await countOfflineMutations();
            setQueueSize(total || 0);
        } catch {
            setQueueSize(0);
        }
    }, []);

    useEffect(() => {
        void loadQueueSize();
    }, [loadQueueSize, isSyncing, isOnline]);

    const handleSyncNow = async () => {
        if (!isOnline) {
            toast({
                title: 'Sem conexao',
                description: 'Conecte-se a internet ou abra pendencias para revisar a fila offline.',
            });
            navigate('/app/sincronizacao');
            return;
        }

        const result = await sync();
        if (result?.success) {
            toast({
                title: 'Sincronizacao concluida',
                description: 'Dados atualizados com sucesso.',
            });
        } else {
            toast({
                title: 'Sincronizacao pendente',
                description: 'Nao foi possivel sincronizar agora. Abra pendencias para detalhes.',
                variant: 'destructive',
            });
        }
        await loadQueueSize();
    };

    return (
        <div className="px-4 py-2 border-b border-border/40 bg-card/30">
            <div className="flex items-center gap-2">
                <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void handleSyncNow()}
                    disabled={isSyncing}
                    className="flex-1"
                >
                    <RefreshCcw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                    {isSyncing ? 'Sincronizando...' : 'Sincronizar agora'}
                </Button>
                <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => navigate('/app/sincronizacao')}
                    className="flex-1"
                >
                    <ListChecks className="h-4 w-4 mr-2" />
                    Pendencias {queueSize > 0 ? `(${queueSize})` : ''}
                </Button>
            </div>
        </div>
    );
};

export default MobileOpsShortcuts;
