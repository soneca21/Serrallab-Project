
import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { DeliveryStats } from '@/types/reports';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const COLORS = {
  delivered: '#22c55e', // green-500
  failed: '#ef4444',    // red-500
  sent: '#3b82f6',      // blue-500
  queued: '#94a3b8'     // slate-400
};

interface DeliveryChartProps {
  data: DeliveryStats[];
}

const DeliveryChart: React.FC<DeliveryChartProps> = ({ data }) => {
  // Aggregate data for simple pie chart (Total Delivery Status)
  const aggregated = data.reduce((acc, curr) => {
    acc.delivered += Number(curr.delivered);
    acc.failed += Number(curr.failed);
    acc.sent += Number(curr.sent); // usually sent includes delivered/failed if not mutually exclusive in DB, but View separates them often
    return acc;
  }, { delivered: 0, failed: 0, sent: 0 });

  // If DB view separates mutually exclusive:
  // v_message_delivery_stats: sent is usually total attempts or initial state.
  // Let's assume the view counts distinct statuses.
  // v_message_delivery_stats definition:
  // delivered = status IN ('delivered', 'read')
  // failed = status IN ('failed', 'undelivered')
  // sent = status = 'sent' (pending delivery confirmation)
  
  const chartData = [
    { name: 'Entregue', value: aggregated.delivered, color: COLORS.delivered },
    { name: 'Falha', value: aggregated.failed, color: COLORS.failed },
    { name: 'Enviado (Pendente)', value: aggregated.sent, color: COLORS.sent },
  ].filter(d => d.value > 0);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Status de Entrega (Mensagens)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default DeliveryChart;
