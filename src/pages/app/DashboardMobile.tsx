import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useDashboardData } from '@/hooks/useDashboardData';
import { formatCurrency } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const MetricCard = ({ label, value, helper }) => (
  <Card className="p-4">
    <CardHeader className="p-0">
      <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">{label}</p>
    </CardHeader>
    <CardContent className="p-0 mt-2">
      <p className="text-2xl font-bold text-foreground">{value}</p>
      {helper && <p className="text-xs text-muted-foreground mt-1">{helper}</p>}
    </CardContent>
  </Card>
);

const DashboardMobile = () => {
  const { data, loading } = useDashboardData();

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  const { kpis, pipeline, recentLeads, activeNegotiations } = data;

  return (
    <div className="space-y-6">
      <section className="px-4 pb-2">
        <div className="grid grid-cols-2 gap-3">
          <MetricCard label="Leads mês" value={kpis.leadsCount} />
          <MetricCard label="Clientes ativos" value={kpis.clientsCount} />
          <MetricCard label="Faturamento" value={formatCurrency(kpis.revenueMonth)} />
          <MetricCard label="Conversão" value={`${kpis.conversionRate.toFixed(1)}%`} />
        </div>
      </section>

      <section className="px-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-foreground">Pipeline</h2>
          <Button variant="ghost" size="sm">Ver Pipeline</Button>
        </div>
        <div className="space-y-3">
          {pipeline.map((item) => (
            <div key={item.name} className="flex items-center justify-between rounded-xl border border-border bg-surface/50 p-4">
              <div>
                <p className="text-sm text-muted-foreground">{item.name}</p>
                <p className="text-xl font-semibold text-foreground">{item.count} negociações</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-foreground">Orçamentos em negociação</h2>
          <Button variant="ghost" size="sm">Ver tudo</Button>
        </div>
        <div className="space-y-3">
          {activeNegotiations.map((order) => (
            <div key={order.id} className="rounded-xl border border-border bg-surface/60 p-4 space-y-1">
              <p className="text-sm font-semibold text-white truncate">{order.title || 'Orçamento'}</p>
              <p className="text-xs text-muted-foreground">{order.clients?.name || 'Cliente não informado'}</p>
              <div className="flex items-center justify-between">
                <span className="text-primary font-semibold">{formatCurrency(order.final_price)}</span>
                <span className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">{order.status}</span>
              </div>
            </div>
          ))}
          {!activeNegotiations.length && (
            <p className="text-sm text-muted-foreground">Nenhuma negociação ativa no momento.</p>
          )}
        </div>
      </section>

      <section className="px-4 pb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-foreground">Leads recentes</h2>
          <Button variant="ghost" size="sm">Abrir CRM</Button>
        </div>
        <div className="space-y-3">
          {recentLeads.map((lead) => (
            <div key={lead.id} className="rounded-xl border border-border bg-background/50 p-4">
              <p className="text-sm font-semibold text-foreground">{lead.name || 'Lead sem nome'}</p>
              <p className="text-xs text-muted-foreground">{lead.phone}</p>
              <p className="text-[11px] text-primary mt-1">{lead.source}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default DashboardMobile;
