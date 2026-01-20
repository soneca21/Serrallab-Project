import React, { useState, useEffect, useCallback } from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Search, Building, Star, Clock, Shield, Ban, Users, BarChart2, Settings, DollarSign, PlusCircle, Edit, Trash2, ArrowUpRight, ArrowDownRight, Activity, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/customSupabaseClient';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResponsiveContainer, XAxis, YAxis, Tooltip, AreaChart, Area } from 'recharts';
import { Switch } from '@/components/ui/switch';
import { motion } from 'framer-motion';

const ACTION_LABELS = {
    create: 'Criado',
    update: 'Atualizado',
    delete: 'Excluído',
    login: 'Login',
    logout: 'Logout',
};

const ENTITY_LABELS = {
    cliente: 'Cliente',
    fornecedor: 'Fornecedor',
    orcamento: 'Orçamento',
    pedido: 'Pedido',
    lead: 'Lead',
    usuario: 'Usuário',
};

const formatCurrency = (value) => {
    const safe = Number(value) || 0;
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(safe);
};

const formatRelativeTime = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const now = new Date();
    const diffMinutes = Math.floor((now - date) / (1000 * 60));
    if (diffMinutes < 1) return 'agora';
    if (diffMinutes < 60) return `+${diffMinutes}m`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `+${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    return `+${diffDays}d`;
};

const formatShortDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('pt-BR');
};

const formatAuditDetails = (details) => {
    if (!details) return '-';
    if (typeof details === 'string') return details;
    if (details.message) return details.message;
    if (details.reason) return details.reason;
    if (details.note) return details.note;
    return JSON.stringify(details);
};

const getStatusProps = (status) => {
    const normalized = (status || '').toLowerCase();
    switch (normalized) {
        case 'active':
            return { Icon: Shield, color: 'text-green-400', bg: 'bg-green-400/10', text: 'Ativo' };
        case 'blocked':
            return { Icon: Ban, color: 'text-red-500', bg: 'bg-red-500/10', text: 'Bloqueado' };
        case 'past_due':
            return { Icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-400/10', text: 'Pendente' };
        default:
            return { Icon: Clock, color: 'text-muted-foreground', bg: 'bg-muted/10', text: 'Sem assinatura' };
    }
};

const buildTrend = (current, previous, decimals = 1, inverse = false) => {
    const safeCurrent = Number.isFinite(current) ? current : 0;
    const safePrevious = Number.isFinite(previous) ? previous : 0;
    if (safePrevious === 0) {
        const up = safeCurrent >= safePrevious;
        return { value: safeCurrent === 0 ? '0%' : '+100%', up: inverse ? !up : up };
    }
    const delta = ((safeCurrent - safePrevious) / Math.abs(safePrevious)) * 100;
    const up = delta >= 0;
    return {
        value: `${delta >= 0 ? '+' : ''}${Math.abs(delta).toFixed(decimals)}%`,
        up: inverse ? !up : up,
    };
};

const buildMonthBuckets = (now) => {
    const months = [];
    for (let i = 5; i >= 0; i -= 1) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = date.toISOString().slice(0, 7);
        months.push({
            key,
            name: date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
            Receita: 0,
        });
    }
    return months;
};

// --- Sub-componentes para cada aba ---

const OverviewTab = () => {
    const { toast } = useToast();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [chartData, setChartData] = useState([]);
    const [activity, setActivity] = useState([]);

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            try {
                const now = new Date();
                const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                const sixMonthsStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);

                const [subscriptionsRes, profilesRes, invoicesRes, activityRes, leadsRes, ordersRes, messagesRes, automationsRes] = await Promise.all([
                    supabase.from('subscriptions').select('status, plan_id, created_at, plans(price)'),
                    supabase.from('profiles').select('id, created_at'),
                    supabase.from('invoices').select('amount, status, created_at').gte('created_at', sixMonthsStart.toISOString()),
                    supabase.from('audit_logs').select('id, action, entity, created_at, details').order('created_at', { ascending: false }).limit(6),
                    supabase.from('leads').select('id, created_at').gte('created_at', prevMonthStart.toISOString()),
                    supabase.from('orders').select('id, created_at').gte('created_at', prevMonthStart.toISOString()),
                    supabase.from('message_outbox').select('id, status, created_at').gte('created_at', prevMonthStart.toISOString()),
                    supabase.from('message_automation_log').select('id, created_at').gte('created_at', prevMonthStart.toISOString()),
                ]);

                if (subscriptionsRes.error) console.error('Erro ao carregar assinaturas:', subscriptionsRes.error);
                if (profilesRes.error) console.error('Erro ao carregar usuários:', profilesRes.error);
                if (invoicesRes.error) console.error('Erro ao carregar faturas:', invoicesRes.error);
                if (activityRes.error) console.error('Erro ao carregar atividades:', activityRes.error);
                if (leadsRes.error) console.error('Erro ao carregar leads:', leadsRes.error);
                if (ordersRes.error) console.error('Erro ao carregar orçamentos:', ordersRes.error);
                if (messagesRes.error) console.error('Erro ao carregar mensagens:', messagesRes.error);
                if (automationsRes.error) console.error('Erro ao carregar automações:', automationsRes.error);

                const profiles = profilesRes.data || [];
                const subscriptions = subscriptionsRes.data || [];
                const invoices = invoicesRes.data || [];

                const activeUsers = profiles.length;
                const newUsersCurrent = profiles.filter((profile) => new Date(profile.created_at) >= monthStart).length;
                const newUsersPrev = profiles.filter((profile) => new Date(profile.created_at) >= prevMonthStart && new Date(profile.created_at) < monthStart).length;

                const churned = subscriptions.filter((sub) => {
                    const status = (sub.status || '').toLowerCase();
                    return ['canceled', 'cancelled', 'past_due', 'blocked', 'inactive'].includes(status);
                }).length;
                const churnRate = subscriptions.length ? (churned / subscriptions.length) * 100 : 0;

                const subscriptionSummary = subscriptions.reduce((acc, sub) => {
                    const status = (sub.status || '').toLowerCase();
                    if (status === 'active') acc.active += 1;
                    else if (status === 'past_due') acc.pastDue += 1;
                    else if (status === 'blocked') acc.blocked += 1;
                    else acc.other += 1;
                    return acc;
                }, { active: 0, pastDue: 0, blocked: 0, other: 0 });

                const billingSummary = invoices.reduce((acc, invoice) => {
                    const status = (invoice.status || '').toLowerCase();
                    if (status === 'paid') acc.paid += 1;
                    else if (status === 'open') acc.open += 1;
                    else if (status === 'failed') acc.failed += 1;
                    acc.totalAmount += Number(invoice.amount) || 0;
                    return acc;
                }, { paid: 0, open: 0, failed: 0, totalAmount: 0 });

                const months = buildMonthBuckets(now);
                invoices.forEach((invoice) => {
                    if (!invoice.created_at) return;
                    const key = invoice.created_at.slice(0, 7);
                    const bucket = months.find((month) => month.key === key);
                    if (bucket) bucket.Receita += Number(invoice.amount) || 0;
                });

                const currentKey = monthStart.toISOString().slice(0, 7);
                const prevKey = prevMonthStart.toISOString().slice(0, 7);
                const currentRevenue = months.find((month) => month.key === currentKey)?.Receita || 0;
                const prevRevenue = months.find((month) => month.key === prevKey)?.Receita || 0;

                const activeUsersPrev = Math.max(activeUsers - newUsersCurrent, 0);

                const leads = leadsRes.data || [];
                const orders = ordersRes.data || [];
                const messages = messagesRes.data || [];
                const automations = automationsRes.data || [];
                const leadsCurrent = leads.filter((lead) => new Date(lead.created_at) >= monthStart).length;
                const leadsPrev = leads.filter((lead) => new Date(lead.created_at) >= prevMonthStart && new Date(lead.created_at) < monthStart).length;

                const ordersCurrent = orders.filter((order) => new Date(order.created_at) >= monthStart).length;
                const ordersPrev = orders.filter((order) => new Date(order.created_at) >= prevMonthStart && new Date(order.created_at) < monthStart).length;
                const messagesCurrent = messages.filter((message) => new Date(message.created_at) >= monthStart).length;
                const messagesPrev = messages.filter((message) => new Date(message.created_at) >= prevMonthStart && new Date(message.created_at) < monthStart).length;
                const automationsCurrent = automations.filter((log) => new Date(log.created_at) >= monthStart).length;
                const automationsPrev = automations.filter((log) => new Date(log.created_at) >= prevMonthStart && new Date(log.created_at) < monthStart).length;

                const arpa = activeUsers > 0 ? currentRevenue / activeUsers : 0;
                const arpaPrev = activeUsersPrev > 0 ? prevRevenue / activeUsersPrev : 0;
                const churnRateSafe = Number.isFinite(churnRate) ? churnRate : 0;
                const churnDivisor = churnRateSafe > 0 ? churnRateSafe / 100 : 0;
                const ltv = churnDivisor > 0 ? arpa / churnDivisor : arpa * 12;
                const ltvPrev = churnDivisor > 0 ? arpaPrev / churnDivisor : arpaPrev * 12;
                const conversionRate = leadsCurrent > 0 ? (newUsersCurrent / leadsCurrent) * 100 : 0;
                const conversionPrev = leadsPrev > 0 ? (newUsersPrev / leadsPrev) * 100 : 0;

                const mrrTrend = buildTrend(currentRevenue, prevRevenue);
                const activeUsersTrend = buildTrend(activeUsers, activeUsersPrev);
                const newUsersTrend = buildTrend(newUsersCurrent, newUsersPrev);
                const churnTrend = buildTrend(churnRate, churnRate, 1, true);
                const arpaTrend = buildTrend(arpa, arpaPrev);
                const ltvTrend = buildTrend(ltv, ltvPrev);
                const conversionTrend = buildTrend(conversionRate, conversionPrev);

                setStats({
                    mrr: currentRevenue,
                    activeUsers,
                    newUsers: newUsersCurrent,
                    churnRate,
                    arpa,
                    ltv,
                    conversionRate,
                    subscriptions: subscriptionSummary,
                    billing: billingSummary,
                    usage: {
                        orders: ordersCurrent,
                        messages: messagesCurrent,
                        automations: automationsCurrent,
                        trends: {
                            orders: buildTrend(ordersCurrent, ordersPrev),
                            messages: buildTrend(messagesCurrent, messagesPrev),
                            automations: buildTrend(automationsCurrent, automationsPrev),
                        },
                    },
                    trends: {
                        mrr: mrrTrend,
                        activeUsers: activeUsersTrend,
                        newUsers: newUsersTrend,
                        churnRate: churnTrend,
                        arpa: arpaTrend,
                        ltv: ltvTrend,
                        conversion: conversionTrend,
                    },
                });
                setChartData(months.map(({ key, ...rest }) => rest));
                setActivity(activityRes.data || []);
            } catch (error) {
                console.error('Erro ao carregar estatísticas:', error);
                toast({
                    title: 'Erro ao carregar estatísticas',
                    description: 'Não foi possível carregar o painel admin.',
                    variant: 'destructive',
                });
                const fallbackMonths = buildMonthBuckets(new Date());
                setStats({
                    mrr: 0,
                    activeUsers: 0,
                    newUsers: 0,
                    churnRate: 0,
                    arpa: 0,
                    ltv: 0,
                    conversionRate: 0,
                    subscriptions: { active: 0, pastDue: 0, blocked: 0, other: 0 },
                    billing: { paid: 0, open: 0, failed: 0, totalAmount: 0 },
                    usage: {
                        orders: 0,
                        messages: 0,
                        automations: 0,
                        trends: {
                            orders: { value: '0%', up: true },
                            messages: { value: '0%', up: true },
                            automations: { value: '0%', up: true },
                        },
                    },
                    trends: {
                        mrr: { value: '0%', up: true },
                        activeUsers: { value: '0%', up: true },
                        newUsers: { value: '0%', up: true },
                        churnRate: { value: '0%', up: true },
                        arpa: { value: '0%', up: true },
                        ltv: { value: '0%', up: true },
                        conversion: { value: '0%', up: true },
                    },
                });
                setChartData(fallbackMonths.map(({ key, ...rest }) => rest));
                setActivity([]);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [toast]);

    if (loading || !stats) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

    const statsCards = [
        { title: 'Receita Mensal (MRR)', value: formatCurrency(stats.mrr), icon: DollarSign, trend: stats.trends.mrr },
        { title: 'Usuários Ativos', value: stats.activeUsers, icon: Users, trend: stats.trends.activeUsers },
        { title: 'Novos Usuários', value: stats.newUsers, icon: PlusCircle, trend: stats.trends.newUsers },
        { title: 'Churn Rate', value: `${Number(stats.churnRate).toFixed(1)}%`, icon: Activity, trend: stats.trends.churnRate },
    ];

    const extraCards = [
        {
            title: 'ARPA (Média por Conta)',
            value: formatCurrency(stats.arpa),
            description: 'Receita média por conta ativa no mês.',
            trend: stats.trends.arpa,
        },
        {
            title: 'LTV Estimado',
            value: formatCurrency(stats.ltv),
            description: 'Estimativa de valor de vida do cliente.',
            trend: stats.trends.ltv,
        },
        {
            title: 'Conversão',
            value: `${Number(stats.conversionRate).toFixed(1)}%`,
            description: 'Leads convertidos em novas contas.',
            trend: stats.trends.conversion,
        },
    ];

    const usageCards = [
        {
            title: 'Orçamentos criados',
            value: stats.usage?.orders ?? 0,
            description: 'Volume do mês atual.',
            trend: stats.usage?.trends?.orders || { value: '0%', up: true },
        },
        {
            title: 'Mensagens enviadas',
            value: stats.usage?.messages ?? 0,
            description: 'WhatsApp e SMS no mês.',
            trend: stats.usage?.trends?.messages || { value: '0%', up: true },
        },
        {
            title: 'Automações executadas',
            value: stats.usage?.automations ?? 0,
            description: 'Regras disparadas no mês.',
            trend: stats.usage?.trends?.automations || { value: '0%', up: true },
        },
    ];

    const subscriptionCards = [
        {
            title: 'Assinaturas ativas',
            value: stats.subscriptions?.active ?? 0,
            description: 'Contas com cobrança ativa.',
            trend: { value: '', up: true },
        },
        {
            title: 'Inadimplentes',
            value: stats.subscriptions?.pastDue ?? 0,
            description: 'Pagamentos pendentes.',
            trend: { value: '', up: false },
        },
        {
            title: 'Bloqueadas',
            value: stats.subscriptions?.blocked ?? 0,
            description: 'Acesso suspenso.',
            trend: { value: '', up: false },
        },
    ];

    const billingCards = [
        {
            title: 'Faturas pagas',
            value: stats.billing?.paid ?? 0,
            description: 'Últimos 6 meses.',
            trend: { value: '', up: true },
        },
        {
            title: 'Em aberto',
            value: stats.billing?.open ?? 0,
            description: 'Aguardando pagamento.',
            trend: { value: '', up: false },
        },
        {
            title: 'Falhas',
            value: stats.billing?.failed ?? 0,
            description: 'Erros de cobrança.',
            trend: { value: '', up: false },
        },
    ];

    const formatActivityTitle = (log) => {
        const action = ACTION_LABELS[log.action] || log.action || 'Atualização';
        const entity = ENTITY_LABELS[log.entity] || log.entity || '';
        return entity ? `${action} ${entity}` : action;
    };

    const formatActivityDescription = (log) => {
        const details = log.details || log.metadata || {};
        if (details.name) return details.name;
        if (details.title) return details.title;
        if (details.email) return details.email;
        return 'Atualização registrada';
    };

    return (
        <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {statsCards.map((card) => (
                    <Card key={card.title} className="border-l-4 border-l-transparent hover:border-l-primary shadow-sm hover:shadow-md transition-all">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
                            <card.icon className="h-4 w-4 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-foreground">{card.value}</div>
                            <p className="text-xs text-muted-foreground flex items-center mt-1">
                                {card.trend.up ? <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" /> : <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />}
                                <span className={card.trend.up ? 'text-green-500' : 'text-red-500'}>{card.trend.value}</span>
                                <span className="ml-1">mês passado</span>
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>
            <div className="grid gap-6 md:grid-cols-3">
                {extraCards.map((card) => (
                    <Card key={card.title} className="border border-surface-strong">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-foreground">{card.value}</div>
                            <p className="text-xs text-muted-foreground flex items-center mt-1">
                                {card.trend.up ? <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" /> : <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />}
                                <span className={card.trend.up ? 'text-green-500' : 'text-red-500'}>{card.trend.value}</span>
                                <span className="ml-1">{card.description}</span>
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>
            <div className="grid gap-6 md:grid-cols-3">
                {usageCards.map((card) => (
                    <Card key={card.title} className="border border-surface-strong">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-foreground">{card.value}</div>
                            <p className="text-xs text-muted-foreground flex items-center mt-1">
                                {card.trend.up ? <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" /> : <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />}
                                <span className={card.trend.up ? 'text-green-500' : 'text-red-500'}>{card.trend.value}</span>
                                <span className="ml-1">{card.description}</span>
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>
            <div className="grid gap-6 md:grid-cols-3">
                {subscriptionCards.map((card) => (
                    <Card key={card.title} className="border border-surface-strong">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-foreground">{card.value}</div>
                            <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
            <div className="grid gap-6 md:grid-cols-3">
                {billingCards.map((card) => (
                    <Card key={card.title} className="border border-surface-strong">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-foreground">{card.value}</div>
                            <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
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
                                        <stop offset="5%" stopColor="#DA690B" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#DA690B" stopOpacity={0} />
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
                            {activity.length > 0 ? (
                                activity.map((log) => (
                                    <div key={log.id} className="flex items-center">
                                        <div className="ml-4 space-y-1">
                                            <p className="text-sm font-medium leading-none text-foreground">{formatActivityTitle(log)}</p>
                                            <p className="text-sm text-muted-foreground">{formatActivityDescription(log)}</p>
                                        </div>
                                        <div className="ml-auto font-medium text-xs text-muted-foreground">{formatRelativeTime(log.created_at)}</div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground">Sem atividades recentes.</p>
                            )}
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
    const [statusLoadingId, setStatusLoadingId] = useState(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [planFilter, setPlanFilter] = useState('all');
    const [sortBy, setSortBy] = useState('name');

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [plansRes, packagesRes, usersRes] = await Promise.all([
                supabase.from('plans').select('*'),
                supabase.from('quote_packages').select('*'),
                supabase.rpc('get_users_with_details'),
            ]);

            if (plansRes.error) console.error('Erro ao buscar planos:', plansRes.error);
            if (packagesRes.error) console.error('Erro ao buscar pacotes:', packagesRes.error);

            setPlans(plansRes.data || []);
            setPackages(packagesRes.data || []);

            if (!usersRes.error && usersRes.data) {
                setUsers(usersRes.data || []);
            } else {
                const [profilesRes, companiesRes, subscriptionsRes] = await Promise.all([
                    supabase.from('profiles').select('id, company_name, email, company_id, created_at'),
                    supabase.from('companies').select('id, name'),
                    supabase.from('subscriptions').select('id, user_id, plan_id, status'),
                ]);

                if (profilesRes.error) console.error('Erro ao buscar perfis:', profilesRes.error);
                if (companiesRes.error) console.error('Erro ao buscar empresas:', companiesRes.error);
                if (subscriptionsRes.error) console.error('Erro ao buscar assinaturas:', subscriptionsRes.error);

                const companiesMap = new Map((companiesRes.data || []).map((company) => [company.id, company]));
                const subscriptionsMap = new Map((subscriptionsRes.data || []).map((sub) => [sub.user_id, sub]));

                const fallbackUsers = (profilesRes.data || []).map((profile) => {
                    const subscription = subscriptionsMap.get(profile.id);
                    const company = companiesMap.get(profile.company_id);
                        return {
                            id: profile.id,
                            company_name: profile.company_name || company?.name || 'Empresa sem nome',
                            user_email: profile.email,
                            created_at: profile.created_at,
                            subscription_status: subscription?.status || 'inactive',
                            subscription_id: subscription?.id || null,
                            plan_id: subscription?.plan_id || null,
                        };
                });

                setUsers(fallbackUsers);
            }
        } catch (error) {
            console.error('Erro inesperado no admin:', error);
            toast({ title: 'Erro ao carregar contas', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleSaveUser = async ({ userId, planId, packageId, status }) => {
        setFormLoading(true);
        let hasError = false;

        const currentSubscription = users.find((user) => user.id === userId)?.subscription_id;

        if (currentSubscription) {
            const updatePayload = { status };
            if (planId) updatePayload.plan_id = planId;
            const { error } = await supabase.from('subscriptions').update(updatePayload).eq('id', currentSubscription);
            if (error) {
                toast({ title: 'Erro ao atualizar assinatura', variant: 'destructive', description: error.message });
                hasError = true;
            }
        } else if (planId) {
            const { error } = await supabase.from('subscriptions').insert({
                user_id: userId,
                plan_id: planId,
                status,
                current_period_start: new Date().toISOString(),
                current_period_end: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(),
            }).select().single();
            if (error) {
                toast({ title: 'Erro ao criar assinatura', variant: 'destructive', description: error.message });
                hasError = true;
            }
        }

        if (packageId) {
            const pkg = packages.find((p) => p.id === packageId);
            if (pkg) {
                const { error } = await supabase.from('user_purchased_packages').insert({
                    user_id: userId,
                    package_id: packageId,
                    quotes_added: pkg.quote_amount,
                    price_paid: pkg.price,
                    billing_cycle_id: 'manual_admin_add',
                });
                if (error) {
                    toast({ title: 'Erro ao adicionar pacote', variant: 'destructive', description: error.message });
                    hasError = true;
                }
            } else {
                toast({ title: 'Pacote não encontrado', variant: 'destructive' });
                hasError = true;
            }
        }

        if (!hasError) toast({ title: 'Dados da conta atualizados com sucesso!' });

        await fetchData();
        setFormLoading(false);
        if (!hasError) setIsDetailsOpen(false);
    };

    const handleQuickStatus = async (event, user, nextStatus) => {
        event.stopPropagation();
        if (!user.subscription_id) {
            toast({ title: 'Conta sem assinatura', description: 'Defina um plano antes de alterar o status.', variant: 'destructive' });
            return;
        }

        setStatusLoadingId(user.id);
        const { error } = await supabase.from('subscriptions').update({ status: nextStatus }).eq('id', user.subscription_id);
        if (error) {
            toast({ title: 'Erro ao atualizar status', description: error.message, variant: 'destructive' });
        } else {
            toast({ title: `Status atualizado para ${nextStatus === 'active' ? 'ativo' : 'bloqueado'}.` });
            await fetchData();
        }
        setStatusLoadingId(null);
    };

    const handleCardClick = (user) => {
        setSelectedUser(user);
        setIsDetailsOpen(true);
    };

    const normalizedSearch = searchTerm.trim().toLowerCase();
    const plansById = new Map(plans.map((plan) => [plan.id, plan]));
    const filteredUsers = users.filter((user) => {
        const matchesSearch =
            (user.company_name?.toLowerCase() || '').includes(normalizedSearch) ||
            (user.user_email?.toLowerCase() || '').includes(normalizedSearch);

        const rawStatus = (user.subscription_status || 'none').toLowerCase();
        const normalizedStatus = rawStatus === 'inactive' ? 'none' : rawStatus;
        const matchesStatus = statusFilter === 'all' ? true : normalizedStatus === statusFilter;

        const matchesPlan = planFilter === 'all'
            ? true
            : user.plan_id === planFilter;

        return matchesSearch && matchesStatus && matchesPlan;
    });

    const sortedUsers = [...filteredUsers].sort((a, b) => {
        if (sortBy === 'status') {
            return (a.subscription_status || '').localeCompare(b.subscription_status || '');
        }
        if (sortBy === 'plan') {
            const planA = plansById.get(a.plan_id)?.name || '';
            const planB = plansById.get(b.plan_id)?.name || '';
            return planA.localeCompare(planB);
        }
        if (sortBy === 'recent') {
            return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        }
        return (a.company_name || '').localeCompare(b.company_name || '');
    });

    const statusCounts = users.reduce((acc, user) => {
        acc.total += 1;
        const status = (user.subscription_status || '').toLowerCase();
        if (status === 'active') acc.active += 1;
        else if (status === 'blocked') acc.blocked += 1;
        else if (status === 'past_due') acc.pastDue += 1;
        else acc.noPlan += 1;
        return acc;
    }, { total: 0, active: 0, blocked: 0, pastDue: 0, noPlan: 0 });

    const clearFilters = () => {
        setSearchTerm('');
        setStatusFilter('all');
        setPlanFilter('all');
        setSortBy('name');
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h3 className="text-lg font-medium text-foreground">Gestão de Assinantes</h3>
                        <p className="text-sm text-muted-foreground">Controle centralizado de planos, status, acessos e saúde da base.</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={fetchData}>
                        Atualizar dados
                    </Button>
                </div>
                <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_200px_220px_180px_auto] items-end">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Buscar empresa ou email..." className="pl-9" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    <div>
                        <Label className="text-xs text-muted-foreground">Status</Label>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Todos os status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos os status</SelectItem>
                                <SelectItem value="active">Ativo</SelectItem>
                                <SelectItem value="blocked">Bloqueado</SelectItem>
                                <SelectItem value="past_due">Pendente</SelectItem>
                                <SelectItem value="none">Sem assinatura</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label className="text-xs text-muted-foreground">Plano</Label>
                        <Select value={planFilter} onValueChange={setPlanFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Todos os planos" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos os planos</SelectItem>
                                {plans.map((plan) => (
                                    <SelectItem key={plan.id} value={plan.id}>{plan.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label className="text-xs text-muted-foreground">Ordenar</Label>
                        <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger>
                                <SelectValue placeholder="Ordenar por" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="name">Nome</SelectItem>
                                <SelectItem value="status">Status</SelectItem>
                                <SelectItem value="plan">Plano</SelectItem>
                                <SelectItem value="recent">Mais recentes</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                        Limpar filtros
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <Card className="border border-surface-strong">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground">Total</CardTitle>
                    </CardHeader>
                    <CardContent className="text-2xl font-bold text-foreground">{statusCounts.total}</CardContent>
                </Card>
                <Card className="border border-surface-strong">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground">Ativos</CardTitle>
                    </CardHeader>
                    <CardContent className="text-2xl font-bold text-foreground">{statusCounts.active}</CardContent>
                </Card>
                <Card className="border border-surface-strong">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground">Bloqueados</CardTitle>
                    </CardHeader>
                    <CardContent className="text-2xl font-bold text-foreground">{statusCounts.blocked}</CardContent>
                </Card>
                <Card className="border border-surface-strong">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground">Pendentes</CardTitle>
                    </CardHeader>
                    <CardContent className="text-2xl font-bold text-foreground">{statusCounts.pastDue}</CardContent>
                </Card>
                <Card className="border border-surface-strong">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground">Sem assinatura</CardTitle>
                    </CardHeader>
                    <CardContent className="text-2xl font-bold text-foreground">{statusCounts.noPlan}</CardContent>
                </Card>
            </div>

            {loading ? (
                <div className="flex justify-center p-12"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sortedUsers.length > 0 ? sortedUsers.map((user) => {
                        const statusProps = getStatusProps(user.subscription_status);
                        const planName = plansById.get(user.plan_id)?.name;
                        const isActive = user.subscription_status === 'active';
                        const nextStatus = isActive ? 'blocked' : 'active';
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
                                        <CardTitle className="mt-3 text-lg truncate">{user.company_name || 'Empresa sem nome'}</CardTitle>
                                        <CardDescription className="truncate">{user.user_email || '-'}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <div className="flex flex-1 items-center gap-2 text-sm text-muted-foreground bg-surface-strong/50 p-2 rounded">
                                                <Star className="h-4 w-4 text-amber-400" />
                                                <span>Plano: <span className="font-medium text-foreground">{planName || 'N/A'}</span></span>
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={(event) => handleQuickStatus(event, user, nextStatus)}
                                                disabled={statusLoadingId === user.id}
                                            >
                                                {statusLoadingId === user.id ? (
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                ) : (
                                                    nextStatus === 'active' ? <Shield className="mr-2 h-4 w-4" /> : <Ban className="mr-2 h-4 w-4" />
                                                )}
                                                {nextStatus === 'active' ? 'Ativar' : 'Bloquear'}
                                            </Button>
                                        </div>
                                        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                                            <span>Criado em</span>
                                            <span className="text-foreground">{formatShortDate(user.created_at)}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        );
                    }) : (
                        <div className="col-span-full text-center text-muted-foreground p-8 space-y-3">
                            <p>Nenhuma conta encontrada com os filtros atuais.</p>
                            <Button variant="outline" size="sm" onClick={clearFilters}>Limpar filtros</Button>
                        </div>
                    )}
                </div>
            )}
            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                {selectedUser && <UserDetailsDialog user={selectedUser} plans={plans} packages={packages} onSave={handleSaveUser} onCancel={() => setIsDetailsOpen(false)} isLoading={formLoading} />}
            </Dialog>
        </div>
    );
};

const ClientsTab = () => {
    const { toast } = useToast();
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [summary, setSummary] = useState({ total: 0, newMonth: 0, withEmail: 0, withPhone: 0 });

    const fetchClients = useCallback(async () => {
        setLoading(true);
        try {
            const [clientsRes, profilesRes] = await Promise.all([
                supabase.from('clients').select('id, name, email, phone, created_at, user_id').order('created_at', { ascending: false }).limit(200),
                supabase.from('profiles').select('id, company_name, email'),
            ]);

            if (clientsRes.error) console.error('Erro ao carregar clientes:', clientsRes.error);
            if (profilesRes.error) console.error('Erro ao carregar perfis:', profilesRes.error);

            const profilesById = new Map((profilesRes.data || []).map((profile) => [profile.id, profile]));
            const normalized = (clientsRes.data || []).map((client) => ({
                ...client,
                owner: profilesById.get(client.user_id),
            }));

            setClients(normalized);

            const monthStart = new Date();
            monthStart.setDate(1);
            const newMonth = normalized.filter((client) => new Date(client.created_at) >= monthStart).length;
            const withEmail = normalized.filter((client) => client.email).length;
            const withPhone = normalized.filter((client) => client.phone).length;
            setSummary({
                total: normalized.length,
                newMonth,
                withEmail,
                withPhone,
            });
        } catch (error) {
            console.error('Erro ao carregar clientes:', error);
            toast({ title: 'Erro ao carregar clientes', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => { fetchClients(); }, [fetchClients]);

    const normalizedSearch = searchTerm.trim().toLowerCase();
    const filteredClients = clients.filter((client) =>
        (client.name?.toLowerCase() || '').includes(normalizedSearch) ||
        (client.email?.toLowerCase() || '').includes(normalizedSearch) ||
        (client.phone?.toLowerCase() || '').includes(normalizedSearch) ||
        (client.owner?.company_name?.toLowerCase() || '').includes(normalizedSearch)
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h3 className="text-lg font-medium text-foreground">Base Global de Clientes</h3>
                    <p className="text-sm text-muted-foreground">Visão consolidada de clientes cadastrados por empresas.</p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchClients}>Atualizar dados</Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="border border-surface-strong">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground">Total</CardTitle>
                    </CardHeader>
                    <CardContent className="text-2xl font-bold text-foreground">{summary.total}</CardContent>
                </Card>
                <Card className="border border-surface-strong">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground">Novos no mês</CardTitle>
                    </CardHeader>
                    <CardContent className="text-2xl font-bold text-foreground">{summary.newMonth}</CardContent>
                </Card>
                <Card className="border border-surface-strong">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground">Com email</CardTitle>
                    </CardHeader>
                    <CardContent className="text-2xl font-bold text-foreground">{summary.withEmail}</CardContent>
                </Card>
                <Card className="border border-surface-strong">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground">Com telefone</CardTitle>
                    </CardHeader>
                    <CardContent className="text-2xl font-bold text-foreground">{summary.withPhone}</CardContent>
                </Card>
            </div>

            <div className="flex items-center gap-3">
                <div className="relative w-full sm:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Buscar por cliente, empresa, email ou telefone..." className="pl-9" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-12"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
            ) : (
                <div className="rounded-md border border-surface-strong overflow-hidden">
                    <Table>
                        <TableHeader className="bg-surface-strong">
                            <TableRow>
                                <TableHead>Cliente</TableHead>
                                <TableHead>Contato</TableHead>
                                <TableHead>Empresa</TableHead>
                                <TableHead className="text-right">Criado em</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredClients.length > 0 ? filteredClients.map((client) => (
                                <TableRow key={client.id}>
                                    <TableCell>
                                        <div className="font-medium text-foreground">{client.name || '-'}</div>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        <div>{client.email || '-'}</div>
                                        <div>{client.phone || '-'}</div>
                                    </TableCell>
                                    <TableCell className="text-sm">{client.owner?.company_name || '-'}</TableCell>
                                    <TableCell className="text-right text-sm text-muted-foreground">{formatShortDate(client.created_at)}</TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                        Nenhum cliente encontrado com os filtros atuais.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            )}
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
                supabase.from('quote_packages').select('*').order('price', { ascending: true }),
            ]);

            if (plansRes.error) console.error('Erro ao buscar planos:', plansRes.error);
            if (packagesRes.error) console.error('Erro ao buscar pacotes:', packagesRes.error);

            setPlans(plansRes.data || []);
            setPackages(packagesRes.data || []);
        } catch (error) {
            console.error('Erro ao carregar planos/pacotes:', error);
        } finally {
            setLoading(false);
        }
    }, []);

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

    const handleDeletePlan = async (plan) => {
        if (!plan?.id) return;
        const confirmed = window.confirm('Tem certeza que deseja excluir este plano?');
        if (!confirmed) return;
        const { error } = await supabase.from('plans').delete().eq('id', plan.id);
        if (error) {
            toast({ title: 'Erro ao excluir plano', description: error.message, variant: 'destructive' });
            return;
        }
        toast({ title: 'Plano excluído com sucesso.' });
        fetchData();
    };

    const handleDeletePackage = async (pkg) => {
        if (!pkg?.id) return;
        const confirmed = window.confirm('Tem certeza que deseja excluir este pacote?');
        if (!confirmed) return;
        const { error } = await supabase.from('quote_packages').delete().eq('id', pkg.id);
        if (error) {
            toast({ title: 'Erro ao excluir pacote', description: error.message, variant: 'destructive' });
            return;
        }
        toast({ title: 'Pacote excluído com sucesso.' });
        fetchData();
    };

    return (
        <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-foreground flex items-center gap-2"><Star className="text-primary h-5 w-5"/> Planos de Assinatura</h3>
                    <Button size="sm" onClick={() => { setSelectedPlan(null); setPlanFormOpen(true); }}><PlusCircle className="mr-2 h-4 w-4" /> Novo</Button>
                </div>
                <div className="grid gap-4">
                    {loading ? <Loader2 className="animate-spin" /> : plans.length > 0 ? plans.map((plan) => (
                        <Card key={plan.id} className="overflow-hidden border-l-4 border-l-transparent hover:border-l-primary hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-center p-6">
                                <div>
                                    <h4 className="font-bold text-lg">{plan.name}</h4>
                                    <p className="text-2xl font-bold text-primary mt-1">R$ {plan.price} <span className="text-sm text-muted-foreground font-normal">/mês</span></p>
                                    <p className="text-sm text-muted-foreground mt-2">{plan.quote_limit === 0 ? 'Ilimitado' : plan.quote_limit} orçamentos • {plan.user_limit} usuários</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="icon" onClick={() => { setSelectedPlan(plan); setPlanFormOpen(true); }}><Edit className="h-5 w-5 text-muted-foreground hover:text-primary" /></Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleDeletePlan(plan)}><Trash2 className="h-5 w-5 text-muted-foreground hover:text-red-500" /></Button>
                                </div>
                            </div>
                        </Card>
                    )) : <div className="text-muted-foreground text-sm">Nenhum plano cadastrado.</div>}
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-foreground flex items-center gap-2"><Activity className="text-primary h-5 w-5"/> Pacotes Avulsos</h3>
                    <Button size="sm" onClick={() => { setSelectedPackage(null); setPackageFormOpen(true); }}><PlusCircle className="mr-2 h-4 w-4" /> Novo</Button>
                </div>
                <div className="grid gap-4">
                    {loading ? <Loader2 className="animate-spin" /> : packages.length > 0 ? packages.map((pkg) => (
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
                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="icon" onClick={() => { setSelectedPackage(pkg); setPackageFormOpen(true); }}><Edit className="h-5 w-5 text-muted-foreground hover:text-primary" /></Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleDeletePackage(pkg)}><Trash2 className="h-5 w-5 text-muted-foreground hover:text-red-500" /></Button>
                                </div>
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
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [monthTotal, setMonthTotal] = useState(0);

    useEffect(() => {
        const fetchInvoices = async () => {
            setLoading(true);
            try {
                const now = new Date();
                const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
                const { data, error } = await supabase
                    .from('invoices')
                    .select('id, amount, status, pdf_url, created_at, companies(name)')
                    .order('created_at', { ascending: false })
                    .limit(30);

                if (error) {
                    console.error('Erro ao carregar faturas:', error);
                    toast({ title: 'Erro ao carregar faturas', variant: 'destructive' });
                    setInvoices([]);
                    setMonthTotal(0);
                    return;
                }

                const list = data || [];
                const total = list
                    .filter((invoice) => invoice.created_at >= monthStart)
                    .reduce((sum, invoice) => sum + (Number(invoice.amount) || 0), 0);

                setInvoices(list);
                setMonthTotal(total);
            } catch (error) {
                console.error('Erro ao carregar faturas:', error);
                toast({ title: 'Erro ao carregar faturas', variant: 'destructive' });
                setInvoices([]);
                setMonthTotal(0);
            } finally {
                setLoading(false);
            }
        };

        fetchInvoices();
    }, [toast]);

    const formatInvoiceStatus = (status) => {
        const normalized = (status || '').toLowerCase();
        if (normalized === 'paid') return 'Pago';
        if (normalized === 'open') return 'Aberto';
        if (normalized === 'failed') return 'Falhou';
        return status || 'Indefinido';
    };

    const paidCount = invoices.filter((invoice) => (invoice.status || '').toLowerCase() === 'paid').length;
    const openCount = invoices.filter((invoice) => (invoice.status || '').toLowerCase() === 'open').length;
    const failedCount = invoices.filter((invoice) => (invoice.status || '').toLowerCase() === 'failed').length;

    return (
        <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <Card className="border-l-4 border-l-primary">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-muted-foreground">Faturamento do mês</CardTitle>
                    </CardHeader>
                    <CardContent className="text-2xl font-bold text-foreground">
                        {formatCurrency(monthTotal)}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-muted-foreground">Faturas emitidas</CardTitle>
                    </CardHeader>
                    <CardContent className="text-2xl font-bold text-foreground">
                        {invoices.length}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-muted-foreground">Pagas</CardTitle>
                    </CardHeader>
                    <CardContent className="text-2xl font-bold text-foreground">
                        {paidCount}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-muted-foreground">Em aberto</CardTitle>
                    </CardHeader>
                    <CardContent className="text-2xl font-bold text-foreground">
                        {openCount}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-muted-foreground">Falhas</CardTitle>
                    </CardHeader>
                    <CardContent className="text-2xl font-bold text-foreground">
                        {failedCount}
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Histórico de Faturamento</CardTitle>
                    <CardDescription>Faturas recentes geradas na plataforma.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                    ) : (
                        <div className="rounded-md border border-surface-strong overflow-hidden">
                            <Table>
                                <TableHeader className="bg-surface-strong">
                                    <TableRow>
                                        <TableHead>Data</TableHead>
                                        <TableHead>Empresa</TableHead>
                                        <TableHead>Valor</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Arquivo</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {invoices.length > 0 ? invoices.map((invoice) => (
                                        <TableRow key={invoice.id}>
                                            <TableCell className="text-xs text-muted-foreground">{new Date(invoice.created_at).toLocaleDateString('pt-BR')}</TableCell>
                                            <TableCell className="text-sm">{invoice.companies?.name || '-'}</TableCell>
                                            <TableCell className="text-sm font-medium">{formatCurrency(invoice.amount)}</TableCell>
                                            <TableCell className="text-sm">{formatInvoiceStatus(invoice.status)}</TableCell>
                                            <TableCell className="text-right">
                                                {invoice.pdf_url ? (
                                                    <Button variant="ghost" size="icon" asChild>
                                                        <a href={invoice.pdf_url} target="_blank" rel="noreferrer">
                                                            <FileText className="h-4 w-4" />
                                                        </a>
                                                    </Button>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                Nenhuma fatura encontrada.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

const AuditTab = () => {
    const { toast } = useToast();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [actionFilter, setActionFilter] = useState('all');
    const [entityFilter, setEntityFilter] = useState('all');

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('audit_logs')
                .select('id, action, entity, created_at, details, user_id')
                .order('created_at', { ascending: false })
                .limit(150);

            if (error) throw error;

            const userIds = (data || []).map((log) => log.user_id).filter(Boolean);
            const { data: profilesData, error: profilesError } = await supabase
                .from('profiles')
                .select('id, email, company_name')
                .in('id', userIds.length ? userIds : ['00000000-0000-0000-0000-000000000000']);

            if (profilesError) console.error('Erro ao carregar perfis do log:', profilesError);

            const profilesById = new Map((profilesData || []).map((profile) => [profile.id, profile]));
            const normalized = (data || []).map((log) => ({
                ...log,
                actor: profilesById.get(log.user_id),
            }));
            setLogs(normalized);
        } catch (error) {
            console.error('Erro ao carregar auditoria:', error);
            toast({ title: 'Erro ao carregar auditoria', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => { fetchLogs(); }, [fetchLogs]);

    const normalizedSearch = searchTerm.trim().toLowerCase();
    const filteredLogs = logs.filter((log) => {
        const actionLabel = ACTION_LABELS[log.action] || log.action || '';
        const entityLabel = ENTITY_LABELS[log.entity] || log.entity || '';
        const details = formatAuditDetails(log.details || '').toLowerCase();
        const actor = `${log.actor?.company_name || ''} ${log.actor?.email || ''}`.toLowerCase();

        const matchesSearch = !normalizedSearch || `${actionLabel} ${entityLabel} ${details} ${actor}`.toLowerCase().includes(normalizedSearch);
        const matchesAction = actionFilter === 'all' ? true : log.action === actionFilter;
        const matchesEntity = entityFilter === 'all' ? true : log.entity === entityFilter;
        return matchesSearch && matchesAction && matchesEntity;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h3 className="text-lg font-medium text-foreground">Auditoria do Sistema</h3>
                    <p className="text-sm text-muted-foreground">Registro de ações administrativas e eventos críticos.</p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchLogs}>Atualizar</Button>
            </div>

            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_200px_220px_auto] items-end">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Buscar por ação, entidade, usuário..." className="pl-9" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <div>
                    <Label className="text-xs text-muted-foreground">Ação</Label>
                    <Select value={actionFilter} onValueChange={setActionFilter}>
                        <SelectTrigger>
                            <SelectValue placeholder="Todas as ações" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas as ações</SelectItem>
                            {Object.entries(ACTION_LABELS).map(([key, label]) => (
                                <SelectItem key={key} value={key}>{label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label className="text-xs text-muted-foreground">Entidade</Label>
                    <Select value={entityFilter} onValueChange={setEntityFilter}>
                        <SelectTrigger>
                            <SelectValue placeholder="Todas as entidades" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas as entidades</SelectItem>
                            {Object.entries(ENTITY_LABELS).map(([key, label]) => (
                                <SelectItem key={key} value={key}>{label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <Button variant="ghost" size="sm" onClick={() => { setSearchTerm(''); setActionFilter('all'); setEntityFilter('all'); }}>
                    Limpar filtros
                </Button>
            </div>

            {loading ? (
                <div className="flex justify-center p-12"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
            ) : (
                <div className="rounded-md border border-surface-strong overflow-hidden">
                    <Table>
                        <TableHeader className="bg-surface-strong">
                            <TableRow>
                                <TableHead>Data/Hora</TableHead>
                                <TableHead>Ação</TableHead>
                                <TableHead>Entidade</TableHead>
                                <TableHead>Usuário</TableHead>
                                <TableHead>Detalhes</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredLogs.length > 0 ? filteredLogs.map((log) => (
                                <TableRow key={log.id}>
                                    <TableCell className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString('pt-BR')}</TableCell>
                                    <TableCell className="text-sm">{ACTION_LABELS[log.action] || log.action}</TableCell>
                                    <TableCell className="text-sm">{ENTITY_LABELS[log.entity] || log.entity}</TableCell>
                                    <TableCell className="text-sm">
                                        <div className="font-medium">{log.actor?.company_name || '-'}</div>
                                        <div className="text-xs text-muted-foreground">{log.actor?.email || '-'}</div>
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">{formatAuditDetails(log.details)}</TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        Nenhum registro encontrado.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    );
};

// --- Componente Principal da Pagina ---

const SiteManagementPage = ({ initialTab = 'overview', hideTabs = false }) => {
    const [activeTab, setActiveTab] = useState(initialTab);

    useEffect(() => {
        setActiveTab(initialTab);
    }, [initialTab]);

    const pageMetaByTab = {
        overview: {
            title: 'Vis\u00e3o Geral',
            description: 'Indicadores do SaaS, receita e opera\u00e7\u00e3o.',
            Icon: BarChart2,
        },
        users: {
            title: 'Contas',
            description: 'Gest\u00e3o de assinaturas, status e limites.',
            Icon: Users,
        },
        clients: {
            title: 'Clientes das Contas',
            description: 'Panorama de clientes finais por empresa.',
            Icon: Building,
        },
        plans: {
            title: 'Planos & Pacotes',
            description: 'Precifica\u00e7\u00e3o, limites e cat\u00e1logo de planos.',
            Icon: Star,
        },
        billing: {
            title: 'Financeiro',
            description: 'Faturas, cobran\u00e7a e sa\u00fade financeira.',
            Icon: DollarSign,
        },
        audit: {
            title: 'Auditoria',
            description: 'Registro de a\u00e7\u00f5es administrativas e eventos.',
            Icon: Activity,
        },
    };
    const pageMeta = pageMetaByTab[activeTab] || pageMetaByTab.overview;
    const HeaderIcon = pageMeta.Icon;

    return (
        <HelmetProvider>
            <Helmet><title>{`${pageMeta.title} - Admin \u2014 Serrallab`}</title></Helmet>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-8"
            >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-heading font-bold text-foreground flex items-center gap-2">
                            <HeaderIcon className="h-8 w-8 text-primary" />
                            {pageMeta.title}
                        </h1>
                        <p className="text-muted-foreground mt-1">{pageMeta.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                        </span>
                        <span className="text-sm text-green-500 font-medium">Sistema Operacional</span>
                    </div>
                </div>
                <div className="h-px bg-border mb-4" />


                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
                    {!hideTabs && (
                    <div className="bg-surface p-1 rounded-lg inline-flex border border-surface-strong">
                        <TabsList className="bg-transparent p-0 h-auto space-x-1">
                            <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-white px-4 py-2 rounded-md transition-all"><BarChart2 className="mr-2 h-4 w-4" />Visão Geral</TabsTrigger>
                            <TabsTrigger value="users" className="data-[state=active]:bg-primary data-[state=active]:text-white px-4 py-2 rounded-md transition-all"><Users className="mr-2 h-4 w-4" />Contas</TabsTrigger>
                            <TabsTrigger value="clients" className="data-[state=active]:bg-primary data-[state=active]:text-white px-4 py-2 rounded-md transition-all"><Users className="mr-2 h-4 w-4" />Clientes</TabsTrigger>
                            <TabsTrigger value="plans" className="data-[state=active]:bg-primary data-[state=active]:text-white px-4 py-2 rounded-md transition-all"><Settings className="mr-2 h-4 w-4" />Planos & Pacotes</TabsTrigger>
                            <TabsTrigger value="billing" className="data-[state=active]:bg-primary data-[state=active]:text-white px-4 py-2 rounded-md transition-all"><DollarSign className="mr-2 h-4 w-4" />Financeiro</TabsTrigger>
                            <TabsTrigger value="audit" className="data-[state=active]:bg-primary data-[state=active]:text-white px-4 py-2 rounded-md transition-all"><Activity className="mr-2 h-4 w-4" />Auditoria</TabsTrigger>
                        </TabsList>
                    </div>
                    )}

                    <TabsContent value="overview" className="mt-0"><OverviewTab /></TabsContent>
                    <TabsContent value="users" className="mt-0"><UserManagementTab /></TabsContent>
                    <TabsContent value="clients" className="mt-0"><ClientsTab /></TabsContent>
                    <TabsContent value="plans" className="mt-0"><PlansManagementTab /></TabsContent>
                    <TabsContent value="billing" className="mt-0"><BillingTab /></TabsContent>
                    <TabsContent value="audit" className="mt-0"><AuditTab /></TabsContent>
                </Tabs>
            </motion.div>
        </HelmetProvider>
    );
};

// --- Dialogs de Formulario ---

const PlanFormDialog = ({ plan, onSave, onCancel }) => {
    const [formData, setFormData] = useState({ name: '', price: 0, quote_limit: 0, user_limit: 1, features: [] });
    useEffect(() => {
        if (plan) {
            setFormData(plan);
        } else {
            setFormData({ name: '', price: 0, quote_limit: 0, user_limit: 1, features: [] });
        }
    }, [plan]);
    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setFormData((prev) => ({ ...prev, [name]: type === 'number' ? Number(value) : value }));
    };
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
    useEffect(() => {
        if (pkg) {
            setFormData(pkg);
        } else {
            setFormData({ name: '', price: 0, quote_amount: 0, is_active: true });
        }
    }, [pkg]);
    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setFormData((prev) => ({ ...prev, [name]: type === 'number' ? Number(value) : value }));
    };
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
                <div className="flex items-center space-x-2 bg-surface-strong p-3 rounded-lg">
                    <Switch id="is_active" checked={formData.is_active} onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_active: checked }))} />
                    <Label htmlFor="is_active">Pacote Ativo (visível para venda)</Label>
                </div>
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
    const [userMetrics, setUserMetrics] = useState({ clients: 0, orders: 0, leads: 0, messages: 0 });
    const { toast } = useToast();
    const statusProps = getStatusProps(subscriptionStatus);
    const planName = plans.find((plan) => plan.id === (planId || user?.plan_id))?.name || 'Sem plano';

    useEffect(() => {
        setPlanId(user?.plan_id || '');
        setPackageId('');
        setSubscriptionStatus(user?.subscription_status || 'active');
        const fetchSecondaryUsers = async () => {
            if (!user?.id) return;
            setLoadingSecondary(true);
            const { data, error } = await supabase.from('secondary_users').select('id, email, permission_level').eq('primary_user_id', user.id);
            if (error) {
                console.error('Falha ao carregar usuários secundários', error);
            } else {
                setSecondaryUsers(data || []);
            }
            setLoadingSecondary(false);
        };
        fetchSecondaryUsers();

        const fetchUserMetrics = async () => {
            if (!user?.id) return;
            const [clientsRes, ordersRes, leadsRes, messagesRes] = await Promise.all([
                supabase.from('clients').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
                supabase.from('orders').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
                supabase.from('leads').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
                supabase.from('message_outbox').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
            ]);

            setUserMetrics({
                clients: clientsRes.count || 0,
                orders: ordersRes.count || 0,
                leads: leadsRes.count || 0,
                messages: messagesRes.count || 0,
            });
        };
        fetchUserMetrics();
    }, [user, toast]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({ userId: user.id, planId, packageId, status: subscriptionStatus });
    };

    return (
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="flex items-center gap-2 text-xl"><Building className="text-primary"/> {user?.company_name || 'Detalhes da Empresa'}</DialogTitle></DialogHeader>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 py-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Resumo da Conta</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <div className="flex items-center justify-between gap-3">
                            <span className="text-muted-foreground">Empresa</span>
                            <span className="font-medium text-foreground">{user?.company_name || '-'}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                            <span className="text-muted-foreground">Email</span>
                            <span className="font-medium text-foreground">{user?.user_email || '-'}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                            <span className="text-muted-foreground">Plano</span>
                            <span className="font-medium text-foreground">{planName}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                            <span className="text-muted-foreground">Status</span>
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${statusProps.bg} ${statusProps.color}`}>
                                {statusProps.text}
                            </span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                            <span className="text-muted-foreground">Criado em</span>
                            <span className="font-medium text-foreground">{formatShortDate(user?.created_at)}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <div className="rounded bg-surface-strong/60 p-2">
                                <div className="text-xs text-muted-foreground">Clientes</div>
                                <div className="text-base font-semibold text-foreground">{userMetrics.clients}</div>
                            </div>
                            <div className="rounded bg-surface-strong/60 p-2">
                                <div className="text-xs text-muted-foreground">Orçamentos</div>
                                <div className="text-base font-semibold text-foreground">{userMetrics.orders}</div>
                            </div>
                            <div className="rounded bg-surface-strong/60 p-2">
                                <div className="text-xs text-muted-foreground">Leads</div>
                                <div className="text-base font-semibold text-foreground">{userMetrics.leads}</div>
                            </div>
                            <div className="rounded bg-surface-strong/60 p-2">
                                <div className="text-xs text-muted-foreground">Mensagens</div>
                                <div className="text-base font-semibold text-foreground">{userMetrics.messages}</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle className="text-base">Gerenciar Assinatura</CardTitle></CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label>Plano de Assinatura</Label>
                                <Select value={planId} onValueChange={setPlanId}>
                                    <SelectTrigger><SelectValue placeholder="Selecione um plano" /></SelectTrigger>
                                    <SelectContent>
                                        {plans.map((plan) => <SelectItem key={plan.id} value={plan.id}>{plan.name} (R${plan.price})</SelectItem>)}
                                        {plans.length === 0 && <SelectItem disabled value="no-plans">Nenhum plano cadastrado</SelectItem>}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Status da Assinatura</Label>
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
                                        {packages.map((pkg) => <SelectItem key={pkg.id} value={pkg.id}>{pkg.name} (+{pkg.quote_amount} orçamentos)</SelectItem>)}
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
                        {loadingSecondary ? <Loader2 className="h-6 w-6 animate-spin" /> : (
                            <div className="border rounded-md overflow-hidden">
                                <Table>
                                    <TableHeader><TableRow><TableHead className="h-8">Email</TableHead><TableHead className="h-8">Permissão</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {secondaryUsers.length > 0 ? secondaryUsers.map((secondary) => (
                                            <TableRow key={secondary.id}>
                                                <TableCell className="py-2 text-sm">{secondary.email}</TableCell>
                                                <TableCell className="py-2 text-sm capitalize">{secondary.permission_level || 'N/A'}</TableCell>
                                            </TableRow>
                                        )) : <TableRow><TableCell colSpan={2} className="text-center py-4 text-muted-foreground text-sm">Nenhum usuário extra.</TableCell></TableRow>}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
            <DialogFooter><DialogClose asChild><Button type="button" variant="outline" onClick={onCancel}>Fechar</Button></DialogClose></DialogFooter>
        </DialogContent>
    );
};

export default SiteManagementPage;

