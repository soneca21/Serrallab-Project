import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, RefreshCcw, Trash2, WifiOff, Wifi } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    listOfflineMutations,
    removeOfflineMutation,
    requeueOfflineMutation,
} from '@/lib/offlineQueue';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { useNavigate } from 'react-router-dom';
import { SystemStatusChip } from '@/components/SystemStatus';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

function formatDate(dateValue) {
    if (!dateValue) return '-';
    const parsed = new Date(dateValue);
    if (Number.isNaN(parsed.getTime())) return '-';
    return parsed.toLocaleString('pt-BR');
}

const SyncCenterPage = () => {
    const { toast } = useToast();
    const navigate = useNavigate();
    const { isSyncing, isOnline, lastSync, sync } = useOfflineSync();
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [queueItems, setQueueItems] = useState([]);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [opFeedback, setOpFeedback] = useState(null);
    const prefersReducedMotion = useReducedMotion();

    const loadQueue = useCallback(async () => {
        setLoading(true);
        try {
            const items = await listOfflineMutations();
            setQueueItems(items || []);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadQueue();
    }, [loadQueue, isSyncing]);

    const permanentErrors = useMemo(
        () => queueItems.filter((item) => item.status === 'failed' && item.failure_type === 'permanent'),
        [queueItems]
    );

    const queueSize = queueItems.length;
    const selectedPermanentErrors = permanentErrors.filter((item) => selectedIds.has(item.id));
    const allSelected = permanentErrors.length > 0 && selectedPermanentErrors.length === permanentErrors.length;

    const toggleSelectAll = (checked) => {
        if (checked) {
            setSelectedIds(new Set(permanentErrors.map((item) => item.id)));
            return;
        }
        setSelectedIds(new Set());
    };

    const toggleSelectOne = (id, checked) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (checked) next.add(id);
            else next.delete(id);
            return next;
        });
    };

    useEffect(() => {
        if (!opFeedback) return undefined;
        const timeout = window.setTimeout(() => {
            setOpFeedback(null);
        }, 4800);
        return () => window.clearTimeout(timeout);
    }, [opFeedback]);

    const handleReprocessAll = async () => {
        if (permanentErrors.length === 0) return;
        setBusy(true);
        try {
            await Promise.all(permanentErrors.map((item) => requeueOfflineMutation(item.id)));
            setSelectedIds(new Set());
            toast({
                title: 'Fila reprocessada',
                description: isOnline
                    ? `${permanentErrors.length} pendência(s) movida(s) para reprocessamento. Próximo passo: aguarde a sincronização.`
                    : `${permanentErrors.length} pendência(s) preparadas. Próximo passo: reconecte-se para enviar automaticamente.`,
                action: !isOnline ? (
                    <Button size="sm" variant="outline" onClick={() => navigate('/app/config/integracoes')}>
                        Abrir configurações
                    </Button>
                ) : undefined,
            });
            if (isOnline) {
                await sync();
            }
            await loadQueue();
            setOpFeedback({
                tone: 'success',
                message: isOnline
                    ? `${permanentErrors.length} pendência(s) movida(s) para reprocessamento.`
                    : `${permanentErrors.length} pendência(s) preparadas para envio ao reconectar.`,
            });
        } catch (error) {
            toast({
                title: 'Erro ao reprocessar',
                description: `${error instanceof Error ? error.message : 'Não foi possível reprocessar as pendências.'} Próximo passo: tente novamente ou descarte os itens com erro permanente.`,
                variant: 'destructive',
                action: (
                    <Button size="sm" variant="outline" onClick={() => void handleReprocessAll()}>
                        Tentar novamente
                    </Button>
                ),
            });
            setOpFeedback({
                tone: 'error',
                message: error instanceof Error ? error.message : 'Não foi possível reprocessar as pendências.',
            });
        } finally {
            setBusy(false);
        }
    };

    const handleDiscardSelected = async () => {
        if (selectedPermanentErrors.length === 0) return;
        setBusy(true);
        try {
            await Promise.all(selectedPermanentErrors.map((item) => removeOfflineMutation(item.id)));
            setSelectedIds(new Set());
            toast({
                title: 'Pendências descartadas',
                description: `${selectedPermanentErrors.length} item(ns) removido(s). Próximo passo: sincronize para atualizar o estado geral.`,
                action: (
                    <Button size="sm" variant="outline" onClick={() => void sync()}>
                        Sincronizar agora
                    </Button>
                ),
            });
            await loadQueue();
            setOpFeedback({
                tone: 'success',
                message: `${selectedPermanentErrors.length} item(ns) descartado(s) da fila.`,
            });
        } catch (error) {
            toast({
                title: 'Erro ao descartar',
                description: `${error instanceof Error ? error.message : 'Não foi possível descartar os itens selecionados.'} Próximo passo: tente novamente ou remova os itens individualmente.`,
                variant: 'destructive',
                action: (
                    <Button size="sm" variant="outline" onClick={() => void handleDiscardSelected()}>
                        Tentar novamente
                    </Button>
                ),
            });
            setOpFeedback({
                tone: 'error',
                message: error instanceof Error ? error.message : 'Não foi possível descartar os itens selecionados.',
            });
        } finally {
            setBusy(false);
        }
    };

    return (
        <main className="space-y-6 pwa-section-compact" aria-labelledby="sync-center-title">
            <a
                href="#sync-errors-table"
                className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:bg-background focus:border focus:border-primary focus:px-3 focus:py-2 focus:rounded-md"
            >
                Ir para pendências com erro permanente
            </a>
            <div>
                <h1 id="sync-center-title" className="pwa-type-title text-foreground">Centro de Sincronização</h1>
                <p className="pwa-type-body text-muted-foreground mt-1">
                    Acompanhe fila offline, estado da sincronização e resolva pendências sem suporte técnico.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="pwa-surface-card">
                    <CardHeader className="pb-2">
                        <CardDescription className="pwa-type-meta">Tamanho da fila</CardDescription>
                        <CardTitle className="pwa-type-title">{queueSize}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="pwa-type-meta">Itens pendentes, falhos ou em processamento.</p>
                    </CardContent>
                </Card>

                <Card className="pwa-surface-card">
                    <CardHeader className="pb-2">
                        <CardDescription className="pwa-type-meta">Último sync</CardDescription>
                        <CardTitle className="pwa-type-subtitle">{formatDate(lastSync)}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="pwa-type-meta">
                            {isSyncing ? 'Sincronizando agora...' : 'Horário da última sincronização concluída.'}
                        </p>
                    </CardContent>
                </Card>

                <Card className="pwa-surface-card">
                    <CardHeader className="pb-2">
                        <CardDescription className="pwa-type-meta">Status de conexão</CardDescription>
                        <CardTitle className="flex items-center gap-2 pwa-type-subtitle">
                            {isOnline ? <Wifi className="h-4 w-4 text-success" /> : <WifiOff className="h-4 w-4 text-offline" />}
                            {isOnline ? 'Online' : 'Offline'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="pwa-type-meta">
                            {isOnline ? 'Reprocessamento automático ativo.' : 'A fila será processada ao reconectar.'}
                        </p>
                    </CardContent>
                </Card>

                <Card className="pwa-surface-card">
                    <CardHeader className="pb-2">
                        <CardDescription className="pwa-type-meta">Erros permanentes</CardDescription>
                        <CardTitle className="pwa-type-subtitle">{permanentErrors.length}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="pwa-type-meta">Itens que exigem ação manual do usuário.</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="pwa-surface-card">
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                    <div>
                        <CardTitle className="flex items-center gap-2 pwa-type-subtitle">
                            <AlertTriangle className="h-4 w-4 text-warning" />
                            Pendências com erro permanente
                        </CardTitle>
                        <CardDescription className="pwa-type-body">
                            Selecione itens para descartar ou reenvie tudo para tentativa de sincronização.
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            onClick={() => void handleReprocessAll()}
                            disabled={busy || permanentErrors.length === 0}
                        >
                            <RefreshCcw className="h-4 w-4 mr-2" />
                            Reprocessar tudo
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => void handleDiscardSelected()}
                            disabled={busy || selectedPermanentErrors.length === 0}
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Descartar selecionados
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <AnimatePresence initial={false}>
                        {opFeedback ? (
                            <motion.div
                                key={`${opFeedback.tone}-${opFeedback.message}`}
                                initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 6 }}
                                animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                                exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -4 }}
                                transition={{ duration: prefersReducedMotion ? 0.05 : 0.18, ease: 'easeOut' }}
                                className={`mb-3 pwa-surface-pad rounded-lg border ${
                                    opFeedback.tone === 'success'
                                        ? 'border-success/30 bg-success/10 text-success'
                                        : 'border-error/30 bg-error/10 text-error'
                                }`}
                                role={opFeedback.tone === 'error' ? 'alert' : 'status'}
                                aria-live={opFeedback.tone === 'error' ? 'assertive' : 'polite'}
                                aria-atomic="true"
                            >
                                <p className="pwa-type-body font-medium">{opFeedback.message}</p>
                            </motion.div>
                        ) : null}
                    </AnimatePresence>
                    {loading ? (
                        <p className="pwa-type-body text-muted-foreground" role="status" aria-live="polite">Carregando pendências...</p>
                    ) : permanentErrors.length === 0 ? (
                        <p className="pwa-type-body text-muted-foreground" role="status" aria-live="polite">Nenhuma pendência com erro permanente no momento.</p>
                    ) : (
                        <Table id="sync-errors-table" role="region" aria-label="Tabela de pendências com erro permanente">
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[44px]">
                                        <Checkbox
                                            checked={allSelected}
                                            onCheckedChange={(checked) => toggleSelectAll(checked === true)}
                                            aria-label="Selecionar todas as pendências"
                                        />
                                    </TableHead>
                                    <TableHead>Mutação</TableHead>
                                    <TableHead>Entidade</TableHead>
                                    <TableHead>Tentativas</TableHead>
                                    <TableHead>Erro</TableHead>
                                    <TableHead>Criado em</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {permanentErrors.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>
                                            <Checkbox
                                                checked={selectedIds.has(item.id)}
                                                onCheckedChange={(checked) => toggleSelectOne(item.id, checked === true)}
                                                aria-label={`Selecionar pendência ${item.mutation_type}`}
                                            />
                                        </TableCell>
                                        <TableCell className="font-medium">{item.mutation_type}</TableCell>
                                        <TableCell>{item.entity}</TableCell>
                                        <TableCell>{item.retry_count}</TableCell>
                                        <TableCell className="max-w-[420px] truncate">{item.last_error || 'Falha permanente'}</TableCell>
                                        <TableCell>{formatDate(item.created_at)}</TableCell>
                                        <TableCell><SystemStatusChip status="failed" label="Erro permanente" /></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </main>
    );
};

export default SyncCenterPage;
