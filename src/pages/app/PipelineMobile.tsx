import React, { useEffect, useState } from 'react';
import MobileHeader from '@/components/MobileHeader';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { getOrcamentosOffline } from '@/lib/offline';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

const PipelineMobile: React.FC = () => {
    const { sync, isSyncing } = useOfflineSync();
    const [pipeline, setPipeline] = useState<Record<string, any[]>>({});
    const navigate = useNavigate();

    const columns = [
        'Novo',
        'Atendimento',
        'Enviado',
        'Em Producao',
        'Entregue',
        'Perdido',
    ];
    const stageLabels: Record<string, string> = {
        'Em Producao': 'Em Produ\u00e7\u00e3o',
    };
    const statusFallback = {
        Rascunho: 'Novo',
        Enviado: 'Enviado',
        Aprovado: 'Em Producao',
        'Proposta Aceita': 'Em Producao',
        'Conclu\u00eddo': 'Entregue',
        Concluido: 'Entregue',
        Ganho: 'Entregue',
        Rejeitado: 'Perdido',
    };

    useEffect(() => {
        const load = async () => {
            const data = await getOrcamentosOffline() || [];
            const grouped = columns.reduce((acc, status) => {
                acc[status] = data.filter((item: any) => {
                    const stage = item.pipeline_stage_name || statusFallback[item.status] || 'Novo';
                    return stage === status;
                });
                return acc;
            }, {} as Record<string, any[]>);
            setPipeline(grouped);
        };
        load();
    }, [isSyncing]);

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <MobileHeader title="Pipeline" />
            
            <div className="flex-1 overflow-x-auto overflow-y-hidden">
                <div className="flex h-full min-w-max p-4 space-x-4">
                    {columns.map(status => (
                        <div key={status} className="w-[85vw] md:w-[300px] flex flex-col h-full bg-secondary/30 rounded-lg p-2">
                            <div className="flex justify-between items-center mb-3 px-2">
                                <h3 className="font-bold text-sm">{stageLabels[status] || status}</h3>
                                <span className="text-xs bg-background px-2 py-1 rounded-full">
                                    {pipeline[status]?.length || 0}
                                </span>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto space-y-3 pb-20">
                                {pipeline[status]?.map(item => (
                                    <Card key={item.id} onClick={() => navigate(`/app/orcamentos/editar/${item.id}`)} className="active:scale-95 transition-transform">
                                        <CardContent className="p-3">
                                            <p className="font-medium text-sm line-clamp-2 mb-1">{item.title}</p>
                                            <p className="text-xs text-muted-foreground mb-2">{item.clients?.name}</p>
                                            <p className="text-sm font-bold text-primary">{formatCurrency(item.final_price)}</p>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                            
                            <div className="pt-2 border-t border-border mt-2 px-2">
                                <div className="flex justify-between text-sm font-bold">
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
        </div>
    );
};

export default PipelineMobile;
