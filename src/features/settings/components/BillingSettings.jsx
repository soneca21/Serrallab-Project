
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import stripePromise from '@/lib/stripe';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, CreditCard, Crown, CheckCircle, PackagePlus, Clock, Download } from 'lucide-react';

const BillingSettings = () => {
    const { user, profile } = useAuth();
    const { toast } = useToast();
    const [subscription, setSubscription] = useState(null);
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            setLoading(true);
            try {
                const { data: subData } = await supabase
                    .from('subscriptions')
                    .select('*, plans(*)')
                    .eq('user_id', user.id)
                    .maybeSingle();
                setSubscription(subData);

                const { data: pkgData } = await supabase
                    .from('quote_packages')
                    .select('*')
                    .eq('is_active', true)
                    .order('price');
                setPackages(pkgData || []);
            } catch (error) {
                console.error("Error fetching billing:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user]);

    const handleManageSubscription = () => {
        toast({ description: "Portal de cliente Stripe será aberto em breve." });
    };

    const handlePurchasePackage = async (pkg) => {
        setIsProcessing(pkg.id);
        if (!profile?.stripe_customer_id) {
            toast({ title: "Configurando pagamentos...", description: "Aguarde um momento e tente novamente.", variant: "warning" });
            setIsProcessing(null);
            return;
        }

        try {
            const { data, error } = await supabase.functions.invoke('create-stripe-checkout', {
                body: { 
                    priceId: pkg.stripe_price_id || pkg.id,
                    userId: user.id,
                    customerId: profile.stripe_customer_id,
                    mode: 'payment',
                    metadata: { package_id: pkg.id, user_id: user.id }
                },
            });

            if (error) throw error;
            const stripe = await stripePromise;
            await stripe.redirectToCheckout({ sessionId: data.id });
        } catch (error) {
            toast({ title: "Erro no checkout", description: error.message, variant: "destructive" });
        } finally {
            setIsProcessing(null);
        }
    };

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

    return (
        <div className="space-y-6">
            <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-surface to-surface-strong relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="flex items-center gap-2 text-2xl mb-1"><Crown className="text-primary" /> Plano Atual</CardTitle>
                            <CardDescription className="text-base">Gerencie sua assinatura e limites.</CardDescription>
                        </div>
                        <Badge variant="outline" className={`text-sm px-3 py-1 ${subscription?.status === 'active' ? 'border-green-500 text-green-500 bg-green-500/10' : 'border-yellow-500 text-yellow-500 bg-yellow-500/10'}`}>
                            {subscription?.status === 'active' ? 'ATIVO' : 'GRATUITO'}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6 relative z-10">
                    <div className="flex flex-col md:flex-row gap-8">
                        <div className="flex-1 space-y-4">
                            <h3 className="text-3xl font-heading font-bold text-white">{subscription?.plans?.name || 'Plano Básico'}</h3>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-gray-300">
                                    <CheckCircle className="h-4 w-4 text-primary" />
                                    <span>Renovação: {subscription ? new Date(subscription.current_period_end).toLocaleDateString() : 'N/A'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-300">
                                    <CreditCard className="h-4 w-4 text-primary" />
                                    <span>Valor: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(subscription?.plans?.price || 0)}/mês</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col gap-3 justify-center min-w-[200px]">
                            <Button onClick={handleManageSubscription} variant="default" className="w-full">Gerenciar Assinatura</Button>
                            <Button variant="outline" className="w-full">Ver Outros Planos</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><PackagePlus className="h-5 w-5 text-primary" /> Pacotes Extras</CardTitle>
                        <CardDescription>Precisa de mais orçamentos este mês?</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {packages.map(pkg => (
                            <div key={pkg.id} className="flex items-center justify-between p-3 rounded-lg border border-surface-strong hover:border-primary/50 transition-colors">
                                <div>
                                    <p className="font-bold text-white">{pkg.name}</p>
                                    <p className="text-sm text-gray-400">+{pkg.quote_amount} orçamentos</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-primary mb-2">R$ {Number(pkg.price).toFixed(2)}</p>
                                    <Button size="sm" variant="secondary" onClick={() => handlePurchasePackage(pkg)} disabled={isProcessing === pkg.id}>
                                        {isProcessing === pkg.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Comprar"}
                                    </Button>
                                </div>
                            </div>
                        ))}
                        {packages.length === 0 && <p className="text-sm text-gray-400 italic">Nenhum pacote disponível.</p>}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5 text-primary" /> Histórico de Faturas</CardTitle>
                        <CardDescription>Últimos pagamentos realizados.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {/* Mock Data for Placeholder */}
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-lg hover:bg-surface-strong/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-surface-strong flex items-center justify-center">
                                            <Download className="h-4 w-4 text-gray-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">Fatura #{2023000 + i}</p>
                                            <p className="text-xs text-muted-foreground">Pago em 10/10/2023</p>
                                        </div>
                                    </div>
                                    <span className="text-sm font-medium text-white">R$ 99,00</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default BillingSettings;
