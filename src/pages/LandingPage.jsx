import React from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Zap, Users, Package, BarChart, Settings, Send, Hammer, Check, Hammer as HammerIcon, ShieldCheck, Award, Cpu, Gem, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NavLink } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const fadeIn = (delay = 0) => ({
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, delay } },
});

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.1,
    },
  },
};

const HeroSection = () => (
    <section id="home" className="relative py-24 md:py-40 text-center text-foreground overflow-hidden bg-page-bg scroll-mt-28 min-h-screen">
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background to-background opacity-40"></div>
    <div className="w-full relative z-10">
      <motion.div variants={staggerContainer} initial="hidden" animate="visible">
        <motion.div variants={fadeIn()} className="mb-8 inline-block bg-surface-strong p-6 rounded-full border-2 border-primary shadow-[0_0_30px_rgba(218,105,11,0.2)]">
          <HammerIcon className="h-16 w-16 md:h-24 md:w-24 mx-auto text-primary drop-shadow-[0_0_10px_rgba(218,105,11,0.5)]" />
        </motion.div>
        <motion.h1 variants={fadeIn(0.1)} className="text-4xl md:text-7xl font-heading font-bold mb-6 tracking-tight text-foreground">
          Transforme Orçamentos<br /> <span className="text-primary drop-shadow-[0_0_15px_rgba(218,105,11,0.3)]">em Lucro</span>
        </motion.h1>
        <motion.p variants={fadeIn(0.2)} className="text-lg md:text-xl max-w-3xl mx-auto text-muted-foreground mb-10 font-body leading-relaxed">
          Chega de perder tempo com planilhas e papel. Com o <span className="text-foreground font-semibold">Serrallab</span>, você cria orçamentos precisos em minutos, gerencia seus clientes e materiais, e eleva o nível do seu negócio.
        </motion.p>
        <motion.div variants={fadeIn(0.3)} className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <NavLink to="/cadastro">
            <Button size="lg" className="h-[50px] bg-primary hover:bg-primary/90 text-white font-bold text-lg px-8 rounded-xl shadow-[0_0_20px_rgba(218,105,11,0.3)] hover:shadow-[0_0_30px_rgba(218,105,11,0.5)] transition-all duration-300 border-2 border-primary">
              Comece a usar grátis
            </Button>
          </NavLink>
          <NavLink to="/precos">
            <Button size="lg" variant="outline" className="h-[50px] text-lg px-8 rounded-xl border-2 border-surface-strong hover:border-primary hover:text-primary transition-all duration-300 bg-transparent text-muted-foreground">
              Ver Planos
            </Button>
          </NavLink>
        </motion.div>
      </motion.div>
    </div>
  </section>
);

const FeatureCard = ({ icon: Icon, title, description, delay }) => (
    <motion.div 
        variants={fadeIn(delay)} 
        className="bg-surface p-8 rounded-xl border border-surface-strong text-left transition-all duration-300 hover:border-primary hover:border-l-4 hover:-translate-y-2 hover:shadow-[0_0_20px_rgba(218,105,11,0.1)] group"
    >
        <div className="flex items-start mb-5">
            <div className="bg-surface-strong p-3 rounded-lg border border-primary/20 group-hover:border-primary/50 transition-colors">
                <Icon className="h-7 w-7 text-primary group-hover:drop-shadow-[0_0_8px_rgba(218,105,11,0.6)] transition-all" />
            </div>
        </div>
        <h3 className="text-xl font-heading font-semibold mb-3 text-foreground group-hover:text-primary transition-colors">{title}</h3>
        <p className="text-muted-foreground font-body leading-relaxed">{description}</p>
    </motion.div>
);

const FeaturesSection = () => (
    <section id="features" className="py-20 md:py-28 bg-background border-t border-surface-strong scroll-mt-28 min-h-screen">
        <div className="w-full px-4 md:px-8">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={staggerContainer}>
                <motion.h2 variants={fadeIn()} className="text-3xl md:text-5xl font-heading font-bold text-center mb-5 text-foreground">
                    Tudo que você precisa <span className="text-primary">em um só lugar</span>
                </motion.h2>
                <motion.div variants={fadeIn(0.05)} className="w-24 h-1 bg-primary mx-auto mb-6 rounded-full"></motion.div>
                <motion.p variants={fadeIn(0.1)} className="text-lg text-muted-foreground text-center mb-16 max-w-2xl mx-auto">
                    Deixe a burocracia conosco e foque no que você faz de melhor: criar peças incríveis.
                </motion.p>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <FeatureCard icon={Zap} title="Orçamentos em Minutos" description="Selecione materiais, adicione mão de obra e seus custos. O cálculo é automático e sem erros." delay={0} />
                    <FeatureCard icon={Users} title="Gestão de Clientes (CRM)" description="Mantenha um histórico completo de seus clientes e orçamentos enviados. Nunca mais perca um contato." delay={0.1} />
                    <FeatureCard icon={Package} title="Catálogo de Materiais" description="Cadastre seus materiais e fornecedores uma vez e use para sempre. Importe do nosso catálogo global para começar." delay={0.2} />
                    <FeatureCard icon={BarChart} title="Painel de Controle Inteligente" description="Acompanhe o status dos orçamentos, taxas de aprovação e faturamento para tomar decisões baseadas em dados." delay={0.3} />
                    <FeatureCard icon={Settings} title="Personalização e Marca" description="Adicione seu logo e informações da sua empresa nos orçamentos, passando uma imagem muito mais profissional." delay={0.4} />
                    <FeatureCard icon={Send} title="Envio Fácil" description="Envie propostas profissionais diretamente para o email ou WhatsApp do seu cliente com apenas um clique." delay={0.5} />
                </div>
            </motion.div>
        </div>
    </section>
);

