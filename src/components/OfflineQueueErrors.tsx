import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, RotateCcw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { listOfflineMutations, requeueOfflineMutation, removeOfflineMutation } from '@/lib/offlineQueue';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { useNavigate } from 'react-router-dom';
import { SystemStatusChip } from '@/components/SystemStatus';

const OfflineQueueErrors: React.FC = () => {
    const { sync, isOnline, isSyncing } = useOfflineSync();
    const navigate = useNavigate();
    const [items, setItems] = useState<any[]>([]);
    const [expanded, setExpanded] = useState(false);

    const loadItems = useCallback(async () => {
        const failed = await listOfflineMutations({ status: 'failed' });
        setItems((failed || []).filter((item) => item.failure_type === 'permanent'));
    }, []);

    useEffect(() => {
        void loadItems();
    }, [loadItems, isSyncing]);

    const handleReprocess = async (id: string) => {
        await requeueOfflineMutation(id);
        await loadItems();
        if (isOnline) {
            await sync();
        }
    };

    const handleDiscard = async (id: string) => {
        await removeOfflineMutation(id);
        await loadItems();
    };

    if (items.length === 0) return null;

    return (
        <Card className="pwa-state--error" role="alert" aria-live="assertive" aria-atomic="true">
            <CardContent className="pwa-surface-pad space-y-3">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm">
                        <AlertTriangle className="h-4 w-4 text-warning" aria-hidden="true" />
                        <span>{items.length} pendência(s) com erro permanente. Próximo passo: reprocessar ou descartar.</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button size="sm" variant="ghost" onClick={() => navigate('/app/sincronizacao')} aria-label="Abrir centro de sincronização">
                            Ver fila
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setExpanded((prev) => !prev)}
                            aria-controls="offline-queue-errors-list"
                            aria-expanded={expanded}
                        >
                            {expanded ? 'Ocultar' : 'Ver'}
                        </Button>
                    </div>
                </div>

                {expanded && (
                    <div id="offline-queue-errors-list" className="space-y-2">
                        {items.map((item) => (
                            <div key={item.id} className="pwa-surface-card p-2 text-xs space-y-2">
                                <div className="font-medium">{item.mutation_type}</div>
                                <div className="text-muted-foreground">{item.last_error || 'Falha permanente'}</div>
                                <SystemStatusChip status="failed" />
                                <div className="flex gap-2">
                                    <Button size="sm" variant="outline" onClick={() => void handleReprocess(item.id)} aria-label={`Reprocessar item ${item.mutation_type}`}>
                                        <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reprocessar
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={() => void handleDiscard(item.id)} aria-label={`Descartar item ${item.mutation_type}`}>
                                        <Trash2 className="h-3.5 w-3.5 mr-1" /> Descartar
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default OfflineQueueErrors;
