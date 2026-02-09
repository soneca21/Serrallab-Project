import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useUsage } from '@/contexts/UsageContext';
import { getPlans } from '@/features/billing/api/subscription';
import { createCheckoutSession } from '@/features/billing/api/createCheckoutSession';
import PlanCard from '@/features/billing/components/PlanCard';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, Check, X, CreditCard, ArrowRight, PackagePlus } from 'lucide-react';
import AppSectionHeader from '@/components/AppSectionHeader';

const featureRows = [
  { key: 'clientes', label: 'Clientes', type: 'quota' },
  { key: 'orcamentos', label: 'Orçamentos', type: 'quota' },
  { key: 'usuarios', label: 'Usuários na equipe', type: 'quota' },
  { key: 'pipeline', label: 'Pipeline de vendas', type: 'boolean' },
  { key: 'catalogo', label: 'Catálogo global', type: 'boolean' },
  { key: 'relatorios', label: 'Relatórios avançados', type: 'boolean' }
];

const PlanosPage = () => {
  const navigate = useNavigate();
  const { plan: currentPlan, subscription, loading: subLoading, refresh } = useSubscription();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkoutId, setCheckoutId] = useState(null);
  const { toast } = useToast();
  const { usage, limits, percentages, isLoading: usageLoading } = useUsage();

  useEffect(() => {
    getPlans().then(setPlans).finally(() => setLoading(false));
  }, []);

  const handleSubscribe = async (planId) => {
    setCheckoutId(planId);
    try {
      const { checkout_url } = await createCheckoutSession(planId);
      if (checkout_url) window.location.href = checkout_url;
    } catch (e) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
      setCheckoutId(null);
    }
  };

  const statusLabel = useMemo(() => {
    if (!subscription?.status) return 'Sem assinatura';
    if (subscription.status === 'trialing') return 'Em teste';
    if (subscription.status === 'active') return 'Ativo';
    if (subscription.status === 'canceled') return 'Cancelado';
    return subscription.status;
  }, [subscription]);

  const renewalDate = useMemo(() => {
    if (!subscription?.current_period_end) return '-';
    return new Date(subscription.current_period_end).toLocaleDateString('pt-BR');
  }, [subscription]);

  const formatFeatureValue = (plan, row) => {
    const value = plan?.features?.[row.key];
    if (row.type === 'quota') {
      if (value === -1) return 'Ilimitado';
      if (typeof value === 'number') return String(value);
      return '-';
    }
    if (row.type === 'boolean') {
      return value ? <Check className="h-4 w-4 text-emerald-400 mx-auto" /> : <X className="h-4 w-4 text-muted-foreground mx-auto" />;
    }
    return '-';
  };

  const usageCards = [
    {
      key: 'mensagens',
      label: 'Mensagens enviadas',
      used: usage.messages_sent,
      limit: limits.sms,
      pct: percentages.sms_pct
    },
    {
      key: 'pdfs',
      label: 'PDFs gerados',
      used: usage.pdfs_generated,
      limit: limits.pdfs,
      pct: percentages.pdfs_pct
    },
    {
      key: 'automacoes',
      label: 'Automações executadas',
      used: usage.automations_executed,
      limit: limits.automations,
      pct: percentages.automations_pct
    }
  ];

  if (loading || subLoading) return <div className="h-[60vh] flex justify-center items-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;

  return (
    <>
      <Helmet><title>Planos - Serrallab</title></Helmet>
      <div className="w-full space-y-12 py-10">
        <AppSectionHeader
            title="Planos e Preços"
            description="Escolha o plano ideal para o momento da sua operação."
        />

        <Card className="max-w-5xl mx-auto">
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5 text-primary" /> Plano atual</CardTitle>
                <CardDescription>Resumo da sua assinatura e próxima cobrança.</CardDescription>
              </div>
              <Badge variant="outline" className="w-fit">{statusLabel}</Badge>
            </div>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Plano</p>
              <p className="text-lg font-semibold text-foreground">{currentPlan?.name || 'Plano básico'}</p>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Renovação</p>
              <p className="text-lg font-semibold text-foreground">{renewalDate}</p>
            </div>
            <div className="flex flex-col gap-3 md:items-end">
              <Button variant="outline" onClick={() => navigate('/app/config?tab=billing')}>Gerenciar assinatura</Button>
              <Button variant="ghost" onClick={refresh} className="text-muted-foreground">Atualizar status</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="max-w-6xl mx-auto">
          <CardHeader>
            <CardTitle>Uso do plano</CardTitle>
            <CardDescription>Acompanhe o consumo mensal dos recursos principais.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {usageCards.map((item) => (
                <div key={item.key} className="rounded-xl border border-border/40 bg-background/30 p-4 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground font-medium">{item.label}</span>
                    <span className="text-muted-foreground">
                      {usageLoading ? '-' : `${item.used}/${item.limit || 0}`}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-surface-strong overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${usageLoading ? 0 : item.pct}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {usageLoading ? 'Carregando...' : `${item.pct}% do limite mensal`}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto px-4">
            {plans.map((plan) => (
                <PlanCard 
                    key={plan.id}
                    plan={plan}
                    isCurrentPlan={currentPlan?.id === plan.id}
                    onSelectPlan={handleSubscribe}
                    isLoading={checkoutId === plan.id}
                />
            ))}
        </div>

        <Card className="max-w-6xl mx-auto">
          <CardHeader>
            <CardTitle>Comparação rápida</CardTitle>
            <CardDescription>Veja as diferenças principais entre os planos disponíveis.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-surface-strong overflow-hidden">
              <Table>
                <TableHeader className="bg-surface-strong">
                  <TableRow>
                    <TableHead>Funcionalidade</TableHead>
                    {plans.map((plan) => (
                      <TableHead key={plan.id} className="text-center">{plan.name}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {featureRows.map((row) => (
                    <TableRow key={row.key}>
                      <TableCell className="text-sm text-foreground">{row.label}</TableCell>
                      {plans.map((plan) => (
                        <TableCell key={`${plan.id}-${row.key}`} className="text-center">
                          {formatFeatureValue(plan, row)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Trocar de plano</CardTitle>
                <CardDescription>Faça upgrade ou downgrade quando quiser.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" onClick={() => document.querySelector('body')?.scrollTo?.(0, 0)}>
                  Ver planos acima
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Gerenciar cobrança</CardTitle>
                <CardDescription>Atualize forma de pagamento e dados fiscais.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" onClick={() => navigate('/app/config?tab=billing')}>
                  Abrir faturamento
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Pacotes extras</CardTitle>
                <CardDescription>Adicione mais orçamentos quando precisar.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" onClick={() => navigate('/app/config?tab=billing')}>
                  Ver pacotes
                  <PackagePlus className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto pt-6 border-t border-border">
            <div className="flex items-center gap-3 justify-center text-muted-foreground">
                <CheckCircle className="text-green-500 h-5 w-5" /> Cancelamento livre
            </div>
            <div className="flex items-center gap-3 justify-center text-muted-foreground">
                <CheckCircle className="text-green-500 h-5 w-5" /> Sem fidelidade
            </div>
            <div className="flex items-center gap-3 justify-center text-muted-foreground">
                <CheckCircle className="text-green-500 h-5 w-5" /> Suporte dedicado
            </div>
        </div>
      </div>
    </>
  );
};

export default PlanosPage;
