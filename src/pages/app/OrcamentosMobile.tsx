
import React, { useEffect, useState } from 'react';
import MobileHeader from '@/components/MobileHeader';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { getOrcamentosOffline } from '@/lib/offline';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

const OrcamentosMobile: React.FC = () => {
    const { sync, isSyncing } = useOfflineSync();
    const [orcamentos, setOrcamentos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const loadData = async () => {
        const data = await getOrcamentosOffline();
        setOrcamentos(data || []);
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, [isSyncing]);

    const getStatusColor = (status: string) => {
        switch(status) {
            case 'Aprovado': return 'bg-green-500';
            case 'Rejeitado': return 'bg-red-500';
            case 'Negociação': return 'bg-yellow-500';
            default: return 'bg-gray-500';
        }
    };

    return (
        <div className="pb-4">
            <MobileHeader title="Orçamentos" />
            
            <div className="p-4 space-y-4">
                {loading ? (
                    Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)
                ) : (
                    orcamentos.map(orc => (
                        <Card key={orc.id} onClick={() => navigate(`/app/orcamentos/editar/${orc.id}`)}>
                            <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-base line-clamp-1">{orc.title}</h3>
                                    <Badge className={getStatusColor(orc.status)}>{orc.status}</Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mb-3">{orc.clients?.name || 'Cliente N/A'}</p>
                                
                                <div className="flex justify-between items-end border-t border-border pt-3">
                                    <div className="text-xs text-muted-foreground">
                                        {new Date(orc.created_at).toLocaleDateString()}
                                    </div>
                                    <div className="font-bold text-lg text-primary">
                                        {formatCurrency(orc.final_price)}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
};

export default OrcamentosMobile;
