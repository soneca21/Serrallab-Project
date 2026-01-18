
import React, { useEffect, useState } from 'react';
import MobileHeader from '@/components/MobileHeader';
import SyncStatus from '@/components/SyncStatus';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getLeadsOffline, getOrcamentosOffline } from '@/lib/offline';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { Users, FileText, DollarSign, Inbox } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

const DashboardMobile: React.FC = () => {
    const { sync, isSyncing } = useOfflineSync();
    const [stats, setStats] = useState({ leads: 0, orcamentos: 0, revenue: 0 });
    const [leads, setLeads] = useState<any[]>([]);
    const [orcamentos, setOrcamentos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const loadData = async () => {
        try {
            const l = await getLeadsOffline() || [];
            const o = await getOrcamentosOffline() || [];
            
            setLeads(l.slice(0, 5)); // Recent 5
            setOrcamentos(o.filter((x: any) => x.status === 'Negociação').slice(0, 5));

            const revenue = o.filter((x: any) => x.status === 'Aprovado').reduce((acc: number, curr: any) => acc + (Number(curr.final_price) || 0), 0);
            
            setStats({
                leads: l.length,
                orcamentos: o.length,
                revenue
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [isSyncing]); // Reload when sync finishes

    const handleRefresh = async () => {
        await sync();
        await loadData();
    };

    return (
        <div className="space-y-4 p-4">
            <div className="flex items-center justify-between mb-2">
                <h1 className="text-xl font-bold font-heading">Dashboard</h1>
                <SyncStatus />
            </div>

            {/* KPI Stack */}
            <div className="grid gap-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
                        <DollarSign className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-24" /> : formatCurrency(stats.revenue)}</div>
                    </CardContent>
                </Card>
                <div className="grid grid-cols-2 gap-3">
                     <Card onClick={() => navigate('/app/leads')}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Leads</CardTitle>
                            <Inbox className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-12" /> : stats.leads}</div>
                        </CardContent>
                    </Card>
                    <Card onClick={() => navigate('/app/orcamentos')}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Orçamentos</CardTitle>
                            <FileText className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-12" /> : stats.orcamentos}</div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Leads Scroll */}
            <div>
                <h2 className="text-sm font-semibold mb-2">Leads Recentes</h2>
                <ScrollArea className="w-full whitespace-nowrap rounded-md border">
                    <div className="flex w-max space-x-4 p-4">
                        {loading ? Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-24 w-40" />) : 
                         leads.map((lead) => (
                            <div key={lead.id} className="w-[180px] p-3 rounded-lg bg-card border text-card-foreground flex flex-col gap-1">
                                <span className="font-semibold truncate">{lead.name || 'Sem nome'}</span>
                                <span className="text-xs text-muted-foreground truncate">{lead.phone}</span>
                                <span className="text-[10px] bg-secondary px-2 py-0.5 rounded-full w-fit mt-1">{lead.source}</span>
                            </div>
                        ))}
                        {leads.length === 0 && !loading && <span className="text-sm text-muted-foreground">Nenhum lead recente.</span>}
                    </div>
                    <ScrollBar orientation="horizontal" />
                </ScrollArea>
            </div>

             {/* Orcamentos Scroll */}
             <div>
                <h2 className="text-sm font-semibold mb-2">Em Negociação</h2>
                <ScrollArea className="w-full whitespace-nowrap rounded-md border">
                    <div className="flex w-max space-x-4 p-4">
                        {loading ? Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-24 w-40" />) : 
                         orcamentos.map((orc) => (
                            <div key={orc.id} className="w-[200px] p-3 rounded-lg bg-card border text-card-foreground flex flex-col gap-1">
                                <span className="font-semibold truncate">{orc.title}</span>
                                <span className="text-xs text-muted-foreground truncate">{orc.clients?.name}</span>
                                <span className="font-bold text-sm text-primary mt-1">{formatCurrency(orc.final_price)}</span>
                            </div>
                        ))}
                         {orcamentos.length === 0 && !loading && <span className="text-sm text-muted-foreground">Nenhum orçamento em negociação.</span>}
                    </div>
                    <ScrollBar orientation="horizontal" />
                </ScrollArea>
            </div>
        </div>
    );
};

export default DashboardMobile;
