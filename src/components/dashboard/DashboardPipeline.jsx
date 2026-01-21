import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { motion } from 'framer-motion';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border border-border p-3 rounded-lg shadow-xl">
        <p className="font-bold text-foreground mb-1">{label}</p>
        <p className="text-sm text-primary">
          Quantidade: <span className="font-medium text-foreground">{payload[0].value}</span>
        </p>
        <p className="text-sm text-emerald-500">
          Valor: <span className="font-medium text-foreground">{formatCurrency(payload[0].payload.totalValue)}</span>
        </p>
      </div>
    );
  }
  return null;
};

const DashboardPipeline = ({ data }) => {
  const colors = {
    Novo: '#3b82f6',
    Atendimento: '#f59e0b',
    Enviado: '#8b5cf6',
    'Em Producao': '#f97316',
    'Em Produção': '#f97316',
    Entregue: '#14b8a6',
    Ganho: '#10b981',
    Perdido: '#ef4444',
    Proposta: '#3b82f6',
    Negociacao: '#f59e0b',
    Negociação: '#f59e0b',
  };
  const colorTokens = {
    blue: '#3b82f6',
    yellow: '#f59e0b',
    purple: '#8b5cf6',
    orange: '#f97316',
    teal: '#14b8a6',
    green: '#10b981',
    red: '#ef4444',
  };

  const normalizeLabel = (label) => (
    (label || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
  );

  const labelMap = {
    novo: 'Novo',
    atendimento: 'Atendimento',
    enviado: 'Enviado',
    'em producao': 'Em Produção',
    entregue: 'Entregue',
    ganho: 'Ganho',
    perdido: 'Perdido',
    proposta: 'Proposta',
    negociacao: 'Negociação',
  };

  const chartData = (data || []).map((entry) => {
    const normalized = normalizeLabel(entry.name);
    return {
      ...entry,
      displayName: labelMap[normalized] || entry.name,
    };
  });

  const resolveColor = (entry) => {
    if (entry.color) {
      return colorTokens[entry.color] || entry.color;
    }
    return colors[entry.name] || '#8884d8';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-heading text-foreground">Pipeline em andamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                <XAxis
                  dataKey="displayName"
                  stroke="#888"
                  tickLine={false}
                  axisLine={false}
                  fontSize={14}
                  tickMargin={10}
                />
                <YAxis
                  stroke="#888"
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                <Bar dataKey="count" radius={[8, 8, 0, 0]} maxBarSize={60}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={resolveColor(entry)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-6 pt-4 border-t border-border">
            {chartData.map((item) => (
              <div key={item.name} className="text-center">
                <p className="text-sm font-medium text-muted-foreground">{item.displayName}</p>
                <p className="text-lg font-bold text-foreground">{item.count}</p>
                <p className="text-xs text-emerald-500 font-medium">{formatCurrency(item.totalValue)}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default DashboardPipeline;
