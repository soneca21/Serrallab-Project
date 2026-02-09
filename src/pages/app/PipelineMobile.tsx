import React, { useCallback, useEffect, useMemo, useState } from 'react';
import MobileHeader from '@/components/MobileHeader';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { getOrcamentosOffline, getPipelineOffline } from '@/lib/offline';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { groupOrdersByPipelineStage, PIPELINE_STAGE_ORDER } from '@/lib/sync';
import OperationalStateCard from '@/components/OperationalStateCard';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

const stageLabels: Record<string, string> = {
    'Em Producao': 'Em Producao',
};

const PipelineMobile: React.FC = () => {
    const { sync, isSyncing, isOnline } = useOfflineSync();
    const [pipeline, setPipeline] = useState<Record<string, any[]>>({});
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [hasInitialOfflineEmpty, setHasInitialOfflineEmpty] = useState(false);
    const navigate = useNavigate();

    const columns = useMemo(() => PIPELINE_STAGE_ORDER, []);

    const loadFromCache = useCallback(async () => {
        try {
            const cachedPipeline = await getPipelineOffline();
            if (cachedPipeline && typeof cachedPipeline === 'object') {
                setPipeline(cachedPipeline);
                return cachedPipeline;
            }

            const cachedOrders = await getOrcamentosOffline();
            const grouped = groupOrdersByPipelineStage(cachedOrders || []);
            setPipeline(grouped);
            return grouped;
        } catch {
            const empty = groupOrdersByPipelineStage([]);
            setPipeline(empty);
            setErrorMessage('Não foi possível carregar o pipeline salvo no dispositivo.');
            return empty;
        }
    }, []);

    const loadData = useCallback(async () => {
        setLoading(true);
        setErrorMessage(null);

        const cachedData = await loadFromCache();
        const hasCachedCards = Object.values(cachedData || {}).some((items: any) => (items || []).length > 0);
        setHasInitialOfflineEmpty(!isOnline && !hasCachedCards);
        setLoading(false);

        if (isOnline) {
            const result = await sync();
            if (!result?.success && !hasCachedCards) {
                setErrorMessage('Falha ao buscar pipeline na rede e não há dados em cache.');
            }
            await loadFromCache();
        } else if (!hasCachedCards) {
            setErrorMessage(null);
        }
    }, [isOnline, loadFromCache, sync]);

    useEffect(() => {
        void loadData();
    }, [loadData]);

    useEffect(() => {
        if (!isSyncing) {
            void loadFromCache();
        }
    }, [isSyncing, loadFromCache]);

    const hasAnyCard = useMemo(
        () => columns.some((stage) => (pipeline[stage]?.length || 0) > 0),
        [columns, pipeline]
    );

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <MobileHeader title="Pipeline" onMenu={() => void loadData()} />

            <div className="px-4 pt-4 space-y-4 pwa-section-compact">
                <div className="flex items-center justify-between gap-2">
                    <Button size="sm" onClick={() => navigate('/app/orcamentos/novo')}>
                        <Plus className="h-4 w-4 mr-1" /> Novo orçamento
                    </Button>
                </div>

                {errorMessage && (
                    <OperationalStateCard
                        kind="error"
                        title="Falha ao carregar pipeline"
                        description={`${errorMessage} Próximo passo: tente novamente.`}
                        onPrimaryAction={() => void loadData()}
                    />
                )}

                {loading ? (
                    <OperationalStateCard kind="loading" loadingRows={4} />
                ) : hasInitialOfflineEmpty ? (
                    <OperationalStateCard
                        kind="offline-empty"
                        title="Sem cache inicial para Pipeline"
                        description="Conecte-se a internet ao menos uma vez para baixar os dados."
                        onPrimaryAction={() => void loadData()}
                    />
                ) : !hasAnyCard ? (
                    <OperationalStateCard
                        kind="empty"
                        title="Nenhum item no pipeline"
                        description={isOnline
                            ? 'Não há cards no pipeline para exibir no momento.'
                            : 'Você está offline e não há cards em cache para exibir.'}
                        onPrimaryAction={() => void loadData()}
                    />
                ) : null}
            </div>

            {!loading && !hasInitialOfflineEmpty && hasAnyCard && (
                <>
                    <div className="flex-1 overflow-x-auto overflow-y-hidden">
                        <div className="flex h-full min-w-max p-4 space-x-4 pwa-list-compact">
                            {columns.map((status) => (
                                <div key={status} className="w-[85vw] md:w-[300px] flex flex-col h-full bg-secondary/30 rounded-lg p-2">
                                    <div className="flex justify-between items-center mb-3 px-2">
                                        <h3 className="pwa-type-subtitle">{stageLabels[status] || status}</h3>
                                        <span className="pwa-type-meta bg-background px-2 py-1 rounded-full">
                                            {pipeline[status]?.length || 0}
                                        </span>
                                    </div>

                                    <div className="flex-1 overflow-y-auto space-y-3 pb-20 pwa-list-compact">
                                        {pipeline[status]?.map((item) => (
                                            <Card key={item.id} onClick={() => navigate(`/app/orcamentos/editar/${item.id}`)} className="active:scale-95 transition-transform pwa-surface-card">
                                                <CardContent className="p-3">
                                                    <p className="pwa-type-body font-medium line-clamp-2 mb-1">{item.title}</p>
                                                    <p className="pwa-type-meta mb-2">{item.clients?.name}</p>
                                                    <p className="pwa-type-subtitle text-primary">{formatCurrency(item.final_price)}</p>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>

                                    <div className="pt-2 border-t border-border mt-2 px-2">
                                        <div className="flex justify-between pwa-type-body font-semibold">
                                            <span>Total</span>
                                            <span>
                                                {formatCurrency(pipeline[status]?.reduce((acc, curr) => acc + (Number(curr.final_price) || 0), 0) || 0)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default PipelineMobile;
