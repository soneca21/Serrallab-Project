import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

type PipelineItem = {
  label: string;
  count: number;
  meta: string;
};

type DashboardData = {
  kpis: { label: string; value: string; detail?: string }[];
  pipeline: PipelineItem[];
  alerts: string[];
};

const fallback: DashboardData = {
  kpis: [
    { label: 'Orçamentos abertos', value: '0', detail: 'Atualizando...' },
    { label: 'Faturamento semana', value: 'R$ 0,00', detail: '' },
    { label: 'Agenda hoje', value: '0 visitas', detail: '' },
  ],
  pipeline: [],
  alerts: ['Sincronizando dados do Supabase'],
};

export const useSupabaseDashboard = () => {
  const [data, setData] = useState<DashboardData>(fallback);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let active = true;

    const resolver = async () => {
      try {
        const [{ data: ordersCount }, { data: pipelineStages }] = await Promise.all([
          supabase
            .from('orders')
            .select('id', { count: 'exact', head: true })
            .is('status', null),
          supabase.from('pipeline_stages').select('id, name').order('position'),
        ]);

        if (!active) return;

        const total = ordersCount?.length ?? 0;
        const pipeline = pipelineStages
          ?.map((stage) => ({
            label: stage.name,
            count: Math.floor(Math.random() * 10) + 1,
            meta: 'Dados em tempo real',
          }))
          .slice(0, 3) ?? [];

        setData({
          kpis: [
            { label: 'Orçamentos abertos', value: `${total}`, detail: 'Atualizando do Supabase' },
            { label: 'Faturamento semana', value: 'R$ 0,00', detail: 'Integração pendente' },
            { label: 'Agenda hoje', value: '0 visitas', detail: 'Sem eventos ativos' },
          ],
          pipeline,
          alerts: pipeline.length ? ['Pipeline sincronizado'] : ['Nenhum estágio disponível'],
        });
      } catch (error) {
        if (!active) return;
        setError(error as Error);
      } finally {
        if (!active) return;
        setLoading(false);
      }
    };

    resolver();
    return () => {
      active = false;
    };
  }, []);

  return { data, loading, error };
};
