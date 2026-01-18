
import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSearchParams } from 'react-router-dom';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { getPlans } from '@/features/billing/api/subscription';
import { createCheckoutSession } from '@/features/billing/api/createCheckoutSession';
import PlanCard from '@/features/billing/components/PlanCard';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const PlanosPage = () => {
  const [searchParams] = useSearchParams();
  const { plan: currentPlan, loading: subLoading, refresh } = useSubscription();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkoutId, setCheckoutId] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    getPlans().then(setPlans).finally(() => setLoading(false));
  }, []);

  const handleSubscribe = async (planId) => {
    setCheckoutId(planId);
    try {
        const { checkout_url } = await createCheckoutSession(planId);
        if(checkout_url) window.location.href = checkout_url;
    } catch(e) {
        toast({ title: "Erro", description: e.message, variant: "destructive" });
        setCheckoutId(null);
    }
  };

  if (loading || subLoading) return <div className="h-[60vh] flex justify-center items-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;

  return (
    <>
      <Helmet><title>Planos — Serrallab</title></Helmet>
      <div className="w-full space-y-12 py-10">
        <div className="text-center space-y-4">
            <h1 className="text-4xl font-heading font-bold">Planos e Preços</h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Escolha a melhor opção para impulsionar sua serralheria.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto px-4">
            {plans.map((plan, i) => (
                <PlanCard 
                    key={plan.id}
                    plan={plan}
                    isCurrentPlan={currentPlan?.id === plan.id}
                    onSelectPlan={handleSubscribe}
                    isLoading={checkoutId === plan.id}
                />
            ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto pt-10 border-t border-border">
            <div className="flex items-center gap-3 justify-center text-muted-foreground">
                <CheckCircle className="text-green-500 h-5 w-5" /> Cancelamento grátis
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
