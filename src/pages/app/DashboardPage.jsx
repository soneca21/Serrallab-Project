import React from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { Loader2, PlusCircle, UserPlus, CalendarClock, FileText, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import DashboardKPIs from '@/components/dashboard/DashboardKPIs';
import DashboardPipeline from '@/components/dashboard/DashboardPipeline';
import DashboardUltimosLeads from '@/components/dashboard/DashboardUltimosLeads';
import DashboardOrcamentosNegociacao from '@/components/dashboard/DashboardOrcamentosNegociacao';
import DashboardReceitaMeses from '@/components/dashboard/DashboardReceitaMeses';
import DashboardAtividadesRecentes from '@/components/dashboard/DashboardAtividadesRecentes';
import { useDashboardData } from '@/hooks/useDashboardData';
import AppSectionHeader from '@/components/AppSectionHeader';
import { formatCurrency } from '@/lib/utils';

const DashboardPage = () => {
    const navigate = useNavigate();
    const { data, loading } = useDashboardData();

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    const { kpis, overdueOrders, todaySchedules } = data;

    const formatTime = (value) => {
        if (!value) return '--:--';
        const date = new Date(value);
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <HelmetProvider>
            <Helmet><title>Dashboard - Serrallab</title></Helmet>
            <div className="w-full space-y-6">
                <AppSectionHeader
                    title="Painel do Dia"
                    description="Prioridades, pr\u00f3ximas a\u00e7\u00f5es e desempenho do m\u00eas em um s\u00f3 lugar."
                    actions={null}
                />

                <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
                    <div className="space-y-6">
                        <DashboardKPIs data={kpis} />
                        <DashboardPipeline data={data.pipeline} />
                    </div>
                    <div className="space-y-6">
                        <Card className="border-border bg-card">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <PlusCircle className="h-5 w-5 text-primary" />
                                    Atalhos r\u00e1pidos
                                </CardTitle>
                                <CardDescription>A\u00e7\u00f5es usadas no dia a dia para manter tudo em movimento.</CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-col gap-2">
                                <Button className="justify-start" onClick={() => navigate('/app/orcamentos/novo')}>
                                    <FileText className="mr-2 h-4 w-4" />
                                    Novo or\u00e7amento
                                </Button>
                                <Button variant="outline" className="justify-start" onClick={() => navigate('/app/clientes')}>
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    Novo cliente
                                </Button>
                                <Button variant="outline" className="justify-start" onClick={() => navigate('/app/agendamentos')}>
                                    <CalendarClock className="mr-2 h-4 w-4" />
                                    Novo agendamento
                                </Button>
                                <Button variant="ghost" className="justify-start" onClick={() => navigate('/app/pipeline')}>
                                    Ver pipeline <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </CardContent>
                        </Card>

                        <Card className="border-border bg-card">
                            <CardHeader>
                                <CardTitle>Prioridades do dia</CardTitle>
                                <CardDescription>O que precisa de aten\u00e7\u00e3o agora.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-sm">
                                        <span>Leads recebidos hoje</span>
                                        <Badge variant="secondary">{kpis.leadsToday}</Badge>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span>Agendamentos do dia</span>
                                        <Badge variant="secondary">{kpis.schedulesToday}</Badge>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span>Or\u00e7amentos em aberto</span>
                                        <Badge variant="secondary">{kpis.openOrdersCount}</Badge>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span>Follow-ups atrasados</span>
                                        <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/40">
                                            {overdueOrders.length}
                                        </Badge>
                                    </div>
                                </div>

                                {todaySchedules.length > 0 && (
                                    <div className="space-y-2 border-t border-border/40 pt-4">
                                        <p className="text-xs uppercase text-muted-foreground">Agenda de hoje</p>
                                        {todaySchedules.slice(0, 3).map((schedule) => (
                                            <div key={schedule.id} className="flex items-center justify-between text-sm">
                                                <span className="truncate">{schedule.template?.replace(/_/g, ' ') || 'Mensagem agendada'}</span>
                                                <span className="text-xs text-muted-foreground">{formatTime(schedule.next_run_at || schedule.run_at)}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {overdueOrders.length > 0 && (
                                    <div className="space-y-2 border-t border-border/40 pt-4">
                                        <p className="text-xs uppercase text-muted-foreground">Aguardando retorno</p>
                                        {overdueOrders.slice(0, 3).map((order) => (
                                            <button
                                                key={order.id}
                                                type="button"
                                                onClick={() => navigate(`/app/orcamentos/editar/${order.id}`)}
                                                className="w-full rounded-lg border border-border/40 bg-background/30 p-3 text-left transition hover:bg-muted/40"
                                            >
                                                <div className="flex items-center justify-between gap-3">
                                                    <div>
                                                        <p className="text-sm font-medium text-foreground truncate max-w-[220px]">
                                                            {order.title || 'Or\u00e7amento sem t\u00edtulo'}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            Valor: {formatCurrency(order.final_price || order.total_cost || 0)}
                                                        </p>
                                                    </div>
                                                    <span className="text-xs text-amber-400">Atrasado</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {todaySchedules.length === 0 && overdueOrders.length === 0 && (
                                    <div className="rounded-lg border border-border/40 bg-background/30 p-3 text-xs text-muted-foreground">
                                        Nenhuma pend\u00eancia urgente no momento.
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <DashboardUltimosLeads leads={data.recentLeads} />
                    <DashboardOrcamentosNegociacao orders={data.activeNegotiations} />
                </div>

                <DashboardAtividadesRecentes logs={data.recentActivity} />

                <DashboardReceitaMeses data={data.revenueHistory} />
            </div>
        </HelmetProvider>
    );
};

export default DashboardPage;
