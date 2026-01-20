import React, { useState, useEffect } from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Check, X, Award, Cpu, Gem, Building, PackagePlus, ShoppingCart, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NavLink } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { supabase } from '@/lib/customSupabaseClient';
import stripePromise from '@/lib/stripe';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const fadeIn = (delay = 0) => ({ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, delay } } });
const staggerContainer = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.1 } } };

const plans = [
    { 
        name: 'Iniciante', 
        price: 'R$0', 
        priceId: null, 
        period: '',
        description: 'Perfeito para testar e dar os primeiros passos.', 
        icon: Award, 
        features: [
            { text: '5 Orçamentos/mês' }, 
            { text: '1 Usuário' }, 
            { text: 'PDF com marca d\'água' }
        ], 
        cta: 'Começar Grátis' 
    },
    { 
        name: 'Profissional', 
        price: 'R$49', 
        priceId: 'price_1PfgO82HCMfdfk8sXgG9N1fR', 
        period: '/mês', 
        description: 'Para autônomos e pequenas equipes.', 
        icon: Cpu, 
        isPopular: true, 
        features: [
            { text: '100 Orçamentos/mês' }, 
            { text: 'Até 3 Usuários' }, 
            { text: 'PDF com seu Logo' }, 
            { text: 'Envio por WhatsApp' }, 
            { text: 'Suporte via Email' }
        ], 
        cta: 'Assinar Profissional' 
    },
    { 
        name: 'Business', 
        price: 'R$99', 
        priceId: 'price_1PfgOu2HCMfdfk8sKzGvA4qZ', 
        period: '/mês', 
        description: 'Para empresas em crescimento.', 
        icon: Gem, 
        features: [
            { text: 'Orçamentos Ilimitados' }, 
            { text: 'Até 10 Usuários' }, 
            { text: 'PDF com seu Logo' }, 
            { text: 'IA de Precificação' }, 
            { text: 'Suporte Prioritário' }
        ], 
        cta: 'Assinar Business' 
    },
    { 
        name: 'Enterprise', 
        price: 'Contato', 
        priceId: null, 
        period: '', 
        description: 'Soluções sob medida para grandes operações.', 
        icon: Building, 
        features: [
            { text: 'Tudo do Business' }, 
            { text: 'Usuários Ilimitados' }, 
            { text: 'Catálogo 3D (beta)' }, 
            { text: 'Acesso à API' }, 
            { text: 'Gerente de Contas' }
        ], 
        cta: 'Entrar em Contato' 
    },
];

const allFeatures = [
    { name: 'Orçamentos', values: ['5/mês', '100/mês', 'Ilimitados', 'Ilimitados'] },
    { name: 'Usuários', values: ['1', '3', '10', 'Ilimitados'] },
    { name: 'PDF Personalizado', values: [false, true, true, true] },
    { name: 'Envio por WhatsApp', values: [false, true, true, true] },
    { name: 'IA de Precificação', values: [false, false, true, true] },
    { name: 'Catálogo 3D (beta)', values: [false, false, false, true] },
    { name: 'Acesso à API', values: [false, false, false, true] },
    { name: 'Tipo de Suporte', values: ['Comunitário', 'Email', 'Prioritário', 'Gerente Dedicado'] },
];