const PricingSection = () => {
    // Plans updated to include Enterprise and match PricingPage
    const plans = [
        {
            name: 'Iniciante',
            price: 'R$0',
            period: '',
            description: 'Perfeito para testar e dar os primeiros passos.',
            icon: Award,
            features: ['5 Orçamentos/mês', '1 Usuário', 'PDF com marca d\'água'],
            cta: 'Começar Grátis',
            highlight: false,
        },
        {
            name: 'Profissional',
            price: 'R$49',
            period: '/mês',
            description: 'Para autônomos e pequenas equipes.',
            icon: Cpu,
            features: ['100 Orçamentos/mês', 'Até 3 Usuários', 'PDF com seu Logo', 'Envio por WhatsApp', 'Suporte via Email'],
            cta: 'Assinar Profissional',
            highlight: true,
        },
        {
            name: 'Business',
            price: 'R$99',
            period: '/mês',
            description: 'Para empresas em crescimento.',
            icon: Gem,
            features: ['Orçamentos Ilimitados', 'Até 10 Usuários', 'PDF com seu Logo', 'IA de Precificação', 'Suporte Prioritário'],
            cta: 'Assinar Business',
            highlight: false,
        },
        {
            name: 'Enterprise',
            price: 'Contato',
            period: '',
            description: 'Soluções sob medida para grandes operações.',
            icon: Building,
            features: ['Tudo do Business', 'Usuários Ilimitados', 'Catálogo 3D (beta)', 'Acesso à API', 'Gerente de Contas'],
            cta: 'Entrar em Contato',
            highlight: false,
        },
    ];

    const extraPackages = [
        { name: 'Pacote 25 Orçamentos', price: 'R$ 19,90' },
        { name: 'Pacote 50 Orçamentos', price: 'R$ 29,90' },
        { name: 'Pacote 100 Orçamentos', price: 'R$ 49,90' },
    ];

    return (
        <section className="py-20 md:py-28 bg-surface border-t border-surface-strong min-h-screen" id="pricing">
            <div className="w-full">
                <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={staggerContainer}>
                    <motion.h2 variants={fadeIn()} className="text-3xl md:text-5xl font-heading font-bold text-center mb-5 text-foreground">
                        Planos Flexíveis para seu Negócio
                    </motion.h2>
                    <motion.div variants={fadeIn(0.05)} className="w-24 h-1 bg-primary mx-auto mb-6 rounded-full"></motion.div>
                    <motion.p variants={fadeIn(0.1)} className="text-lg text-muted-foreground text-center mb-16 max-w-2xl mx-auto">
                        Escolha o plano que melhor se adapta ao seu momento. Sem contratos, cancele quando quiser.
                    </motion.p>
                    <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-8 items-stretch max-w-7xl mx-auto">
                        {plans.map((plan, index) => (
                            <motion.div key={plan.name} variants={fadeIn(index * 0.1)}>
                                <Card className={`flex flex-col h-full bg-background ${plan.highlight ? 'border-primary border-2 shadow-[0_0_30px_rgba(218,105,11,0.15)] relative z-10 transform md:-translate-y-2' : 'border-surface-strong hover:border-primary/50 transition-colors'}`}>
                                    {plan.highlight && (
                                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg whitespace-nowrap">
                                            Mais Popular
                                        </div>
                                    )}
                                    <CardHeader className="text-center border-b border-surface-strong pb-8 pt-8">
                                        <plan.icon className="h-8 w-8 mx-auto mb-4 text-primary" />
                                        <CardTitle className="text-2xl text-foreground justify-center mb-2">{plan.name}</CardTitle>
                                        <CardDescription className="mt-2 h-10 px-2">{plan.description}</CardDescription>
                                        <div className="flex items-baseline justify-center gap-1 mt-4">
                                            <p className="text-4xl font-bold text-foreground">{plan.price}</p>
                                            <span className="text-lg font-normal text-muted-foreground">{plan.period}</span>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="flex-grow pt-8">
                                        <ul className="space-y-4">
                                            {plan.features.map(feature => (
                                                <li key={feature} className="flex items-center gap-3">
                                                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                        <Check className="h-4 w-4 text-primary" />
                                                    </div>
                                                    <span className="text-foreground text-sm text-left">{feature}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                    <div className="p-6 pt-0 mt-auto">
                                        <NavLink to={plan.name === 'Iniciante' || plan.name === 'Profissional' || plan.name === 'Business' ? "/cadastro" : "/#contact"} className="w-full">
                                            <Button size="lg" className="w-full h-[50px] rounded-xl font-bold text-base bg-[#1E1E1E] border border-primary text-white hover:bg-[#2A2A2A] shadow-lg transition-all duration-200">
                                                {plan.cta}
                                            </Button>
                                        </NavLink>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </div>

                    <motion.div variants={fadeIn(0.4)} className="mt-24 text-center bg-background p-8 md:p-12 rounded-2xl border border-surface-strong relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -mr-8 -mt-8"></div>
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/5 rounded-tr-full -ml-8 -mb-8"></div>
                        
                        <h3 className="text-2xl md:text-3xl font-heading font-bold mb-4 text-foreground relative z-10">
                            Acabaram seus orçamentos?
                        </h3>
                        <p className="text-lg text-muted-foreground mb-10 relative z-10">
                            Compre pacotes avulsos para continuar orçando sem precisar mudar de plano.
                        </p>
                        <div className="flex flex-wrap justify-center gap-6 relative z-10">
                            {extraPackages.map(pkg => (
                                <div key={pkg.name} className="bg-surface p-6 rounded-xl border border-surface-strong hover:border-primary transition-all hover:-translate-y-1 hover:shadow-lg min-w-[240px]">
                                    <p className="text-lg font-semibold text-foreground mb-2">{pkg.name}</p>
                                    <p className="text-3xl font-bold text-primary">{pkg.price}</p>
                                    <NavLink to="/cadastro">
                                        <Button size="sm" variant="outline" className="mt-6 w-full border-primary/30 text-primary hover:bg-primary hover:text-white hover:border-primary">
                                            Comprar
                                        </Button>
                                    </NavLink>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
};

const CTASection = () => (
    <section id="contact" className="py-20 md:py-28 bg-background border-t border-surface-strong relative overflow-hidden scroll-mt-28 min-h-screen">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_var(--tw-gradient-stops))] from-primary/10 to-transparent opacity-50"></div>
        <div className="w-full text-center relative z-10">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.5 }} variants={fadeIn()}>
                <div className="mb-8 inline-flex items-center justify-center p-4 bg-surface-strong rounded-full border border-primary/30 shadow-[0_0_20px_rgba(218,105,11,0.15)]">
                    <Hammer className="h-10 w-10 text-primary" />
                </div>
                <h2 className="text-3xl md:text-5xl font-heading font-bold mb-6 text-foreground">
                    Pronto para modernizar sua serralheria?
                </h2>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
                    Junte-se a centenas de profissionais que já estão economizando tempo e aumentando seus lucros com o <span className="text-primary font-semibold">Serrallab</span>.
                </p>
                <NavLink to="/cadastro">
                    <Button size="lg" className="h-[50px] bg-primary hover:bg-primary/90 text-white font-bold text-lg px-12 shadow-[0_0_30px_rgba(218,105,11,0.4)] hover:shadow-[0_0_40px_rgba(218,105,11,0.6)] hover:-translate-y-1 transition-all duration-300 border-2 border-primary rounded-xl">
                        Quero otimizar meu negócio agora!
                    </Button>
                </NavLink>
                <p className="mt-6 text-sm text-muted-foreground flex items-center justify-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-primary" /> Teste grátis de 7 dias. Sem cartão de crédito.
                </p>
            </motion.div>
        </div>
    </section>
);

const LandingPage = () => {
  return (
    <HelmetProvider>
      <div className="bg-background min-h-screen font-body">
        <Helmet>
          <title>Serrallab — Orçamentos Inteligentes para Serralheiros</title>
          <meta name="description" content="Software para serralheiros: crie orçamentos rápidos, gerencie clientes e materiais. Economize horas e aumente seu lucro com o Serrallab." />
        </Helmet>
        <HeroSection />
        <FeaturesSection />
        <PricingSection />
        <CTASection />
      </div>
    </HelmetProvider>
  );
};

export default LandingPage;
