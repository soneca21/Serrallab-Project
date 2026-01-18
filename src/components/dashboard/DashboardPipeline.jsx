
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
    'Proposta': '#3b82f6',    // Blue
    'Negociação': '#f59e0b',  // Amber
    'Ganho': '#10b981',       // Emerald
    'Perdido': '#ef4444'      // Red
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-heading text-foreground">Pipeline de Vendas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                <XAxis 
                  dataKey="name" 
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
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[entry.name] || '#8884d8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-4 gap-4 mt-6 pt-4 border-t border-border">
            {data.map((item) => (
              <div key={item.name} className="text-center">
                <p className="text-sm font-medium text-muted-foreground">{item.name}</p>
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
