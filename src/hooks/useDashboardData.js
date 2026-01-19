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
  },
  pipeline: [],
  recentLeads: [],
  activeNegotiations: [],
  revenueHistory: [],
  recentActivity: [],
};

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

      const { count: clientsCount } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      const { data: leads } = await supabase
        .from('leads')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

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

      const currentMonthLeads = leads ? leads.filter((l) => l.created_at >= startOfMonth).length : 0;
      const currentMonthOrders = orders ? orders.filter((o) => o.created_at >= startOfMonth) : [];
      const wonOrdersThisMonth = currentMonthOrders.filter((o) =>
        ['Ganho', 'Aprovado', 'Concluído'].includes(o.status)
      );

      const revenueMonth = wonOrdersThisMonth.reduce((sum, o) => sum + (Number(o.final_price) || 0), 0);
      const conversionRate = currentMonthLeads > 0 ? (wonOrdersThisMonth.length / currentMonthLeads) * 100 : 0;

      const pipelineBuckets = {
        Proposta: 0,
        Negociação: 0,
        Ganho: 0,
        Perdido: 0,
      };

      orders?.forEach((o) => {
        if (['Proposta', 'Rascunho', 'Novo'].includes(o.status)) pipelineBuckets.Proposta += 1;
        else if (['Negociação', 'Em Análise'].includes(o.status)) pipelineBuckets.Negociação += 1;
        else if (['Ganho', 'Aprovado'].includes(o.status)) pipelineBuckets.Ganho += 1;
        else if (['Perdido', 'Rejeitado'].includes(o.status)) pipelineBuckets.Perdido += 1;
      });

      const pipeline = Object.entries(pipelineBuckets).map(([name, count]) => ({
        name,
        count,
        totalValue: 0,
      }));

      const months = [];
      for (let i = 5; i >= 0; i -= 1) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({
          name: d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
          key: d.toISOString().slice(0, 7),
          value: 0,
        });
      }

      orders?.forEach((o) => {
        if (['Ganho', 'Aprovado'].includes(o.status) && o.created_at) {
          const monthKey = o.created_at.slice(0, 7);
          const targetMonth = months.find((m) => m.key === monthKey);
          if (targetMonth) targetMonth.value += (Number(o.final_price) || 0);
        }
      });

      setData({
        kpis: {
          leadsCount: currentMonthLeads,
          clientsCount: Number(clientsCount) || 0,
          revenueMonth,
          conversionRate,
        },
        pipeline,
        recentLeads: leads ? leads.slice(0, 5) : [],
        activeNegotiations: orders ? orders.filter((o) =>
          ['Negociação', 'Proposta'].includes(o.status)
        ).slice(0, 5) : [],
        revenueHistory: months,
        recentActivity: auditLogs || [],
      });
    } catch (fetchError) {
      console.error(fetchError);
      setError(fetchError);
      toast({
        title: "Erro",
        description: "Falha ao carregar dados do dashboard.",
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
