import React, { useMemo, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ClipboardList } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

const AuditLogs = () => {
    const { profile, user } = useAuth();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [actionFilter, setActionFilter] = useState('all');
    const [entityFilter, setEntityFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState('30');

    useEffect(() => {
        const fetchLogs = async () => {
            if (!user) {
                setLoading(false);
                return;
            }
            setLoading(true);

            let query = supabase
                .from('audit_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(200);

            if (profile?.company_id) {
                query = query.eq('company_id', profile.company_id);
            } else {
                query = query.eq('user_id', user.id);
            }

            const { data, error } = await query;

            if (error) {
                console.error('Erro ao carregar auditoria:', error);
            } else {
                setLogs(data || []);
            }
            setLoading(false);
        };

        fetchLogs();
    }, [profile, user]);

    const filteredLogs = useMemo(() => {
        const normalized = searchTerm.trim().toLowerCase();
        return logs.filter((log) => {
            if (actionFilter !== 'all' && log.action !== actionFilter) return false;
            if (entityFilter !== 'all' && log.entity !== entityFilter) return false;
            if (dateFilter !== 'all') {
                const cutoff = new Date();
                cutoff.setDate(cutoff.getDate() - Number(dateFilter));
                if (new Date(log.created_at) < cutoff) return false;
            }
            if (!normalized) return true;
            const detailsText = JSON.stringify(log.details || log.metadata || {});
            return (
                String(log.action || '').toLowerCase().includes(normalized) ||
                String(log.entity || '').toLowerCase().includes(normalized) ||
                detailsText.toLowerCase().includes(normalized)
            );
        });
    }, [logs, actionFilter, entityFilter, dateFilter, searchTerm]);

    const summary = useMemo(() => {
        const now = new Date();
        const last7 = logs.filter((log) => new Date(log.created_at) > new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000));
        const deletes = logs.filter((log) => log.action === 'delete');
        return {
            total: logs.length,
            last7: last7.length,
            deletes: deletes.length,
        };
    }, [logs]);

    const formatAction = (action) => ACTION_LABELS[action] || action;
    const formatEntity = (entity) => ENTITY_LABELS[entity] || entity;
    const formatDetails = (details) => {
        if (!details) return '-';
        if (typeof details === 'string') return details;
        try {
            const entries = Object.entries(details);
            if (!entries.length) return '-';
            return entries
                .map(([key, value]) => `${key}: ${String(value).slice(0, 40)}`)
                .join(' | ');
        } catch (err) {
            return '-';
        }
    };

    const uniqueActions = Array.from(new Set(logs.map((log) => log.action).filter(Boolean)));
    const uniqueEntities = Array.from(new Set(logs.map((log) => log.entity).filter(Boolean)));

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ClipboardList className="h-5 w-5 text-primary" /> Auditoria
                </CardTitle>
                <CardDescription>{'Registro de atividades importantes na sua conta.'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 mt-2">
                    <div className="rounded-xl border border-border bg-muted/10 px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Total</p>
                        <p className="text-xl font-semibold text-foreground">{summary.total}</p>
                    </div>
                    <div className="rounded-xl border border-border bg-muted/10 px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{'Últimos 7 dias'}</p>
                        <p className="text-xl font-semibold text-foreground">{summary.last7}</p>
                    </div>
                    <div className="rounded-xl border border-border bg-muted/10 px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{'Exclusões'}</p>
                        <p className="text-xl font-semibold text-foreground">{summary.deletes}</p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-3">
                    <div className="min-w-[12rem] flex-1">
                        <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Buscar</p>
                        <Input
                            placeholder="Ex: cliente, excluir, fornecedor..."
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                            className="rounded-xl"
                        />
                    </div>
                    <div className="min-w-[10rem]">
                        <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{'Ação'}</p>
                        <Select value={actionFilter} onValueChange={setActionFilter}>
                            <SelectTrigger className="rounded-xl">
                                <SelectValue placeholder="Todas" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas</SelectItem>
                                {uniqueActions.map((action) => (
                                    <SelectItem key={action} value={action}>{formatAction(action)}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="min-w-[10rem]">
                        <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Entidade</p>
                        <Select value={entityFilter} onValueChange={setEntityFilter}>
                            <SelectTrigger className="rounded-xl">
                                <SelectValue placeholder="Todas" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas</SelectItem>
                                {uniqueEntities.map((entity) => (
                                    <SelectItem key={entity} value={entity}>{formatEntity(entity)}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="min-w-[10rem]">
                        <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{'Período'}</p>
                        <Select value={dateFilter} onValueChange={setDateFilter}>
                            <SelectTrigger className="rounded-xl">
                                <SelectValue placeholder={'Últimos 30 dias'} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="7">{'Últimos 7 dias'}</SelectItem>
                                <SelectItem value="30">{'Últimos 30 dias'}</SelectItem>
                                <SelectItem value="90">{'Últimos 90 dias'}</SelectItem>
                                <SelectItem value="all">{'Todo o histórico'}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="rounded-md border border-surface-strong overflow-hidden">
                    <Table>
                        <TableHeader className="bg-surface-strong">
                            <TableRow>
                                <TableHead className="text-center">{'Data/Hora'}</TableHead>
                                <TableHead>{'Ação'}</TableHead>
                                <TableHead>Entidade</TableHead>
                                <TableHead>Detalhes</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                                    </TableCell>
                                </TableRow>
                            ) : filteredLogs.length > 0 ? (
                                filteredLogs.map((log) => (
                                    <TableRow key={log.id}>
                                        <TableCell className="text-xs text-center">
                                            {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                                        </TableCell>
                                        <TableCell className="text-xs">
                                            <Badge variant="outline" className="text-[10px] uppercase">
                                                {formatAction(log.action)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-xs">{formatEntity(log.entity)}</TableCell>
                                        <TableCell className="text-xs text-muted-foreground truncate max-w-[320px]">
                                            {formatDetails(log.details || log.metadata)}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                                        {'Nenhum registro de atividade encontrado.'}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
};

export default AuditLogs;
