import React, { useState, useEffect, useCallback } from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Search, Building, Star, Clock, Shield, Ban, Users, BarChart2, Settings, DollarSign, PlusCircle, Edit, Trash2, TrendingUp, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/customSupabaseClient';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResponsiveContainer, BarChart, XAxis, YAxis, Tooltip, Legend, Bar, AreaChart, Area } from 'recharts';
import { Switch } from '@/components/ui/switch';
import { motion } from 'framer-motion';

// --- Sub-componentes para cada aba ---

const OverviewTab = () => {
    const { toast } = useToast();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [chartData, setChartData] = useState([]);

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            const { data, error } = await supabase.rpc('get_admin_dashboard_stats');
            if (error) {
                // If RPC fails (e.g. doesn't exist yet), we handle gracefully or show error
                console.error("Stats fetch error:", error);
                // toast({ title: "Erro ao carregar estatísticas", description: error.message, variant: "destructive" });
                setStats({ mrr: 0, activeUsers: 0, newUsers: 0, churnRate: 0, arpu: 0 });
            } else {
                const fetchedStats = data[0] || { mrr: 0, activeUsers: 0, newUsers: 0, churnRate: 0, arpu: 0 };
                setStats(fetchedStats);
                setChartData([
                    { name: 'Jan', Receita: 4000 }, { name: 'Fev', Receita: 3000 },
                    { name: 'Mar', Receita: 5000 }, { name: 'Abr', Receita: 4500 },
                    { name: 'Mai', Receita: 6000 }, { name: 'Jun', Receita: fetchedStats.mrr },
                ]);
            }
            setLoading(false);
        };
        fetchStats();
    }, [toast]);

    if (loading || !stats) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

    const statsCards = [
        { title: "Receita Mensal (MRR)", value: `R$ ${Number(stats.mrr).toFixed(2)}`, icon: DollarSign, trend: "+12%", trendUp: true },
        { title: "Usuários Ativos", value: stats.activeUsers, icon: Users, trend: "+5%", trendUp: true },
        { title: "Novos Usuários", value: stats.newUsers, icon: PlusCircle, trend: "+2", trendUp: true },
        { title: "Churn Rate", value: `${Number(stats.churnRate).toFixed(1)}%`, icon: Activity, trend: "-1%", trendUp: true }, // churn down is good, so trendUp visual logic might need adjustment
    ];

    return (
        <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {statsCards.map((card, index) => (
                    <Card key={index} className="border-l-4 border-l-transparent hover:border-l-primary shadow-sm hover:shadow-md transition-all">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
                            <card.icon className="h-4 w-4 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-foreground">{card.value}</div>
                            <p className="text-xs text-muted-foreground flex items-center mt-1">
                                {card.trendUp ? <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" /> : <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />}
                                <span className={card.trendUp ? "text-green-500" : "text-red-500"}>{card.trend}</span>
                                <span className="ml-1">mês passado</span>
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>
            <div className="grid gap-6 md:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Visão Geral da Receita</CardTitle>
                        <CardDescription>Acompanhamento financeiro semestral.</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <ResponsiveContainer width="100%" height={350}>
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#DA690B" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#DA690B" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value}`} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid #333', borderRadius: '8px' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Area type="monotone" dataKey="Receita" stroke="#DA690B" strokeWidth={2} fillOpacity={1} fill="url(#colorReceita)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                     <CardHeader>
                        <CardTitle>Atividade Recente</CardTitle>
                        <CardDescription>Últimas ações na plataforma.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="flex items-center">
                                    <div className="ml-4 space-y-1">
                                        <p className="text-sm font-medium leading-none text-foreground">Nova assinatura iniciada</p>
                                        <p className="text-sm text-muted-foreground">Usuario {i} assinou o plano Profissional</p>
                                    </div>
                                    <div className="ml-auto font-medium text-xs text-muted-foreground">+2m</div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

const UserManagementTab = () => {
    const { toast } = useToast();
    const [users, setUsers] = useState([]);
    const [plans, setPlans] = useState([]);
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formLoading, setFormLoading] = useState(false);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [usersRes, plansRes, packagesRes] = await Promise.all([
                supabase.rpc('get_users_with_details'),
                supabase.from('plans').select('*'),
                supabase.from('quote_packages').select('*')
            ]);
            
            if (usersRes.error) {
                console.error("Error fetching users:", usersRes.error);
                // toast({ title: 'Erro ao buscar usuários', variant: 'destructive', description: usersRes.error.message });
            } else {
                setUsers(usersRes.data || []);
            }
            
            if (plansRes.error) {
                console.error("Error fetching plans:", plansRes.error);
                // toast({ title: 'Erro ao buscar planos', variant: 'destructive' });
            } else {
                setPlans(plansRes.data || []);
            }
            
            if (packagesRes.error) {
                 console.error("Error fetching packages:", packagesRes.error);
                // toast({ title: 'Erro ao buscar pacotes', variant: 'destructive' });
            } else {
                setPackages(packagesRes.data || []);
            }
        } catch (error) {
            console.error("Unexpected error in fetchData:", error);
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleSaveUser = async ({ userId, planId, packageId, status }) => {
        setFormLoading(true);
        let hasError = false;

        const currentSubscription = users.find(u => u.id === userId)?.subscription_id;

        if (currentSubscription) {
            const { error } = await supabase.from('subscriptions').update({ plan_id: planId, status: status }).eq('id', currentSubscription);
            if (error) {
                toast({ title: 'Erro ao atualizar assinatura', variant: 'destructive', description: error.message });
                hasError = true;
            }
        } else if (planId) {
             const { error } = await supabase.from('subscriptions').insert({
                user_id: userId,
                plan_id: planId,
                status: status,
                current_period_start: new Date().toISOString(),
                current_period_end: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(),
            }).select().single();
             if (error) {
                toast({ title: 'Erro ao criar assinatura', variant: 'destructive', description: error.message });
                hasError = true;
            }
        }

        if (packageId) {
            const pkg = packages.find(p => p.id === packageId);
            if(pkg) {
                const { error } = await supabase.from('user_purchased_packages').insert({ user_id: userId, package_id: packageId, quotes_added: pkg.quote_amount, price_paid: pkg.price, billing_cycle_id: 'manual_admin_add' });
                if (error) {
                    toast({ title: 'Erro ao adicionar pacote', variant: 'destructive', description: error.message });
                    hasError = true;
                }
            }
        }
        
        if (!hasError) toast({ title: 'Dados da conta atualizados com sucesso!' });
        
        await fetchData();
        setFormLoading(false);
        setIsDetailsOpen(false);
    };

    const handleCardClick = (user) => {
        setSelectedUser(user);
        setIsDetailsOpen(true);
    };

    const filteredUsers = users.filter(user =>
        (user.company_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (user.user_email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    const getStatusProps = (status) => {
        switch (status) {
            case 'active': return { Icon: Shield, color: 'text-green-400', bg: 'bg-green-400/10', text: 'Ativo' };
            case 'blocked': return { Icon: Ban, color: 'text-red-500', bg: 'bg-red-500/10', text: 'Bloqueado' };
            default: return { Icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-400/10', text: status || 'Sem Assinatura' };
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <h3 className="text-lg font-medium text-foreground">Gerenciamento de Contas</h3>
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Buscar empresa ou email..." className="pl-9" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
            </div>

            {loading ? <div className="flex justify-center p-12"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div> :
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredUsers.length > 0 ? filteredUsers.map(user => {
                        const statusProps = getStatusProps(user.subscription_status);
                        const planName = plans.find(p => p.id === user.plan_id)?.name;
                        return (
                            <motion.div whileHover={{ y: -4 }} key={user.id}>
                                <Card className="cursor-pointer hover:border-primary transition-colors h-full" onClick={() => handleCardClick(user)}>
                                    <CardHeader className="pb-3">
                                        <div className="flex justify-between items-start">
                                            <div className="bg-surface-strong p-2 rounded-lg">
                                                <Building className="h-5 w-5 text-primary" />
                                            </div>
                                            <span className={`px-2 py-1 rounded text-xs font-semibold ${statusProps.bg} ${statusProps.color} flex items-center gap-1`}>
                                                {statusProps.text}
                                            </span>
                                        </div>
                                        <CardTitle className="mt-3 text-lg truncate">{user.company_name || "Empresa sem nome"}</CardTitle>
                                        <CardDescription className="truncate">{user.user_email}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-surface-strong/50 p-2 rounded">
                                            <Star className="h-4 w-4 text-amber-400" />
                                            <span>Plano: <span className="font-medium text-foreground">{planName || 'N/A'}</span></span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        );
                    }) : <div className="col-span-full text-center text-muted-foreground p-8">Nenhum usuário encontrado.</div>}
                </div>
            }
            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                {selectedUser && <UserDetailsDialog user={selectedUser} plans={plans} packages={packages} onSave={handleSaveUser} onCancel={() => setIsDetailsOpen(false)} isLoading={formLoading} />}
            </Dialog>
        </div>
    );
};

const PlansManagementTab = () => {
    const { toast } = useToast();
    const [plans, setPlans] = useState([]);
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isPlanFormOpen, setPlanFormOpen] = useState(false);
    const [isPackageFormOpen, setPackageFormOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [selectedPackage, setSelectedPackage] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [plansRes, packagesRes] = await Promise.all([
                supabase.from('plans').select('*').order('price', { ascending: true }),
                supabase.from('quote_packages').select('*').order('price', { ascending: true })
            ]);
            
            if (plansRes.error) {
                console.error("Error fetching plans:", plansRes.error);
                // toast({ title: 'Erro ao buscar planos', variant: 'destructive' });
            } else {
                setPlans(plansRes.data || []);
            }

            if (packagesRes.error) {
                console.error("Error fetching packages:", packagesRes.error);
                // toast({ title: 'Erro ao buscar pacotes', variant: 'destructive' });
            } else {
                setPackages(packagesRes.data || []);
            }
        } catch(e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleSavePlan = async (formData) => {
        const { error } = formData.id ? await supabase.from('plans').update(formData).eq('id', formData.id) : await supabase.from('plans').insert(formData);
        if (error) toast({ title: 'Erro ao salvar plano', description: error.message, variant: 'destructive' });
        else { toast({ title: 'Plano salvo!' }); fetchData(); setPlanFormOpen(false); }
    };

    const handleSavePackage = async (formData) => {
        const { error } = formData.id ? await supabase.from('quote_packages').update(formData).eq('id', formData.id) : await supabase.from('quote_packages').insert(formData);
        if (error) toast({ title: 'Erro ao salvar pacote', description: error.message, variant: 'destructive' });
        else { toast({ title: 'Pacote salvo!' }); fetchData(); setPackageFormOpen(false); }
    };

    return (
        <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-4">
                 <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-foreground flex items-center gap-2"><Star className="text-primary h-5 w-5"/> Planos de Assinatura</h3>
                    <Button size="sm" onClick={() => { setSelectedPlan(null); setPlanFormOpen(true); }}><PlusCircle className="mr-2 h-4 w-4" /> Novo</Button>
                </div>
                <div className="grid gap-4">
                    {loading ? <Loader2 className="animate-spin" /> : plans.length > 0 ? plans.map(plan => (
                         <Card key={plan.id} className="overflow-hidden border-l-4 border-l-transparent hover:border-l-primary hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-center p-6">
                                <div>
                                    <h4 className="font-bold text-lg">{plan.name}</h4>
                                    <p className="text-2xl font-bold text-primary mt-1">R$ {plan.price} <span className="text-sm text-muted-foreground font-normal">/mês</span></p>
                                    <p className="text-sm text-muted-foreground mt-2">{plan.quote_limit === 0 ? '∞' : plan.quote_limit} orçamentos • {plan.user_limit} usuários</p>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => { setSelectedPlan(plan); setPlanFormOpen(true); }}><Edit className="h-5 w-5 text-muted-foreground hover:text-primary" /></Button>
                            </div>
                         </Card>
                    )) : <div className="text-muted-foreground text-sm">Nenhum plano cadastrado.</div>}
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-foreground flex items-center gap-2"><TrendingUp className="text-primary h-5 w-5"/> Pacotes Avulsos</h3>
                    <Button size="sm" onClick={() => { setSelectedPackage(null); setPackageFormOpen(true); }}><PlusCircle className="mr-2 h-4 w-4" /> Novo</Button>
                </div>
                <div className="grid gap-4">
                    {loading ? <Loader2 className="animate-spin" /> : packages.length > 0 ? packages.map(pkg => (
                         <Card key={pkg.id} className={`overflow-hidden hover:shadow-md transition-shadow border-l-4 border-l-transparent ${pkg.is_active ? 'hover:border-l-green-500' : 'hover:border-l-gray-500 opacity-60'}`}>
                            <div className="flex justify-between items-center p-6">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-bold text-lg">{pkg.name}</h4>
                                        {!pkg.is_active && <span className="text-xs bg-gray-700 px-2 py-0.5 rounded">Inativo</span>}
                                    </div>
                                    <p className="text-2xl font-bold text-primary mt-1">R$ {pkg.price}</p>
                                    <p className="text-sm text-muted-foreground mt-2">+{pkg.quote_amount} orçamentos extras</p>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => { setSelectedPackage(pkg); setPackageFormOpen(true); }}><Edit className="h-5 w-5 text-muted-foreground hover:text-primary" /></Button>
                            </div>
                         </Card>
                    )) : <div className="text-muted-foreground text-sm">Nenhum pacote cadastrado.</div>}
                </div>
            </div>

            <Dialog open={isPlanFormOpen} onOpenChange={setPlanFormOpen}>
                 <DialogContent><PlanFormDialog plan={selectedPlan} onSave={handleSavePlan} onCancel={() => setPlanFormOpen(false)} /></DialogContent>
            </Dialog>

            <Dialog open={isPackageFormOpen} onOpenChange={setPackageFormOpen}>
                <DialogContent><PackageFormDialog pkg={selectedPackage} onSave={handleSavePackage} onCancel={() => setPackageFormOpen(false)} /></DialogContent>
            </Dialog>
        </div>
    );
};

const BillingTab = () => {
    const { toast } = useToast();
    const handleNotImplemented = () => toast({ title: "Em desenvolvimento", description: "Esta funcionalidade será implementada em breve." });
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-4 border-2 border-dashed border-surface-strong rounded-xl bg-surface/50">
            <div className="bg-primary/10 p-4 rounded-full">
                <DollarSign className="h-12 w-12 text-primary" />
            </div>
            <h3 className="text-2xl font-bold text-foreground">Histórico de Faturamento</h3>
            <p className="text-muted-foreground max-w-md">Visualize todas as transações, faturas e gere relatórios financeiros completos da sua operação SaaS.</p>
            <Button onClick={handleNotImplemented} className="mt-4">Gerar Relatório Demo</Button>
        </div>
    );
};

// --- Componente Principal da Página ---

const SiteManagementPage = () => {
    return (
        <HelmetProvider>
            <Helmet><title>Gestão do Site — Serrallab</title></Helmet>
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-8"
            >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-heading font-bold text-foreground flex items-center gap-2">
                            <Shield className="h-8 w-8 text-primary" />
                            Admin Console
                        </h1>
                        <p className="text-muted-foreground mt-1">Painel de controle mestre do Serrallab SaaS.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                        </span>
                        <span className="text-sm text-green-500 font-medium">Sistema Operacional</span>
                    </div>
                </div>

                <Tabs defaultValue="overview" className="w-full space-y-6">
                    <div className="bg-surface p-1 rounded-lg inline-flex border border-surface-strong">
                        <TabsList className="bg-transparent p-0 h-auto space-x-1">
                            <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-white px-4 py-2 rounded-md transition-all"><BarChart2 className="mr-2 h-4 w-4" />Visão Geral</TabsTrigger>
                            <TabsTrigger value="users" className="data-[state=active]:bg-primary data-[state=active]:text-white px-4 py-2 rounded-md transition-all"><Users className="mr-2 h-4 w-4" />Contas</TabsTrigger>
                            <TabsTrigger value="plans" className="data-[state=active]:bg-primary data-[state=active]:text-white px-4 py-2 rounded-md transition-all"><Settings className="mr-2 h-4 w-4" />Planos & Pacotes</TabsTrigger>
                            <TabsTrigger value="billing" className="data-[state=active]:bg-primary data-[state=active]:text-white px-4 py-2 rounded-md transition-all"><DollarSign className="mr-2 h-4 w-4" />Financeiro</TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="overview" className="mt-0"><OverviewTab /></TabsContent>
                    <TabsContent value="users" className="mt-0"><UserManagementTab /></TabsContent>
                    <TabsContent value="plans" className="mt-0"><PlansManagementTab /></TabsContent>
                    <TabsContent value="billing" className="mt-0"><BillingTab /></TabsContent>
                </Tabs>
            </motion.div>
        </HelmetProvider>
    );
};

// --- Dialogs de Formulário ---

const PlanFormDialog = ({ plan, onSave, onCancel }) => {
    const [formData, setFormData] = useState({ name: '', price: 0, quote_limit: 0, user_limit: 1, features: [] });
    useEffect(() => { if (plan) setFormData(plan) }, [plan]);
    const handleChange = (e) => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));
    const handleSubmit = (e) => { e.preventDefault(); onSave(formData); };
    return (
        <>
            <DialogHeader><DialogTitle>{plan ? 'Editar' : 'Novo'} Plano</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
                <div><Label>Nome do Plano</Label><Input name="name" value={formData.name} onChange={handleChange} /></div>
                <div className="grid grid-cols-2 gap-4">
                    <div><Label>Preço (R$)</Label><Input name="price" type="number" value={formData.price} onChange={handleChange} /></div>
                    <div><Label>Limite Usuários</Label><Input name="user_limit" type="number" value={formData.user_limit} onChange={handleChange} /></div>
                </div>
                <div>
                    <Label>Limite de Orçamentos (0 para ilimitado)</Label>
                    <Input name="quote_limit" type="number" value={formData.quote_limit} onChange={handleChange} />
                </div>
            </form>
            <DialogFooter>
                <Button variant="secondary" onClick={onCancel}>Cancelar</Button>
                <Button onClick={handleSubmit}>Salvar Plano</Button>
            </DialogFooter>
        </>
    );
};

const PackageFormDialog = ({ pkg, onSave, onCancel }) => {
    const [formData, setFormData] = useState({ name: '', price: 0, quote_amount: 0, is_active: true });
    useEffect(() => { if (pkg) setFormData(pkg) }, [pkg]);
    const handleChange = (e) => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));
    const handleSubmit = (e) => { e.preventDefault(); onSave(formData); };
    return (
        <>
            <DialogHeader><DialogTitle>{pkg ? 'Editar' : 'Novo'} Pacote</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
                <div><Label>Nome do Pacote</Label><Input name="name" value={formData.name} onChange={handleChange} /></div>
                <div className="grid grid-cols-2 gap-4">
                    <div><Label>Preço (R$)</Label><Input name="price" type="number" value={formData.price} onChange={handleChange} /></div>
                    <div><Label>Qtd. Orçamentos</Label><Input name="quote_amount" type="number" value={formData.quote_amount} onChange={handleChange} /></div>
                </div>
                <div className="flex items-center space-x-2 bg-surface-strong p-3 rounded-lg"><Switch id="is_active" checked={formData.is_active} onCheckedChange={c => setFormData(p => ({ ...p, is_active: c }))} /><Label htmlFor="is_active">Pacote Ativo (visível para venda)</Label></div>
            </form>
            <DialogFooter>
                <Button variant="secondary" onClick={onCancel}>Cancelar</Button>
                <Button onClick={handleSubmit}>Salvar Pacote</Button>
            </DialogFooter>
        </>
    );
};

const UserDetailsDialog = ({ user, plans, packages, onSave, onCancel, isLoading }) => {
    const [planId, setPlanId] = useState(user?.plan_id || '');
    const [packageId, setPackageId] = useState('');
    const [subscriptionStatus, setSubscriptionStatus] = useState(user?.subscription_status || 'active');
    const [secondaryUsers, setSecondaryUsers] = useState([]);
    const [loadingSecondary, setLoadingSecondary] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        setPlanId(user?.plan_id || '');
        setSubscriptionStatus(user?.subscription_status || 'active');
        const fetchSecondaryUsers = async () => {
            if (!user?.id) return;
            setLoadingSecondary(true);
            const { data, error } = await supabase.from('secondary_users').select('id, email, permission_level').eq('primary_user_id', user.id);
            if (error) {
                 // Silent fail or minimal log
                 console.error("Failed to load secondary users", error);
            }
            else setSecondaryUsers(data || []);
            setLoadingSecondary(false);
        };
        fetchSecondaryUsers();
    }, [user, toast]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({ userId: user.id, planId, packageId, status: subscriptionStatus });
    };

    return (
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="flex items-center gap-2 text-xl"><Building className="text-primary"/> {user?.company_name || "Detalhes da Empresa"}</DialogTitle></DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                <Card>
                    <CardHeader><CardTitle className="text-base">Gerenciar Assinatura</CardTitle></CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div><Label>Plano de Assinatura</Label>
                                <Select value={planId} onValueChange={setPlanId}>
                                    <SelectTrigger><SelectValue placeholder="Selecione um plano" /></SelectTrigger>
                                    <SelectContent>
                                        {plans.map(p => <SelectItem key={p.id} value={p.id}>{p.name} (R${p.price})</SelectItem>)}
                                        {plans.length === 0 && <SelectItem disabled value="no-plans">Nenhum plano cadastrado</SelectItem>}
                                    </SelectContent>
                                </Select>
                            </div>
                             <div><Label>Status da Assinatura</Label>
                                <Select value={subscriptionStatus} onValueChange={setSubscriptionStatus}>
                                    <SelectTrigger><SelectValue placeholder="Selecione um status" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active"><span className="flex items-center text-green-500"><Shield className="mr-2 h-4 w-4"/>Ativo</span></SelectItem>
                                        <SelectItem value="blocked"><span className="flex items-center text-red-500"><Ban className="mr-2 h-4 w-4"/>Bloqueado</span></SelectItem>
                                        <SelectItem value="past_due"><span className="flex items-center text-yellow-500"><Clock className="mr-2 h-4 w-4"/>Pendente</span></SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="pt-4 border-t border-border mt-4">
                                <Label className="mb-2 block text-primary font-semibold">Adicionar Pacote Extra (Manual)</Label>
                                <Select value={packageId} onValueChange={setPackageId}>
                                    <SelectTrigger><SelectValue placeholder="Selecione um pacote para creditar" /></SelectTrigger>
                                    <SelectContent>
                                        {packages.map(p => <SelectItem key={p.id} value={p.id}>{p.name} (+{p.quote_amount} orçamentos)</SelectItem>)}
                                        {packages.length === 0 && <SelectItem disabled value="no-packages">Nenhum pacote disponível</SelectItem>}
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground mt-1">Isso adicionará orçamentos permanentemente à conta do usuário.</p>
                            </div>
                            <Button type="submit" disabled={isLoading} className="w-full mt-4">
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Salvar Alterações
                            </Button>
                        </form>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle className="text-base">Equipe e Acesso</CardTitle></CardHeader>
                    <CardContent>
                        <div className="space-y-2 mb-4">
                             <Label>Email Principal</Label>
                             <div className="p-2 bg-surface-strong rounded text-sm">{user.user_email}</div>
                        </div>
                        <Label className="mb-2 block">Usuários Secundários</Label>
                        {loadingSecondary ? <Loader2 className="h-6 w-6 animate-spin" /> :
                            <div className="border rounded-md overflow-hidden">
                                <Table>
                                    <TableHeader><TableRow><TableHead className="h-8">Email</TableHead><TableHead className="h-8">Permissão</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {secondaryUsers.length > 0 ? secondaryUsers.map(su => (
                                            <TableRow key={su.id}>
                                                <TableCell className="py-2 text-sm">{su.email}</TableCell>
                                                <TableCell className="py-2 text-sm capitalize">{su.permission_level || 'N/A'}</TableCell>
                                            </TableRow>
                                        )) : <TableRow><TableCell colSpan={2} className="text-center py-4 text-muted-foreground text-sm">Nenhum usuário extra.</TableCell></TableRow>}
                                    </TableBody>
                                </Table>
                            </div>
                        }
                    </CardContent>
                </Card>
            </div>
            <DialogFooter><DialogClose asChild><Button type="button" variant="outline" onClick={onCancel}>Fechar</Button></DialogClose></DialogFooter>
        </DialogContent>
    );
};

export default SiteManagementPage;
