
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, DollarSign, TrendingUp, UserPlus } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { motion } from 'framer-motion';

const KPICard = ({ title, value, icon: Icon, subtext }) => (
  <motion.div
    whileHover={{ y: -2 }}
    transition={{ type: "spring", stiffness: 300 }}
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
  const { leadsCount, clientsCount, revenueMonth, conversionRate } = data;

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
      <KPICard
        title="Total de Leads (Mês)"
        value={leadsCount}
        icon={UserPlus}
        subtext="Novos leads este mês"
      />
      <KPICard
        title="Total de Clientes"
        value={clientsCount}
        icon={Users}
        subtext="Base ativa de clientes"
      />
      <KPICard
        title="Receita (Mês)"
        value={formatCurrency(revenueMonth)}
        icon={DollarSign}
        subtext="Faturamento confirmado"
      />
      <KPICard
        title="Taxa de Conversão"
        value={`${conversionRate.toFixed(1)}%`}
        icon={TrendingUp}
        subtext="Leads convertidos em vendas"
      />
    </div>
  );
};

export default DashboardKPIs;
