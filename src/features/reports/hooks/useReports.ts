
import { useState, useEffect, useCallback } from 'react';
import { getKpis, getPipelineStats, getMessageDeliveryStats, getScheduleStats } from '@/features/reports/api/reports';
import { KpiData, PipelineStats, DeliveryStats, ScheduleStats } from '@/types/reports';

interface UseReportsResult {
  kpis: KpiData | null;
  pipeline: PipelineStats[];
  delivery: DeliveryStats[];
  schedules: ScheduleStats | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useReports(period_start: string, period_end: string): UseReportsResult {
  const [kpis, setKpis] = useState<KpiData | null>(null);
  const [pipeline, setPipeline] = useState<PipelineStats[]>([]);
  const [delivery, setDelivery] = useState<DeliveryStats[]>([]);
  const [schedules, setSchedules] = useState<ScheduleStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [kpiData, pipelineData, deliveryData, scheduleData] = await Promise.all([
        getKpis(period_start, period_end),
        getPipelineStats(period_start, period_end),
        getMessageDeliveryStats(),
        getScheduleStats()
      ]);

      setKpis(kpiData);
      setPipeline(pipelineData);
      setDelivery(deliveryData);
      setSchedules(scheduleData);
    } catch (err: any) {
      console.error(err);
      if (err.status === 403 || err.message?.includes('plan')) {
        setError(new Error('Funcionalidade disponível apenas nos planos Pro e Enterprise.'));
      } else {
        setError(new Error('Falha ao carregar dados do relatório.'));
      }
    } finally {
      setIsLoading(false);
    }
  }, [period_start, period_end]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    kpis,
    pipeline,
    delivery,
    schedules,
    isLoading,
    error,
    refetch: fetchData
  };
}