const PlanCard = ({ plan, delay }) => {
    const { toast } = useToast();
    const { user, profile } = useAuth();
    const [isProcessing, setIsProcessing] = useState(false);

    const handleCheckout = async (priceId) => {
        if (!user || !profile) {
            toast({ title: "Ação necessária", description: "Por favor, faça login ou cadastre-se para assinar.", variant: "destructive" });
            return;
        }
        
        if (!profile.stripe_customer_id) {
            toast({ title: "Aguarde um momento", description: "Estamos finalizando a configuração da sua conta de pagamentos. Tente novamente em alguns segundos.", variant: "default" });
            return;
        }

        setIsProcessing(true);
        try {
            const { data, error } = await supabase.functions.invoke('create-stripe-checkout', {
                body: { priceId: priceId, customerId: profile.stripe_customer_id },
            });
            if (error) throw error;
            const stripe = await stripePromise;
            const { error: stripeError } = await stripe.redirectToCheckout({ sessionId: data.sessionId });
            if (stripeError) throw stripeError;
        } catch (error) {
            toast({ title: "Erro no Checkout", description: error.message, variant: "destructive" });
        } finally {
            setIsProcessing(false);
        }
    };
    
    const handleCtaClick = () => {
        if (plan.priceId) {
            handleCheckout(plan.priceId);
        } else if (plan.price === 'Contato') {
             toast({ title: "Contato Enterprise", description: "Nossa equipe entrará em contato em breve!" });
        }
    };
    
    const ctaPath = plan.name === 'Iniciante' ? '/cadastro' : '#';

    return (
        <motion.div 
            variants={fadeIn(delay)} 
            className={`relative flex flex-col p-8 rounded-2xl border-2 transition-all duration-300 hover:scale-105 ${plan.isPopular ? 'bg-card border-primary shadow-[0_0_30px_rgba(218,105,11,0.15)]' : 'bg-card border-border hover:border-primary/50'}`}
        >
            {plan.isPopular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-orange-600 px-4 py-1.5 rounded-full text-sm font-bold text-white shadow-lg whitespace-nowrap flex items-center gap-2">
                    <Gem className="h-3 w-3 fill-current" /> MAIS POPULAR
                </div>
            )}
            <div className="flex-grow">
                <div className={`p-3 rounded-xl w-fit mb-5 ${plan.isPopular ? 'bg-primary/20' : 'bg-secondary'}`}>
                    <plan.icon className={`h-8 w-8 ${plan.isPopular ? 'text-primary' : 'text-gray-400'}`} />
                </div>
                <h3 className="text-2xl font-heading text-foreground">{plan.name}</h3>
                <p className="mt-1.5 text-muted-foreground h-12">{plan.description}</p>
                <div className="mt-6 flex items-baseline">
                    <span className="text-5xl font-bold font-heading text-foreground">{plan.price}</span>
                    {plan.period && <span className="text-muted-foreground font-body text-lg ml-1">{plan.period}</span>}
                </div>
                <ul className="mt-8 space-y-4">
                    {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-3">
                            <div className={`p-0.5 rounded-full ${plan.isPopular ? 'bg-primary/20 text-primary' : 'bg-gray-800 text-gray-400'}`}>
                                <Check className="h-3 w-3" />
                            </div>
                            <span className="text-gray-300 font-body text-sm">{feature.text}</span>
                        </li>
                    ))}
                </ul>
            </div>
            <div className="mt-10">
                <Button 
                    onClick={handleCtaClick} 
                    disabled={isProcessing} 
                    size="lg" 
                    className={`w-full h-[50px] font-bold text-lg shadow-md transition-all duration-200 ${plan.isPopular ? 'bg-primary hover:bg-primary/90 text-white' : 'bg-secondary border border-border text-foreground hover:bg-secondary/80 hover:text-primary hover:border-primary'}`}
                >
                    {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (plan.name === 'Iniciante' ? <NavLink to={ctaPath} className="w-full flex items-center justify-center gap-2">{plan.cta} <ArrowRight className="h-4 w-4" /></NavLink> : <span className="flex items-center gap-2">{plan.cta} <ArrowRight className="h-4 w-4" /></span>)}
                </Button>
            </div>
        </motion.div>
    )
};

const QuotePackagesSection = () => {
    const { toast } = useToast();
    const [packages, setPackages] = useState([]);
    
    useEffect(() => {
        const fetchPackages = async () => {
            const { data, error } = await supabase.from('quote_packages').select('*').eq('is_active', true).order('price', { ascending: true });
            if (!error && data) { setPackages(data); }
        };
        fetchPackages();
    }, []);

    const handlePurchase = () => { toast({ title: 'Ação necessária', description: 'A compra de pacotes pode ser feita dentro do seu painel de controle.', }); };

    if (packages.length === 0) { return null; }

    return (
        <div className="mt-32 relative">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent blur-3xl -z-10 opacity-30" />
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.5 }} variants={fadeIn(0.5)} className="text-center">
                 <h2 className="text-3xl md:text-4xl font-heading text-center mb-5 text-white">Acabaram seus Orçamentos?</h2>
                <p className="text-lg text-muted-foreground text-center mb-12 max-w-2xl mx-auto">Compre pacotes avulsos e continue criando propostas sem precisar mudar de plano.</p>
            </motion.div>
            <motion.div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-4xl mx-auto" variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                {packages.map((pkg, idx) => (
                    <motion.div key={pkg.id} variants={fadeIn(idx * 0.15)} className="flex flex-col text-center p-8 bg-card rounded-2xl border border-border hover:border-primary/50 transition-colors backdrop-blur-sm shadow-lg">
                        <div className="flex-grow">
                             <div className="mx-auto bg-secondary w-16 h-16 rounded-full flex items-center justify-center mb-6">
                                <PackagePlus className="h-8 w-8 text-primary" />
                             </div>
                             <h3 className="text-2xl font-bold font-heading text-white">{pkg.name}</h3>
                            <p className="text-muted-foreground font-body mt-2">+{pkg.quote_amount} orçamentos</p>
                            <p className="text-4xl font-bold text-primary mt-6">R${Number(pkg.price).toFixed(2)}</p>
                            <p className="text-gray-500 text-sm">pagamento único</p>
                        </div>
                        <Button onClick={handlePurchase} className="mt-8 w-full bg-secondary hover:bg-secondary/80 text-white hover:text-primary transition-colors border border-transparent hover:border-primary"><ShoppingCart className="mr-2 h-4 w-4"/>Comprar</Button>
                    </motion.div>
                ))}
            </motion.div>
            <p className="text-center text-gray-500 text-sm mt-8">* Pacotes de orçamentos extras também podem ser adquiridos a qualquer momento dentro do seu <NavLink to="/app/config" className="underline hover:text-primary">painel de controle</NavLink>.</p>
        </div>
    );
};

