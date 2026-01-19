import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { NavLink, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AppSectionHeader from '@/components/AppSectionHeader';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectTrigger,
    SelectContent,
    SelectValue,
    SelectItem,
} from '@/components/ui/select';
import { PlusCircle, Copy, MessageSquare, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
});

const ClienteProfilePage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { toast } = useToast();
    const [client, setClient] = useState(null);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (!id || !user) return;
        const fetch = async () => {
            setLoading(true);
            try {
                const [{ data: clientData, error: clientError }, { data: ordersData, error: ordersError }] = await Promise.all([
                    supabase.from('clients').select('*').eq('id', id).eq('user_id', user.id).single(),
                    supabase
                        .from('orders')
                        .select('id,title,status,total_cost,created_at')
                        .eq('client_id', id)
                        .eq('user_id', user.id)
                        .order('created_at', { ascending: false }),
                ]);

                if (clientError) throw clientError;
                if (ordersError) throw ordersError;

                setClient(clientData);
                setOrders(ordersData || []);
            } catch (error) {
                toast({ title: 'Erro', description: error.message, variant: 'destructive' });
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, [id, user, toast]);

    const totals = useMemo(() => {
        const count = orders.length;
        const sum = orders.reduce((acc, order) => acc + Number(order.total_cost || 0), 0);
        return { count, sum };
    }, [orders]);

    const statusCounts = useMemo(() => {
        return orders.reduce((acc, order) => {
            const key = order.status || 'Sem status';
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});
    }, [orders]);

    const statusOptions = useMemo(() => {
        return Object.keys(statusCounts).sort((a, b) => a.localeCompare(b));
    }, [statusCounts]);

    const approvedOrdersCount = useMemo(() => {
        return orders.filter((order) => /aprovado/i.test(order.status || '')).length;
    }, [orders]);

    const openOrdersCount = useMemo(() => {
        return orders.filter((order) => !/aprovado|cancelado|rejeitado/i.test(order.status || '')).length;
    }, [orders]);

    const filteredOrders = useMemo(() => {
        const normalizedTerm = searchTerm.trim().toLowerCase();
        return orders.filter((order) => {
            const orderStatus = order.status || 'Sem status';
            if (statusFilter !== 'all' && orderStatus !== statusFilter) return false;
            if (dateFilter === '30' || dateFilter === '90') {
                const limit = Number(dateFilter);
                const cutoff = new Date();
                cutoff.setDate(cutoff.getDate() - limit);
                if (new Date(order.created_at) < cutoff) return false;
            }
            if (normalizedTerm && !order.title.toLowerCase().includes(normalizedTerm)) return false;
            return true;
        });
    }, [orders, statusFilter, dateFilter, searchTerm]);

    const handleCopy = async (text, label) => {
        if (!text) return;
        const fallbackCopy = () => {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.setAttribute('readonly', '');
            textarea.style.position = 'absolute';
            textarea.style.left = '-9999px';
            document.body.appendChild(textarea);
            textarea.select();
            const ok = document.execCommand('copy');
            document.body.removeChild(textarea);
            return ok;
        };

        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
            } else if (!fallbackCopy()) {
                throw new Error('fallback_failed');
            }
            toast({ title: 'Copiado', description: `${label} copiado para a \u00e1rea de transfer\u00eancia.` });
        } catch (error) {
            toast({ title: 'Erro', description: 'N\u00e3o foi poss\u00edvel copiar.', variant: 'destructive' });
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <p className="text-sm">Carregando dados do cliente...</p>
                </div>
            </div>
        );
    }

    if (!client) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
                Cliente n&atilde;o encontrado nesta conta.
            </div>
        );
    }

    const sanitizedPhone = client.phone?.replace(/\D/g, '');
    const whatsappUrl = sanitizedPhone ? `https://wa.me/${sanitizedPhone}` : null;

    return (
        <>
            <Helmet>
                <title>{client.name} - Serrallab</title>
            </Helmet>
            <div className="w-full space-y-6">
                <AppSectionHeader
                    title={`Perfil do Cliente > ${client.name}`}
                    description={'Visualize o hist\u00f3rico completo de or\u00e7amentos e contatos para este cliente.'}
                    actions={
                        <div className="flex flex-wrap gap-2">
                            <Button asChild className="rounded-xl">
                                <NavLink to="/app/orcamentos/novo">
                                    <PlusCircle className="mr-2 h-4 w-4" /> Novo Or&ccedil;amento
                                </NavLink>
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => navigate('/app/clientes')}>
                                Voltar
                            </Button>
                        </div>
                    }
                />

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    <Card className="xl:col-span-1">
                        <CardHeader className="space-y-1">
                            <CardTitle className="text-lg font-medium">{client.name}</CardTitle>
                            <CardDescription>Dados do cliente</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6 text-sm">
                            <div className="space-y-2 mt-2">
                                <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">E-mail</p>
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <p className="text-sm font-medium text-foreground break-words">{client.email || 'N\u00e3o informado'}</p>
                                    {client.email && (
                                        <Button variant="outline" size="sm" onClick={() => handleCopy(client.email, 'E-mail')}>
                                            <Copy className="mr-2 h-4 w-4" /> Copiar e-mail
                                        </Button>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Telefone</p>
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <p className="text-sm font-medium text-foreground">{client.phone || 'N\u00e3o informado'}</p>
                                    <div className="flex flex-wrap gap-2">
                                        {client.phone && (
                                            <Button variant="outline" size="sm" onClick={() => handleCopy(client.phone, 'Telefone')}>
                                                <Copy className="mr-2 h-4 w-4" /> Copiar telefone
                                            </Button>
                                        )}
                                        {whatsappUrl && (
                                            <Button asChild variant="outline" size="sm">
                                                <a href={whatsappUrl} target="_blank" rel="noreferrer" className="flex items-center">
                                                    <MessageSquare className="mr-2 h-4 w-4" /> Abrir WhatsApp
                                                </a>
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div>
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Empresa</p>
                                    <p className="text-sm font-medium text-foreground">{client.company || 'N\u00e3o informado'}</p>
                                </div>
                                <div>
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Cargo/Fun&ccedil;&atilde;o</p>
                                    <p className="text-sm font-medium text-foreground">{client.position || 'N\u00e3o informado'}</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Prefer&ecirc;ncia de contato</p>
                                    <Badge variant="outline" className="text-xs uppercase">
                                        {(client.contact_preference || 'email').toUpperCase()}
                                    </Badge>
                                </div>
                                {client.notes && (
                                    <div>
                                        <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Observa&ccedil;&otilde;es</p>
                                        <p className="text-xs text-foreground leading-relaxed mt-1">{client.notes}</p>
                                    </div>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                                <div className="rounded-xl border border-border bg-muted/10 px-3 py-2">
                                    <p>Estado</p>
                                    <p className="text-foreground text-sm mt-1">{client.state || 'N\u00e3o informado'}</p>
                                </div>
                                <div className="rounded-xl border border-border bg-muted/10 px-3 py-2">
                                    <p>Cidade</p>
                                    <p className="text-foreground text-sm mt-1">{client.city || 'N\u00e3o informado'}</p>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Resumo financeiro</p>
                                <div className="grid grid-cols-3 gap-2 text-center">
                                    <div className="rounded-xl border border-border bg-muted/10 px-2 py-2">
                                        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Or&ccedil;amentos</p>
                                        <p className="text-base font-semibold text-foreground">{totals.count}</p>
                                    </div>
                                    <div className="rounded-xl border border-border bg-muted/10 px-2 py-2">
                                        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Aprovados</p>
                                        <p className="text-base font-semibold text-foreground">{approvedOrdersCount}</p>
                                    </div>
                                    <div className="rounded-xl border border-border bg-muted/10 px-2 py-2">
                                        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Em aberto</p>
                                        <p className="text-base font-semibold text-foreground">{openOrdersCount}</p>
                                    </div>
                                </div>
                                <div className="rounded-xl border border-border bg-muted/10 px-2 py-2 text-center">
                                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Valor total</p>
                                    <p className="text-base font-semibold text-primary">{currencyFormatter.format(totals.sum)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="xl:col-span-2">
                        <CardHeader className="space-y-1">
                            <CardTitle>Or&ccedil;amentos</CardTitle>
                            <CardDescription>
                                {totals.count} or&ccedil;amentos cadastrados para este cliente.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 px-4 pb-4 pt-2">
                            <div className="flex flex-wrap gap-3">
                                <div className="flex-1 min-w-[14rem]">
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Buscar por T&iacute;tulo</p>
                                    <Input
                                        value={searchTerm}
                                        onChange={(event) => setSearchTerm(event.target.value)}
                                        placeholder="Ex: Reforma da fachada"
                                        className="rounded-xl"
                                    />
                                </div>
                                <div className="flex-1 min-w-[12rem]">
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Filtrar por status</p>
                                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                                        <SelectTrigger className="rounded-xl">
                                            <SelectValue placeholder="Todos" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todos</SelectItem>
                                            {statusOptions.map((status) => (
                                                <SelectItem key={status} value={status}>
                                                    {status}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex-1 min-w-[12rem]">
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Filtrar por per&iacute;odo</p>
                                    <Select value={dateFilter} onValueChange={setDateFilter}>
                                        <SelectTrigger className="rounded-xl">
                                            <SelectValue placeholder={'Todo o hist\u00f3rico'} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todo o hist&oacute;rico</SelectItem>
                                            <SelectItem value="30">&Uacute;ltimos 30 dias</SelectItem>
                                            <SelectItem value="90">&Uacute;ltimos 90 dias</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="-mx-4 overflow-hidden rounded-xl border border-border bg-surface-variant">
                                <div className="grid grid-cols-[minmax(0,2.6fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] text-xs uppercase tracking-[0.15em] text-muted-foreground bg-surface-strong border-b border-border divide-x divide-border">
                                    <div className="px-6 py-3 text-center">T&iacute;tulo</div>
                                    <div className="px-5 py-3 text-center">Status</div>
                                    <div className="px-5 py-3 text-center">Valor</div>
                                    <div className="px-6 py-3 text-center">Criado em</div>
                                </div>
                                {filteredOrders.length ? (
                                    <div className="divide-y divide-border">
                                        {filteredOrders.map((order) => {
                                            const displayStatus = order.status || 'Sem status';
                                            const badgeVariant = order.status === 'Rascunho' ? 'outline' : 'secondary';
                                            return (
                                                <div
                                                    key={order.id}
                                                    className="grid grid-cols-[minmax(0,2.6fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] text-sm text-foreground divide-x divide-border"
                                                >
                                                    <div className="px-6 py-3">{order.title}</div>
                                                    <div className="px-5 py-3 text-center">
                                                        <Badge variant={badgeVariant}>{displayStatus}</Badge>
                                                    </div>
                                                    <div className="px-5 py-3 text-right">
                                                        {currencyFormatter.format(order.total_cost || 0)}
                                                    </div>
                                                    <div className="px-6 py-3 text-right">
                                                        {new Date(order.created_at).toLocaleDateString('pt-BR')}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="min-h-[160px] py-12 text-center text-sm text-muted-foreground">
                                        Nenhum or&ccedil;amento encontrado.
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
};

export default ClienteProfilePage;





