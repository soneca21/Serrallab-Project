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
  const leadsToday = kpis.leadsToday ?? kpis.leadsCount ?? 0;

  return (
    <div className="space-y-6">
      <section className="px-4 pb-2">
        <div className="grid grid-cols-2 gap-3">
          <MetricCard label="Leads de hoje" value={leadsToday} />
          <MetricCard label="Or\u00e7amentos abertos" value={kpis.openOrdersCount} helper={`Valor: ${formatCurrency(kpis.openOrdersValue)}`} />
          <MetricCard label="Agendamentos do dia" value={kpis.schedulesToday} />
          <MetricCard label="Receita do m\u00eas" value={formatCurrency(kpis.revenueMonth)} />
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
                <p className="text-xl font-semibold text-foreground">{item.count} negocia\u00e7\u00f5es</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-foreground">Or\u00e7amentos em negocia\u00e7\u00e3o</h2>
          <Button variant="ghost" size="sm">Ver tudo</Button>
        </div>
        <div className="space-y-3">
          {activeNegotiations.map((order) => (
            <div key={order.id} className="rounded-xl border border-border bg-surface/60 p-4 space-y-1">
              <p className="text-sm font-semibold text-white truncate">{order.title || 'Or\u00e7amento'}</p>
              <p className="text-xs text-muted-foreground">{order.clients?.name || 'Cliente n\u00e3o informado'}</p>
              <div className="flex items-center justify-between">
                <span className="text-primary font-semibold">{formatCurrency(order.final_price)}</span>
                <span className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">{order.status}</span>
              </div>
            </div>
          ))}
          {!activeNegotiations.length && (
            <p className="text-sm text-muted-foreground">Nenhuma negocia\u00e7\u00e3o ativa no momento.</p>
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
