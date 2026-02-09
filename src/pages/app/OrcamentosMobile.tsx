import React, { useCallback, useEffect, useState } from 'react';
import MobileHeader from '@/components/MobileHeader';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { getOrcamentosOffline } from '@/lib/offline';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import OperationalStateCard from '@/components/OperationalStateCard';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

const OrcamentosMobile: React.FC = () => {
    const { sync, isSyncing, isOnline } = useOfflineSync();
    const [orcamentos, setOrcamentos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [hasInitialOfflineEmpty, setHasInitialOfflineEmpty] = useState(false);
    const navigate = useNavigate();

    const loadFromCache = useCallback(async () => {
        try {
            const data = await getOrcamentosOffline();
            setOrcamentos(data || []);
            return data || [];
        } catch {
            setOrcamentos([]);
            setErrorMessage('Não foi possível carregar os orçamentos salvos no dispositivo.');
            return [];
        }
    }, []);

    const loadData = useCallback(async () => {
        setLoading(true);
        setErrorMessage(null);

        const cachedData = await loadFromCache();
        setHasInitialOfflineEmpty(!isOnline && cachedData.length === 0);
        setLoading(false);

        if (isOnline) {
            const result = await sync();
            if (!result?.success && cachedData.length === 0) {
                setErrorMessage('Falha ao buscar orçamentos na rede e não há dados em cache.');
            }
            await loadFromCache();
        } else if (cachedData.length === 0) {
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

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Aprovado': return 'bg-success text-success-foreground';
            case 'Rejeitado': return 'bg-error text-error-foreground';
            case 'Negocia\u00e7\u00e3o':
            case 'Negociacao': return 'bg-warning text-warning-foreground';
            default: return 'bg-offline text-offline-foreground';
        }
    };

    return (
        <div className="pb-4">
            <MobileHeader title="Orçamentos" onMenu={() => void loadData()} />

            <div className="p-4 space-y-4 pwa-section-compact">
                <div className="flex items-center justify-between gap-2">
                    <Button size="sm" onClick={() => navigate('/app/orcamentos/novo')}>
                        <Plus className="h-4 w-4 mr-1" /> Novo orçamento
                    </Button>
                </div>

                {errorMessage && (
                    <OperationalStateCard
                        kind="error"
                        title="Falha ao carregar orçamentos"
                        description={`${errorMessage} Proximo passo: tente novamente.`}
                        onPrimaryAction={() => void loadData()}
                    />
                )}

                {loading ? (
                    <OperationalStateCard kind="loading" loadingRows={4} />
                ) : hasInitialOfflineEmpty ? (
                    <OperationalStateCard
                        kind="offline-empty"
                        title="Sem cache inicial para Orçamentos"
                        description="Conecte-se a internet ao menos uma vez para baixar os dados."
                        onPrimaryAction={() => void loadData()}
                    />
                ) : (
                    orcamentos.map((orc) => (
                        <Card key={orc.id} onClick={() => navigate(`/app/orcamentos/editar/${orc.id}`)} className="pwa-surface-card">
                            <CardContent className="pwa-surface-pad">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="pwa-type-subtitle line-clamp-1">{orc.title}</h3>
                                    <Badge className={getStatusColor(orc.status)}>{orc.status}</Badge>
                                </div>
                                <p className="pwa-type-body text-muted-foreground mb-3">{orc.clients?.name || 'Cliente N/A'}</p>

                                <div className="flex justify-between items-end border-t border-border pt-3">
                                    <div className="pwa-type-meta">
                                        {new Date(orc.created_at).toLocaleDateString()}
                                    </div>
                                    <div className="pwa-type-subtitle text-primary">
                                        {formatCurrency(orc.final_price)}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}

                {!loading && orcamentos.length === 0 && (
                    <OperationalStateCard
                        kind="empty"
                        title="Nenhum orçamento disponível"
                        description={isOnline
                            ? 'Nenhum orçamento foi encontrado para os filtros atuais.'
                            : 'Você está offline e não há orçamentos em cache para exibir.'}
                        onPrimaryAction={() => void loadData()}
                    />
                )}
            </div>
        </div>
    );
};

export default OrcamentosMobile;
