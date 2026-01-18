
export interface KpiData {
  period_start?: string;
  period_end?: string;
  orcamentos_total: number;
  orcamentos_ganhos: number;
  taxa_conversao: number;
  receita_ganha: number;
  valor_em_aberto: number;
}

export interface PipelineStats {
  status: string;
  count: number;
  avg_time_days: number;
}

export interface DeliveryStats {
  channel: string;
  total: number;
  delivered: number;
  failed: number;
  sent: number;
  delivery_rate: number;
}

export interface ScheduleStats {
  executed: number;
  failed: number;
  disabled: number;
}

export interface PeriodPreset {
  label: string;
  value: string;
  start: string;
  end: string;
}
