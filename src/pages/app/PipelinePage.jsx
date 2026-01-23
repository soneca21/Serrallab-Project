import React, { useState, useEffect, useMemo } from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, User, DollarSign, Loader2, Clock, Zap, CheckCircle2, XCircle, AlertCircle, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { useOfflineSync } from '@/hooks/useOfflineSync';

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
  'Em Producao': 'Em Produ\u00e7\u00e3o',
};

const statusToStageName = {
  Rascunho: 'Novo',
  Enviado: 'Enviado',
  Aprovado: 'Em Producao',
  'Proposta Aceita': 'Em Producao',
  'Conclu\u00eddo': 'Entregue',
  Concluido: 'Entregue',
  Ganho: 'Entregue',
  Rejeitado: 'Perdido',
};

const PipelinePage = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();
    const { sync, isSyncing, isOnline } = useOfflineSync();
    const [loading, setLoading] = useState(true);
    const [quotes, setQuotes] = useState([]);
    const [stages, setStages] = useState([]);

    useEffect(() => {
        const fetch = async () => {
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
        };
        fetch();
    }, [user, toast]);

    const handleDrop = async (quoteId, newStage) => {
        const quote = quotes.find(q => q.id === quoteId);
        if (!quote) return;

        // Optimistic
        setQuotes(prev => prev.map(q => q.id === quoteId ? { ...q, pipeline_stage_id: newStage } : q));

        const { error } = await supabase.from('orders').update({ pipeline_stage_id: newStage }).eq('id', quoteId);
        if (error) {
            toast({ title: 'Erro ao atualizar', variant: 'destructive' });
            setQuotes(prev => prev.map(q => q.id === quoteId ? { ...q, pipeline_stage_id: quote.pipeline_stage_id } : q));
        }
    };

    const groupedQuotes = useMemo(() => {
        const groups = {};
        if (!stages.length) return groups;
        const stageByName = new Map(stages.map((stage) => [stage.name, stage]));
        stages.forEach(s => groups[s.id] = []);
        quotes.forEach(q => {
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
    }, [quotes, stages]);

    const handleSync = async () => {
        if (!isOnline) {
            toast({
                title: 'Sem conex\u00e3o',
                description: 'Conecte-se \u00e0 internet para sincronizar a pipeline.',
                variant: 'destructive',
            });
            return;
        }

        try {
            await sync();
            toast({
                title: 'Sincroniza\u00e7\u00e3o conclu\u00edda',
                description: 'Pipeline atualizada com os dados mais recentes.',
            });
        } catch (error) {
            toast({
                title: 'Erro ao sincronizar',
                description: error?.message || 'N\u00e3o foi poss\u00edvel atualizar a pipeline.',
                variant: 'destructive',
            });
        }
    };

    return (
        <HelmetProvider>
            <Helmet><title>Pipeline - Serrallab</title></Helmet>
            <div className="h-[calc(100vh-8rem)] flex flex-col min-h-0">
                <div className="space-y-2 mb-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-3xl font-heading font-bold">Pipeline</h2>
                            <p className="text-muted-foreground">Gerencie o fluxo de seus neg\u00f3cios.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                onClick={handleSync}
                                className="rounded-xl"
                                disabled={isSyncing}
                            >
                                {isSyncing ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <RefreshCcw className="mr-2 h-4 w-4" />
                                )}
                                Sincronizar
                            </Button>
                            <Button onClick={() => navigate('/app/orcamentos/novo')} className="rounded-xl">
                                <Plus className="mr-2 h-4 w-4" /> Novo
                            </Button>
                        </div>
                    </div>
                    <div className="h-px bg-border mb-4" />
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
    );
};

export default PipelinePage;





