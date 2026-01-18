import React, { useState, useEffect, useCallback } from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import DashboardKPIs from '@/components/dashboard/DashboardKPIs';
import DashboardPipeline from '@/components/dashboard/DashboardPipeline';
import DashboardUltimosLeads from '@/components/dashboard/DashboardUltimosLeads';
import DashboardOrcamentosNegociacao from '@/components/dashboard/DashboardOrcamentosNegociacao';
import DashboardReceitaMeses from '@/components/dashboard/DashboardReceitaMeses';

const DashboardPage = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);

    const [data, setData] = useState({
        kpis: {
            leadsCount: 0,
            clientsCount: 0,
            revenueMonth: 0,
            conversionRate: 0,
        },
        pipeline: [],
        recentLeads: [],
        activeNegotiations: [],
        revenueHistory: []
    });

    const fetchDashboardData = useCallback(async () => {
        if (!user) return;
        setLoading(true);

        try {
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

            const { count: clientsCount } = await supabase.from('clients').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
            const { data: leads } = await supabase.from('leads').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
            const { data: orders } = await supabase.from('orders').select('*').eq('user_id', user.id);

            // KPIs Calculation
            const currentMonthLeads = leads ? leads.filter(l => l.created_at >= startOfMonth).length : 0;
            const currentMonthOrders = orders ? orders.filter(o => o.created_at >= startOfMonth) : [];
            const wonOrdersThisMonth = currentMonthOrders.filter(o => ['Ganho', 'Aprovado', 'Concluído'].includes(o.status));
            
            const revenueMonth = wonOrdersThisMonth.reduce((sum, o) => sum + (Number(o.final_price) || 0), 0);
            const conversionRate = currentMonthLeads > 0 ? (wonOrdersThisMonth.length / currentMonthLeads) * 100 : 0;

            // Chart Data Prep
            const pipelineBuckets = { 'Proposta': 0, 'Negociação': 0, 'Ganho': 0, 'Perdido': 0 };
            orders?.forEach(o => {
                if (['Proposta', 'Rascunho', 'Novo'].includes(o.status)) pipelineBuckets['Proposta']++;
                else if (['Negociação', 'Em Análise'].includes(o.status)) pipelineBuckets['Negociação']++;
                else if (['Ganho', 'Aprovado'].includes(o.status)) pipelineBuckets['Ganho']++;
                else if (['Perdido', 'Rejeitado'].includes(o.status)) pipelineBuckets['Perdido']++;
            });

            const pipelineData = Object.entries(pipelineBuckets).map(([name, count]) => ({ name, count, totalValue: 0 })); // Simplified for now

            const months = [];
            for (let i = 5; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                months.push({ 
                    name: d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''), 
                    key: d.toISOString().slice(0, 7), 
                    value: 0 
                });
            }

            orders?.forEach(o => {
                if (['Ganho', 'Aprovado'].includes(o.status) && o.created_at) {
                    const mKey = o.created_at.slice(0, 7);
                    const m = months.find(x => x.key === mKey);
                    if (m) m.value += (Number(o.final_price) || 0);
                }
            });

            setData({
                kpis: { leadsCount: currentMonthLeads, clientsCount: clientsCount || 0, revenueMonth, conversionRate },
                pipeline: pipelineData,
                recentLeads: leads ? leads.slice(0, 5) : [],
                activeNegotiations: orders ? orders.filter(o => ['Negociação', 'Proposta'].includes(o.status)).slice(0, 5) : [],
                revenueHistory: months
            });

        } catch (error) {
            console.error(error);
            toast({ title: "Erro", description: "Falha ao carregar dashboard.", variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    }, [user, toast]);

    useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

    if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;

    return (
        <HelmetProvider>
            <Helmet><title>Dashboard — Serrallab</title></Helmet>
            <div className="w-full space-y-6">
                <div>
                    <h2 className="text-3xl font-heading font-bold text-foreground">Visão Geral</h2>
                    <p className="text-muted-foreground">Acompanhe o desempenho do seu negócio em tempo real.</p>
                </div>

                <DashboardKPIs data={data.kpis} />
                <DashboardPipeline data={data.pipeline} />
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <DashboardUltimosLeads leads={data.recentLeads} />
                    <DashboardOrcamentosNegociacao orders={data.activeNegotiations} />
                </div>

                <DashboardReceitaMeses data={data.revenueHistory} />
            </div>
        </HelmetProvider>
    );
};

export default DashboardPage;