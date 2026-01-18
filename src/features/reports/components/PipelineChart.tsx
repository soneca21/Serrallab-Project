
import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { PipelineStats } from '@/types/reports';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const STAGE_COLORS: Record<string, string> = {
  'pending': '#3b82f6', // blue-500
  'draft': '#94a3b8', // slate-400
  'negotiation': '#eab308', // yellow-500
  'approved': '#22c55e', // green-500
  'rejected': '#ef4444', // red-500
  'sent': '#6366f1', // indigo-500
};

const STAGE_LABELS: Record<string, string> = {
  'pending': 'Pendente',
  'draft': 'Rascunho',
  'negotiation': 'Negociação',
  'approved': 'Ganho',
  'rejected': 'Perdido',
  'sent': 'Enviado'
};

interface PipelineChartProps {
  data: PipelineStats[];
}

const PipelineChart: React.FC<PipelineChartProps> = ({ data }) => {
  const chartData = data.map(d => ({
    ...d,
    label: STAGE_LABELS[d.status] || d.status,
    fill: STAGE_COLORS[d.status] || '#cbd5e1'
  }));

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Funil de Vendas (Status)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
              <XAxis type="number" />
              <YAxis dataKey="label" type="category" width={80} fontSize={12} />
              <Tooltip 
                formatter={(value, name, props) => [value, 'Orçamentos']}
                labelStyle={{ color: 'black' }}
                content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                        <div className="bg-white p-2 border rounded shadow text-xs">
                        <p className="font-bold">{data.label}</p>
                        <p>Quantidade: {data.count}</p>
                        <p>Tempo Médio: {data.avg_time_days} dias</p>
                        </div>
                    );
                    }
                    return null;
                }}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={30} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default PipelineChart;
