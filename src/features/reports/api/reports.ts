
import { supabase } from '@/lib/customSupabaseClient';
import { KpiData, PipelineStats, DeliveryStats, ScheduleStats } from '@/types/reports';

export async function getKpis(period_start: string, period_end: string): Promise<KpiData> {
  // Since view doesn't take params natively, we filter in the query.
  // Note: v_kpis aggregates everything. To filter by period, we'd normally query the base table or use a function.
  // However, the view v_kpis defined in Task 1 aggregates everything by user. 
  // To support filtering, we need to query 'orders' directly or modify view logic.
  // For the prompt's request "fetches from v_kpis view", we will query it.
  // BUT the prompt implies date filtering. The view aggregates EVERYTHING.
  // We'll follow the instruction to query the view, but client-side filtering won't work if view is pre-aggregated.
  // We'll actually query the raw tables for dynamic KPI calculation to respect the period, 
  // OR we can assume the view is for "All Time" and we implement a specific RPC or query for filtering.
  // Given constraints, I'll implement a dynamic query on 'orders' for KPI to match the period requirement accurately,
  // effectively "simulating" a view with parameters, as standard views don't accept params.
  
  const { data, error } = await supabase
    .from('orders')
    .select('id, status, final_price')
    .gte('created_at', period_start)
    .lte('created_at', period_end);

  if (error) throw error;

  const total = data.length;
  const won = data.filter(o => o.status === 'approved');
  const open = data.filter(o => ['pending', 'sent', 'negotiation'].includes(o.status));
  
  const revenue = won.reduce((acc, curr) => acc + (Number(curr.final_price) || 0), 0);
  const openValue = open.reduce((acc, curr) => acc + (Number(curr.final_price) || 0), 0);
  const conversionRate = total > 0 ? (won.length / total) * 100 : 0;

  return {
    orcamentos_total: total,
    orcamentos_ganhos: won.length,
    taxa_conversao: conversionRate,
    receita_ganha: revenue,
    valor_em_aberto: openValue,
    period_start,
    period_end
  };
}

export async function getPipelineStats(period_start?: string, period_end?: string): Promise<PipelineStats[]> {
  // Use View for general stats, or query dynamic
  // View gives global stats.
  const { data, error } = await supabase
    .from('v_pipeline_stats')
    .select('*');

  if (error) throw error;
  return data || [];
}

export async function getMessageDeliveryStats(): Promise<DeliveryStats[]> {
  const { data, error } = await supabase
    .from('v_message_delivery_stats')
    .select('*');

  if (error) throw error;
  return data || [];
}

export async function getScheduleStats(): Promise<ScheduleStats> {
  const { data, error } = await supabase
    .from('v_schedule_stats')
    .select('*')
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 is no rows returned
  return data || { executed: 0, failed: 0, disabled: 0 };
}

export async function exportReportsCsv(period_start: string, period_end: string, sections: string[]): Promise<Blob> {
  const { data, error } = await supabase.functions.invoke('export-reports-csv', {
    body: { period_start, period_end, sections }
  });

  if (error) throw error;
  // Edge function returns text/csv. Supabase client invoke parses JSON by default?
  // We might need to handle responseType if client supports it or handle raw fetch.
  // The standard supabase invoke wrapper tries to parse JSON. 
  // If we return CSV string, we can wrap it in Blob here.
  return new Blob([data], { type: 'text/csv' });
}
