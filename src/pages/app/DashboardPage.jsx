import React from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { Loader2 } from 'lucide-react';
import DashboardKPIs from '@/components/dashboard/DashboardKPIs';
import DashboardPipeline from '@/components/dashboard/DashboardPipeline';
import DashboardUltimosLeads from '@/components/dashboard/DashboardUltimosLeads';
import DashboardOrcamentosNegociacao from '@/components/dashboard/DashboardOrcamentosNegociacao';
import DashboardReceitaMeses from '@/components/dashboard/DashboardReceitaMeses';
import DashboardAtividadesRecentes from '@/components/dashboard/DashboardAtividadesRecentes';
import { useDashboardData } from '@/hooks/useDashboardData';
import AppSectionHeader from '@/components/AppSectionHeader';

const DashboardPage = () => {
    const { data, loading } = useDashboardData();

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <HelmetProvider>
            <Helmet><title>Dashboard — Serrallab</title></Helmet>
            <div className="w-full space-y-6">
                <AppSectionHeader
                    title="Visão Geral"
                    description="Centralize KPIs, pipeline e contatos em uma única tela clara."
                    actions={null}
                />

                <DashboardKPIs data={data.kpis} />
                <DashboardPipeline data={data.pipeline} />

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
