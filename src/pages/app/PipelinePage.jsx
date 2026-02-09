import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, User, DollarSign, Loader2, Clock, Zap, CheckCircle2, XCircle, AlertCircle, Filter, Settings2, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { updatePipelineStageWithOfflineSupport } from '@/lib/offlineMutations';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip } from 'recharts';
import { SystemStatusChip } from '@/components/SystemStatus';
import AppSectionHeader from '@/components/AppSectionHeader';

const stageMeta = {
  Novo: { color: 'bg-blue-500/10 border-blue-500/20 text-blue-500', icon: AlertCircle },
  Atendimento: { color: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500', icon: Clock },
  Enviado: { color: 'bg-purple-500/10 border-purple-500/20 text-purple-500', icon: Zap },
  'Em Producao': { color: 'bg-orange-500/10 border-orange-500/20 text-orange-500', icon: Zap },
  Entregue: { color: 'bg-teal-500/10 border-teal-500/20 text-teal-500', icon: CheckCircle2 },
  Perdido: { color: 'bg-red-500/10 border-red-500/20 text-red-500', icon: XCircle },
};

const stageAccent = {
  Novo: '#3b82f6',
  Atendimento: '#eab308',
  Enviado: '#a855f7',
  'Em Producao': '#f97316',
  Entregue: '#14b8a6',
  Perdido: '#ef4444',
};

const stageLabels = {
  'Em Producao': 'Em Produção',
};

const statusToStageName = {
  Rascunho: 'Novo',
  Enviado: 'Enviado',
  Aprovado: 'Em Producao',
  'Proposta Aceita': 'Em Producao',
  'Concluído': 'Entregue',
  Concluido: 'Entregue',
  Ganho: 'Entregue',
  Rejeitado: 'Perdido',
};

const PipelinePage = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [quotes, setQuotes] = useState([]);
    const [stages, setStages] = useState([]);
    const [search, setSearch] = useState('');
    const [minValue, setMinValue] = useState('');
    const [maxValue, setMaxValue] = useState('');
    const [isStageModalOpen, setIsStageModalOpen] = useState(false);
    const [stageDrafts, setStageDrafts] = useState([]);
    const [mutationFeedbackByQuote, setMutationFeedbackByQuote] = useState({});

    const fetchData = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        const [stagesRes, ordersRes] = await Promise.all([
            supabase.from('pipeline_stages').select('*').order('order', { ascending: true }),
            supabase.from('orders').select('*, clients(name)').eq('user_id', user.id),
        ]);

        if (stagesRes.error) {
            toast({ title: 'Erro', description: stagesRes.error.message, variant: 'destructive' });
        } else {
            setStages(stagesRes.data || []);
        }

        if (ordersRes.error) {
            toast({ title: 'Erro', description: ordersRes.error.message, variant: 'destructive' });
        } else {
            setQuotes(ordersRes.data || []);
        }
        setLoading(false);
    }, [user, toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleDrop = async (quoteId, newStage) => {
        const quote = quotes.find(q => q.id === quoteId);
        if (!quote) return;
        const stageName = stages.find((stage) => stage.id === newStage)?.name;

        // Optimistic
        setQuotes(prev => prev.map(q => q.id === quoteId ? { ...q, pipeline_stage_id: newStage } : q));

        const result = await updatePipelineStageWithOfflineSupport({
            order_id: quoteId,
            pipeline_stage_id: newStage,
            pipeline_stage_name: stageName,
        });

        setMutationFeedbackByQuote((prev) => ({
            ...prev,
            [quoteId]: result.state,
        }));

        if (result.state === 'failed') {
            toast({ title: 'Erro ao atualizar', variant: 'destructive' });
            setQuotes(prev => prev.map(q => q.id === quoteId ? { ...q, pipeline_stage_id: quote.pipeline_stage_id } : q));
            return;
        }

        if (result.state === 'pending') {
            toast({ title: 'Atualização pendente', description: 'Etapa salva localmente e será sincronizada ao reconectar.' });
        }
    };

    const filteredQuotes = useMemo(() => {
        const term = search.trim().toLowerCase();
        const min = minValue ? Number(minValue) : null;
        const max = maxValue ? Number(maxValue) : null;
        return quotes.filter((q) => {
            const matchesText = term
                ? (q.title || '').toLowerCase().includes(term) ||
                  (q.clients?.name || '').toLowerCase().includes(term)
                : true;
            const value = Number(q.final_price || 0);
            const matchesMin = min !== null ? value >= min : true;
            const matchesMax = max !== null ? value <= max : true;
            return matchesText && matchesMin && matchesMax;
        });
    }, [quotes, search, minValue, maxValue]);

    const groupedQuotes = useMemo(() => {
        const groups = {};
        if (!stages.length) return groups;
        const stageByName = new Map(stages.map((stage) => [stage.name, stage]));
        stages.forEach(s => groups[s.id] = []);
        filteredQuotes.forEach(q => {
            let stageId = q.pipeline_stage_id;
            if (!stageId) {
                const stageName = statusToStageName[q.status] || 'Novo';
                stageId = stageByName.get(stageName)?.id || stages[0]?.id;
            }
            if (!stageId) return;
            if (!groups[stageId]) groups[stageId] = [];
            groups[stageId].push(q);
        });
        return groups;
    }, [filteredQuotes, stages]);

    const performanceData = useMemo(() => {
        return stages.map((stage) => ({
            name: stageLabels[stage.name] || stage.name,
            count: groupedQuotes[stage.id]?.length || 0,
            total: groupedQuotes[stage.id]?.reduce((sum, q) => sum + (Number(q.final_price) || 0), 0) || 0,
        }));
    }, [stages, groupedQuotes]);
    const openStageManager = () => {
        setStageDrafts(stages.map((s) => ({ ...s })));
        setIsStageModalOpen(true);
    };

    const updateDraft = (id, field, value) => {
        setStageDrafts((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
    };

    const addDraftStage = () => {
        const nextOrder = (stageDrafts[stageDrafts.length - 1]?.order || 0) + 1;
        setStageDrafts((prev) => [
            ...prev,
            { id: `tmp-${Date.now()}`, name: 'Nova Etapa', color: '#6366f1', order: nextOrder },
        ]);
    };

    const saveStages = async () => {
        try {
            const payload = stageDrafts.map((s) => ({
                id: s.id && s.id.startsWith('tmp-') ? undefined : s.id,
                name: s.name,
                color: s.color,
                order: Number(s.order) || 0,
            }));
            const { error } = await supabase.from('pipeline_stages').upsert(payload, { onConflict: 'id' });
            if (error) throw error;
            toast({ title: 'Etapas salvas' });
            setIsStageModalOpen(false);
            fetchData();
        } catch (error) {
            toast({ title: 'Erro ao salvar etapas', description: error.message, variant: 'destructive' });
        }
    };

    return (
        <>
        <HelmetProvider>
            <Helmet><title>Pipeline - Serrallab</title></Helmet>
            <div className="h-[calc(100vh-8rem)] flex flex-col min-h-0">
                <AppSectionHeader
                    title="Pipeline"
                    description="Gerencie o fluxo de seus negócios e mova orçamentos entre etapas."
                    actions={
                        <div className="flex items-center gap-3">
                            <Button onClick={() => navigate('/app/orcamentos/novo')} className="rounded-xl">
                                <Plus className="mr-2 h-4 w-4" /> Novo
                            </Button>
                            <Button variant="secondary" onClick={openStageManager} className="rounded-xl">
                                <Settings2 className="mr-2 h-4 w-4" /> Etapas
                            </Button>
                        </div>
                    }
                />
                <div className="mb-6" />
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
                        <div className="bg-surface/60 border border-border/60 rounded-xl p-3 flex flex-col gap-3">
                            <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><Filter className="h-4 w-4" /> Filtros</div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                <div className="md:col-span-2">
                                    <Label className="text-xs">Busca (título ou cliente)</Label>
                                    <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Ex: portão ou joão" className="h-9" />
                                </div>
                                <div>
                                    <Label className="text-xs">Valor min</Label>
                                    <Input type="number" value={minValue} onChange={(e) => setMinValue(e.target.value)} className="h-9" />
                                </div>
                                <div>
                                    <Label className="text-xs">Valor máx</Label>
                                    <Input type="number" value={maxValue} onChange={(e) => setMaxValue(e.target.value)} className="h-9" />
                                </div>
                                <div className="self-end">
                                    <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setMinValue(''); setMaxValue(''); }}>Limpar</Button>
                                </div>
                            </div>
                        </div>
                        <div className="bg-surface/60 border border-border/60 rounded-xl p-3 xl:col-span-2">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><ArrowUpRight className="h-4 w-4 text-primary" /> Desempenho</div>
                                <div className="text-xs text-muted-foreground">Contagem por etapa</div>
                            </div>
                            <div className="h-32">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={performanceData}>
                                        <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                        <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} formatter={(value) => [value, 'Qtde']} />
                                        <Bar dataKey="count" fill="#f97316" radius={[6, 6, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                {loading ? (
                    <div className="flex-1 flex justify-center items-center">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="flex-1 min-h-0">
                        <div className="h-full overflow-x-auto overflow-y-hidden px-2">
                            <div className="grid h-full w-full min-w-full grid-cols-6 gap-3 pb-4">
                                {stages.map(stage => {
                                    const meta = stageMeta[stage.name] || { color: 'bg-surface/50 border-border/30 text-muted-foreground', icon: AlertCircle };
                                    const accentColor = stage.color || stageAccent[stage.name] || '#94a3b8';
                                    const StageIcon = meta.icon;
                                    return (
                                        <div
                                            key={stage.id}
                                            className="min-w-0 bg-surface/30 rounded-xl border border-border/50 flex flex-col h-full min-h-0"
                                            onDragOver={e => e.preventDefault()}
                                            onDrop={e => {
                                                e.preventDefault();
                                                const id = e.dataTransfer.getData('text/plain');
                                                handleDrop(id, stage.id);
                                            }}
                                        >
                                            <div className={cn("p-4 border-b border-border/30 flex items-center justify-between rounded-t-xl bg-surface/50", meta.color)}>
                                                <span className="font-bold text-sm flex items-center gap-2">
                                                    <StageIcon className="h-4 w-4" /> {stageLabels[stage.name] || stage.name}
                                                </span>
                                                <span className="text-xs bg-background/50 px-2 py-0.5 rounded border border-border/20">
                                                    {groupedQuotes[stage.id]?.length || 0}
                                                </span>
                                            </div>
                                            <div className="p-3 space-y-3 flex-1 min-h-0 overflow-y-auto">
                                                <AnimatePresence>
                                                    {groupedQuotes[stage.id]?.map(q => (
                                                        <motion.div
                                                            key={q.id}
                                                            layoutId={q.id}
                                                            initial={{ opacity: 0 }}
                                                            animate={{ opacity: 1 }}
                                                            className="bg-card p-4 rounded-xl border border-surface-strong cursor-grab active:cursor-grabbing hover:border-[var(--stage-color)] hover:shadow-lg transition-all"
                                                            style={{ '--stage-color': accentColor }}
                                                            draggable
                                                            onDragStart={e => e.dataTransfer.setData('text/plain', q.id)}
                                                            onClick={() => navigate(`/app/orcamentos/editar/${q.id}`)}
                                                        >
                                                            <h4 className="font-bold text-sm mb-2 line-clamp-2">{q.title}</h4>
                                                            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                                                <User className="h-3 w-3" /> {q.clients?.name || 'Sem cliente'}
                                                            </div>
                                                            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                                                                <DollarSign className="h-3 w-3" /> R$ {(q.final_price || 0).toFixed(2)}
                                                            </div>
                                                            {mutationFeedbackByQuote[q.id] && (
                                                                <div className="mt-2 text-[11px]">
                                                                    {mutationFeedbackByQuote[q.id] === 'pending' && <SystemStatusChip status="pending" />}
                                                                    {mutationFeedbackByQuote[q.id] === 'synced' && <SystemStatusChip status="synced" />}
                                                                    {mutationFeedbackByQuote[q.id] === 'failed' && <SystemStatusChip status="failed" />}
                                                                </div>
                                                            )}
                                                        </motion.div>
                                                    ))}
                                                </AnimatePresence>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </HelmetProvider>
        <Dialog open={isStageModalOpen} onOpenChange={setIsStageModalOpen}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Gerenciar Etapas</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                    <div className="flex justify-end">
                        <Button variant="outline" size="sm" onClick={addDraftStage}><Plus className="mr-2 h-4 w-4" /> Nova etapa</Button>
                    </div>
                    <div className="border rounded-lg overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Ordem</TableHead>
                                    <TableHead>Nome</TableHead>
                                    <TableHead>Cor</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {stageDrafts.map((stage) => (
                                    <TableRow key={stage.id}>
                                        <TableCell className="w-24">
                                            <Input
                                                type="number"
                                                value={stage.order ?? 0}
                                                onChange={(e) => updateDraft(stage.id, 'order', e.target.value)}
                                                className="h-9"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                value={stage.name}
                                                onChange={(e) => updateDraft(stage.id, 'name', e.target.value)}
                                                className="h-9"
                                            />
                                        </TableCell>
                                        <TableCell className="w-32">
                                            <Input
                                                type="color"
                                                value={stage.color || '#6366f1'}
                                                onChange={(e) => updateDraft(stage.id, 'color', e.target.value)}
                                                className="h-9 p-1"
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="secondary" onClick={() => setIsStageModalOpen(false)}>Cancelar</Button>
                    <Button onClick={saveStages}>Salvar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        </>
    );
};

export default PipelinePage;






