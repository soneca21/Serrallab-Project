import { useCallback, useEffect, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';

const DEFAULT_STATE = {
  kpis: {
    leadsCount: 0,
    clientsCount: 0,
    revenueMonth: 0,
    conversionRate: 0,
    leadsToday: 0,
    schedulesToday: 0,
    openOrdersCount: 0,
    openOrdersValue: 0,
  },
  pipeline: [],
  recentLeads: [],
  activeNegotiations: [],
  revenueHistory: [],
  recentActivity: [],
  overdueOrders: [],
  todaySchedules: [],
};

const normalizeStatus = (status) => (
  (status || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
);

const decodeEscapedUnicode = (value) => {
  if (typeof value !== 'string' || !value.includes('\\u')) return value;
  return value.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) =>
    String.fromCharCode(parseInt(hex, 16))
  );
};

const decodeOrderTextFields = (order) => ({
  ...order,
  title: decodeEscapedUnicode(order?.title),
  status: decodeEscapedUnicode(order?.status),
  pipeline_stage_name: decodeEscapedUnicode(order?.pipeline_stage_name),
  clients: order?.clients
    ? { ...order.clients, name: decodeEscapedUnicode(order.clients?.name) }
    : order?.clients,
});

export function useDashboardData() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [data, setData] = useState(DEFAULT_STATE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(startOfDay);
      endOfDay.setDate(endOfDay.getDate() + 1);

      const { count: clientsCount } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      const { data: leadsRaw } = await supabase
        .from('leads')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      const { data: ordersRaw } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      const { data: pipelineStagesRaw, error: pipelineStagesError } = await supabase
        .from('pipeline_stages')
        .select('id, name, color, "order"')
        .order('order', { ascending: true });

      const { data: schedules, error: schedulesError } = await supabase
        .from('message_schedules')
        .select('id, template, channel, next_run_at, run_at')
        .eq('user_id', user.id)
        .gte('next_run_at', startOfDay.toISOString())
        .lt('next_run_at', endOfDay.toISOString());

      if (pipelineStagesError) {
        console.warn('Falha ao carregar etapas da pipeline', pipelineStagesError);
      }
      if (schedulesError) {
        console.warn('Falha ao carregar agendamentos do dia', schedulesError);
      }

      let auditQuery = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (profile?.company_id) {
        auditQuery = auditQuery.eq('company_id', profile.company_id);
      } else {
        auditQuery = auditQuery.eq('user_id', user.id);
      }

      const { data: auditLogs } = await auditQuery;

      const leadsToday = leads.filter((l) => l.created_at >= startOfDay.toISOString()).length;
      const currentMonthLeads = leads.filter((l) => l.created_at >= startOfMonth).length;
      const currentMonthOrders = orders.filter((o) => o.created_at >= startOfMonth);
      const wonStatusSet = new Set(['ganho', 'aprovado', 'concluido', 'entregue']);
      const wonOrdersThisMonth = currentMonthOrders.filter((o) =>
        wonStatusSet.has(normalizeStatus(o.status))
      );

      const revenueMonth = wonOrdersThisMonth.reduce((sum, o) => sum + (Number(o.final_price) || 0), 0);
      const conversionRate = currentMonthLeads > 0 ? (wonOrdersThisMonth.length / currentMonthLeads) * 100 : 0;

      const openStatusSet = new Set([
        'rascunho',
        'proposta',
        'negociacao',
        'em analise',
        'enviado',
        'novo',
        'atendimento',
        'em producao',
      ]);
      const openOrders = orders.filter((o) => openStatusSet.has(normalizeStatus(o.status)));
      const openOrdersValue = openOrders.reduce((sum, o) => sum + (Number(o.final_price) || Number(o.total_cost) || 0), 0);

      const followupCutoff = new Date(now);
      followupCutoff.setDate(followupCutoff.getDate() - 2);
      const overdueOrders = orders.filter((o) => {
        const normalizedStatus = normalizeStatus(o.status);
        if (!['enviado', 'proposta'].includes(normalizedStatus)) return false;
        return o.created_at && new Date(o.created_at) < followupCutoff;
      });

      let pipeline = [];
      if (pipelineStages.length) {
        const novoStage = pipelineStages.find((stage) => normalizeStatus(stage.name) === 'novo');
        pipeline = pipelineStages.map((stage) => {
          const stageOrders = orders.filter((order) => {
            if (order.pipeline_stage_id === stage.id) return true;
            return !order.pipeline_stage_id && novoStage?.id === stage.id;
          });

          return {
            name: stage.name,
            count: stageOrders.length,
            totalValue: stageOrders.reduce((sum, o) => sum + (Number(o.final_price) || Number(o.total_cost) || 0), 0),
            color: stage.color,
          };
        });
      } else {
        const pipelineBuckets = {
          Proposta: 0,
          Negociacao: 0,
          Ganho: 0,
          Perdido: 0,
        };

        orders.forEach((o) => {
          const normalized = normalizeStatus(o.status);
          if (['proposta', 'rascunho', 'novo'].includes(normalized)) pipelineBuckets.Proposta += 1;
          else if (['negociacao', 'em analise'].includes(normalized)) pipelineBuckets.Negociacao += 1;
          else if (['ganho', 'aprovado'].includes(normalized)) pipelineBuckets.Ganho += 1;
          else if (['perdido', 'rejeitado'].includes(normalized)) pipelineBuckets.Perdido += 1;
        });

        pipeline = Object.entries(pipelineBuckets).map(([name, count]) => ({
          name,
          count,
          totalValue: 0,
        }));
      }

      const months = [];
      for (let i = 5; i >= 0; i -= 1) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({
          name: d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
          key: d.toISOString().slice(0, 7),
          value: 0,
        });
      }

      orders.forEach((o) => {
        if (['ganho', 'aprovado'].includes(normalizeStatus(o.status)) && o.created_at) {
          const monthKey = o.created_at.slice(0, 7);
          const targetMonth = months.find((m) => m.key === monthKey);
          if (targetMonth) targetMonth.value += (Number(o.final_price) || 0);
        }
      });

      const negotiationStatuses = new Set(['negociacao', 'proposta', 'enviado']);
      const activeNegotiations = orders.filter((o) =>
        negotiationStatuses.has(normalizeStatus(o.status))
      ).slice(0, 5);

      setData({
        kpis: {
          leadsCount: currentMonthLeads,
          clientsCount: Number(clientsCount) || 0,
          revenueMonth,
          conversionRate,
          leadsToday,
          schedulesToday: schedules?.length || 0,
          openOrdersCount: openOrders.length,
          openOrdersValue,
        },
        pipeline,
        recentLeads: leads.slice(0, 5),
        activeNegotiations,
        revenueHistory: months,
        recentActivity: auditLogs || [],
        overdueOrders,
        todaySchedules: schedules || [],
      });
    } catch (fetchError) {
      console.error(fetchError);
      setError(fetchError);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar dados do dashboard.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, profile, toast]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return { data, loading, error, refetch: fetchDashboardData };
}
      const leads = (leadsRaw || []).map((lead) => ({
        ...lead,
        name: decodeEscapedUnicode(lead?.name),
        source: decodeEscapedUnicode(lead?.source),
      }));
      const orders = (ordersRaw || []).map(decodeOrderTextFields);
      const pipelineStages = (pipelineStagesRaw || []).map((stage) => ({
        ...stage,
        name: decodeEscapedUnicode(stage?.name),
      }));
