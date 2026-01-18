
import React, { useState } from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { BarChart3, Download, RefreshCcw, DollarSign, Percent, TrendingUp } from 'lucide-react';
import PeriodFilter from '@/features/reports/components/PeriodFilter';
import KpiCard from '@/features/reports/components/KpiCard';
import PipelineChart from '@/features/reports/components/PipelineChart';
import DeliveryChart from '@/features/reports/components/DeliveryChart';
import RevenueChart from '@/features/reports/components/RevenueChart';
import { useReports } from '@/features/reports/hooks/useReports';
import { PERIOD_PRESETS, formatCurrency } from '@/lib/reports';

const ReportsPage = () => {
    const { toast } = useToast();
    const [period, setPeriod] = useState({
        start: PERIOD_PRESETS.LAST_MONTH.start,
        end: PERIOD_PRESETS.LAST_MONTH.end
    });

    const { kpis, pipeline, delivery, schedules, isLoading, error, refetch } = useReports(period.start, period.end);

    const handlePeriodChange = (start: string, end: string) => {
        setPeriod({ start, end });
    };

    // Dummy data for Revenue Chart since we don't have time-series endpoint yet
    // In a real app, we'd fetch daily stats.
    const revenueData = [
        { date: 'Semana 1', value: kpis ? kpis.receita_ganha * 0.2 : 0 },
        { date: 'Semana 2', value: kpis ? kpis.receita_ganha * 0.3 : 0 },
        { date: 'Semana 3', value: kpis ? kpis.receita_ganha * 0.1 : 0 },
        { date: 'Semana 4', value: kpis ? kpis.receita_ganha * 0.4 : 0 },
    ];

    return (
        <HelmetProvider>
            <Helmet><title>Relatórios — Serrallab</title></Helmet>
            <div className="container mx-auto max-w-7xl p-4 space-y-6">
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                           <BarChart3 className="h-8 w-8 text-primary" />
                           Relatórios e Indicadores
                        </h1>
                        <p className="text-muted-foreground">Acompanhe o desempenho do seu negócio em tempo real.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={refetch} disabled={isLoading}>
                            <RefreshCcw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                            Atualizar
                        </Button>
                        <Button variant="default" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Exportar CSV
                        </Button>
                    </div>
                </div>

                <PeriodFilter 
                    period_start={period.start} 
                    period_end={period.end} 
                    onPeriodChange={handlePeriodChange} 
                />

                {error ? (
                    <div className="p-8 text-center border rounded-lg bg-red-50 text-red-600">
                        <h3 className="font-bold">Erro ao carregar dados</h3>
                        <p>{error.message}</p>
                        <Button variant="outline" className="mt-4" onClick={refetch}>Tentar Novamente</Button>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <KpiCard 
                                label="Taxa de Conversão" 
                                value={kpis ? `${kpis.taxa_conversao}%` : '-'}
                                icon={<Percent className="h-6 w-6" />}
                                color="bg-blue-500"
                            />
                            <KpiCard 
                                label="Receita Ganha" 
                                value={kpis ? formatCurrency(kpis.receita_ganha) : '-'}
                                icon={<DollarSign className="h-6 w-6" />}
                                color="bg-green-500"
                            />
                             <KpiCard 
                                label="Valor em Aberto (Pipeline)" 
                                value={kpis ? formatCurrency(kpis.valor_em_aberto) : '-'}
                                icon={<TrendingUp className="h-6 w-6" />}
                                color="bg-yellow-500"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 h-[400px]">
                            <div className="lg:col-span-1 h-full">
                                <PipelineChart data={pipeline} />
                            </div>
                            <div className="lg:col-span-1 h-full">
                                <RevenueChart data={revenueData} />
                            </div>
                            <div className="lg:col-span-1 h-full">
                                <DeliveryChart data={delivery} />
                            </div>
                        </div>

                        {/* Optional Table Section could go here */}
                    </>
                )}
            </div>
        </HelmetProvider>
    );
};

export default ReportsPage;
