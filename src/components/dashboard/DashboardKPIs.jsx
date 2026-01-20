import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, DollarSign, FileText, Calendar } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { motion } from 'framer-motion';

const KPICard = ({ title, value, icon: Icon, subtext }) => (
  <motion.div
    whileHover={{ y: -2 }}
    transition={{ type: 'spring', stiffness: 300 }}
  >
    <Card className="h-full bg-surface border-border shadow-sm hover:shadow-md hover:bg-surface-hover transition-all duration-200">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-gray-400">{title}</CardTitle>
        <Icon className="h-4 w-4 text-gray-400" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-white">{value}</div>
        <p className="text-xs text-gray-400 mt-1">{subtext}</p>
      </CardContent>
    </Card>
  </motion.div>
);

const DashboardKPIs = ({ data }) => {
  const leadsToday = data.leadsToday ?? data.leadsCount ?? 0;
  const openOrdersCount = data.openOrdersCount ?? 0;
  const openOrdersValue = data.openOrdersValue ?? 0;
  const schedulesToday = data.schedulesToday ?? 0;
  const revenueMonth = data.revenueMonth ?? 0;

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
      <KPICard
        title="Leads de hoje"
        value={leadsToday}
        icon={UserPlus}
        subtext="Novos contatos nas \u00faltimas 24h"
      />
      <KPICard
        title="Or\u00e7amentos em aberto"
        value={openOrdersCount}
        icon={FileText}
        subtext={`Valor pendente: ${formatCurrency(openOrdersValue)}`}
      />
      <KPICard
        title="Agendamentos do dia"
        value={schedulesToday}
        icon={Calendar}
        subtext="Mensagens e lembretes programados"
      />
      <KPICard
        title="Receita do m\u00eas"
        value={formatCurrency(revenueMonth)}
        icon={DollarSign}
        subtext="Pedidos confirmados no per\u00edodo"
      />
    </div>
  );
};

export default DashboardKPIs;
