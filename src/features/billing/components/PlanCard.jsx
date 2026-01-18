
import React from 'react';
import { motion } from 'framer-motion';
import { Check, Loader2, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const PlanCard = ({ plan, isCurrentPlan, onSelectPlan, isLoading }) => {
  const price = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format((plan.price_cents || 0) / 100);

  // Helper to format features list from JSONB or standard list
  const getFeaturesList = () => {
      const features = [];
      if (plan.features) {
          if (plan.features.clientes) features.push(`${plan.features.clientes === -1 ? 'Clientes ilimitados' : `${plan.features.clientes} Clientes`}`);
          if (plan.features.orcamentos) features.push(`${plan.features.orcamentos === -1 ? 'Orçamentos ilimitados' : `${plan.features.orcamentos} Orçamentos`}`);
          if (plan.features.usuarios) features.push(`${plan.features.usuarios === -1 ? 'Usuários ilimitados' : `${plan.features.usuarios} Usuários`}`);
          if (plan.features.pipeline) features.push('Pipeline de Vendas');
          if (plan.features.catalogo) features.push('Catálogo Global');
          if (plan.features.relatorios) features.push('Relatórios Avançados');
      }
      return features;
  };

  const features = getFeaturesList();

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
      className="h-full"
    >
      <Card className={cn(
        "h-full flex flex-col relative overflow-hidden",
        isCurrentPlan ? "border-primary shadow-lg bg-primary/5" : "border-border hover:border-primary/50"
      )}>
        {isCurrentPlan && (
          <div className="absolute top-0 right-0 p-2">
            <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
              <Star className="h-3 w-3 fill-current" /> Atual
            </span>
          </div>
        )}

        <CardHeader>
          <CardTitle className="text-2xl">{plan.name}</CardTitle>
          <CardDescription>Ideal para o seu crescimento</CardDescription>
          <div className="mt-4">
             <span className="text-4xl font-bold text-foreground">{price}</span>
             <span className="text-muted-foreground">/mês</span>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1">
          <ul className="space-y-3 mt-2">
            {features.map((feature, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-foreground/80">
                <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        </CardContent>

        <CardFooter>
          <Button 
            className="w-full" 
            variant={isCurrentPlan ? "outline" : "default"}
            disabled={isLoading || isCurrentPlan}
            onClick={() => onSelectPlan(plan.id)}
          >
            {isLoading ? (
               <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            {isCurrentPlan ? "Plano Atual" : "Assinar Agora"}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default PlanCard;