const ComparisonTable = () => (
    <div className="mt-32">
        <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.5 }} variants={fadeIn()} className="text-3xl md:text-4xl font-heading text-center mb-12 text-white">
            Compare os Planos Detalhadamente
        </motion.h2>
        <div className="overflow-x-auto bg-card rounded-2xl border border-border p-2">
            <table className="w-full min-w-max text-left border-collapse">
                <thead>
                    <tr>
                        <th className="p-6 text-xl font-heading text-white bg-secondary/30 rounded-tl-xl">Funcionalidades</th>
                        {plans.map(p => <th key={p.name} className={`p-6 text-center font-bold text-lg ${p.isPopular ? 'text-primary' : 'text-gray-400'}`}>{p.name}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {allFeatures.map((feature, idx) => (
                        <tr key={idx} className="border-t border-border hover:bg-secondary/20 transition-colors">
                            <td className="p-5 font-semibold text-gray-300">{feature.name}</td>
                            {feature.values.map((value, planIdx) => (
                                <td key={planIdx} className="p-5 text-center">
                                    {typeof value === 'boolean' ? (
                                        value ? <div className="flex justify-center"><Check className="h-5 w-5 text-primary bg-primary/10 rounded-full p-1"/></div> : <div className="flex justify-center"><X className="h-5 w-5 text-muted-foreground/50"/></div>
                                    ) : (
                                        <span className="text-gray-300 font-medium">{value}</span>
                                    )}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

const FaqSection = () => {
    const faqs = [
        { q: "Posso cancelar minha assinatura a qualquer momento?", a: "Sim! Você pode cancelar sua assinatura a qualquer momento, sem taxas ou burocracia. Você continuará com acesso ao plano até o fim do período já pago." },
        { q: "O que acontece se eu exceder o limite de orçamentos do meu plano?", a: "Você será notificado e terá a opção de fazer um upgrade para um plano superior ou comprar um pacote de orçamentos extra para continuar criando sem interrupções." },
        { q: "Quais são as formas de pagamento?", a: "Aceitamos todos os principais cartões de crédito. O processo de pagamento é 100% seguro, processado pela Stripe." },
        { q: "O que é a 'IA de Precificação'?", a: "É uma ferramenta inteligente que analisa os custos dos seus materiais, sua mão de obra e as médias de mercado para sugerir o preço de venda ideal, maximizando seu lucro." },
    ];
    return (
        <div className="mt-32 max-w-4xl mx-auto pb-20">
            <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.5 }} variants={fadeIn()} className="text-3xl md:text-4xl font-heading text-center mb-12 text-white">Perguntas Frequentes</motion.h2>
            <Accordion type="single" collapsible className="w-full space-y-4">
                {faqs.map((faq, idx) => (
                    <motion.div key={idx} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.5 }} variants={fadeIn(idx * 0.1)}>
                        <AccordionItem value={`item-${idx}`} className="bg-card rounded-xl border border-border px-6 hover:border-primary/30 transition-colors">
                            <AccordionTrigger className="text-lg text-left font-semibold text-white hover:no-underline hover:text-primary transition-colors py-6">{faq.q}</AccordionTrigger>
                            <AccordionContent className="text-gray-400 text-base pb-6 leading-relaxed">{faq.a}</AccordionContent>
                        </AccordionItem>
                    </motion.div>
                ))}
            </Accordion>
        </div>
    );
}

const PricingPage = () => {
  return (
    <HelmetProvider>
      <div className="bg-background py-20 md:py-28 relative overflow-hidden min-h-screen">
        <Helmet><title>Planos e Preços — Serrallab</title><meta name="description" content="Escolha o plano ideal para sua serralheria. Planos Free, Pro e Master com funcionalidades incríveis." /></Helmet>
        
        {/* Background Accents */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1200px] h-[500px] bg-primary/10 blur-[120px] rounded-full -z-10 pointer-events-none opacity-50" />
        
        <div className="container relative z-10">
          <motion.div initial="hidden" animate="visible" variants={fadeIn()} className="text-center mb-20">
              <div className="inline-block mb-4 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-semibold text-sm">
                  Preços Simples e Transparentes
              </div>
              <h1 className="text-4xl md:text-6xl font-heading text-white font-bold tracking-tight">Planos para todos os <br/><span className="text-primary bg-clip-text text-transparent bg-gradient-to-r from-primary to-orange-500">tamanhos</span> de negócio</h1>
              <p className="mt-6 max-w-3xl mx-auto text-lg md:text-xl text-muted-foreground font-body leading-relaxed">Comece de graça e evolua conforme sua empresa cresce. Sem burocracia, sem surpresas.</p>
          </motion.div>
          
          <motion.div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6 max-w-7xl mx-auto" variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            {plans.map((plan, idx) => (<PlanCard key={plan.name} plan={plan} delay={idx * 0.1} />))}
          </motion.div>
          
          <QuotePackagesSection />
          <ComparisonTable />
          <FaqSection />
        </div>
      </div>
    </HelmetProvider>
  );
};

export default PricingPage;
