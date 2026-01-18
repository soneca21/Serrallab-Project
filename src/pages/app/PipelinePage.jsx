import React, { useState, useEffect, useMemo } from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, User, DollarSign, Loader2, Clock, Zap, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

const STAGES = [
  { id: 'Novo', label: 'Novo', color: 'bg-blue-500/10 border-blue-500/20 text-blue-500', icon: AlertCircle },
  { id: 'Atendimento', label: 'Atendimento', color: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500', icon: Clock },
  { id: 'Proposta Enviada', label: 'Enviado', color: 'bg-purple-500/10 border-purple-500/20 text-purple-500', icon: Zap },
  { id: 'Ganho', label: 'Ganho', color: 'bg-green-500/10 border-green-500/20 text-green-500', icon: CheckCircle2 },
  { id: 'Perdido', label: 'Perdido', color: 'bg-red-500/10 border-red-500/20 text-red-500', icon: XCircle },
];

const PipelinePage = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [quotes, setQuotes] = useState([]);

    useEffect(() => {
        const fetch = async () => {
            if (!user) return;
            setLoading(true);
            const { data, error } = await supabase.from('orders').select('*, clients(name)').eq('user_id', user.id);
            if (!error) setQuotes(data || []);
            setLoading(false);
        };
        fetch();
    }, [user]);

    const handleDrop = async (quoteId, newStage) => {
        const quote = quotes.find(q => q.id === quoteId);
        if(!quote) return;
        
        // Optimistic
        setQuotes(prev => prev.map(q => q.id === quoteId ? { ...q, status: newStage } : q));
        
        const { error } = await supabase.from('orders').update({ status: newStage }).eq('id', quoteId);
        if(error) {
            toast({ title: "Erro ao atualizar", variant: "destructive" });
            setQuotes(prev => prev.map(q => q.id === quoteId ? { ...q, status: quote.status } : q));
        }
    };

    const groupedQuotes = useMemo(() => {
        const groups = {};
        STAGES.forEach(s => groups[s.id] = []);
        quotes.forEach(q => {
            const s = STAGES.find(st => st.id === q.status) ? q.status : 'Novo';
            groups[s].push(q);
        });
        return groups;
    }, [quotes]);

    return (
        <HelmetProvider>
            <Helmet><title>Pipeline — Serrallab</title></Helmet>
            <div className="h-[calc(100vh-8rem)] flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-3xl font-heading font-bold">Pipeline</h2>
                        <p className="text-muted-foreground">Gerencie o fluxo de seus negócios.</p>
                    </div>
                    <Button onClick={() => navigate('/app/orcamentos/novo')} className="rounded-xl">
                        <Plus className="mr-2 h-4 w-4" /> Novo
                    </Button>
                </div>

                {loading ? <div className="flex-1 flex justify-center items-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div> : (
                    <div className="flex-1 grid grid-cols-5 gap-4 pb-4">
                        {STAGES.map(stage => (
                            <div 
                                key={stage.id} 
                                className="min-w-0 bg-surface/30 rounded-xl border border-border/50 flex flex-col"
                                onDragOver={e => e.preventDefault()}
                                onDrop={e => {
                                    e.preventDefault();
                                    const id = e.dataTransfer.getData('text/plain');
                                    handleDrop(id, stage.id);
                                }}
                            >
                                <div className={cn("p-4 border-b border-border/30 flex items-center justify-between rounded-t-xl bg-surface/50", stage.color)}>
                                    <span className="font-bold text-sm flex items-center gap-2">
                                        <stage.icon className="h-4 w-4" /> {stage.label}
                                    </span>
                                    <span className="text-xs bg-background/50 px-2 py-0.5 rounded border border-border/20">{groupedQuotes[stage.id]?.length || 0}</span>
                                </div>
                                <div className="p-3 space-y-3 flex-1 overflow-y-auto">
                                    <AnimatePresence>
                                        {groupedQuotes[stage.id]?.map(q => (
                                            <motion.div
                                                key={q.id}
                                                layoutId={q.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="bg-card p-4 rounded-xl border border-surface-strong cursor-grab active:cursor-grabbing hover:border-primary/50 hover:shadow-lg transition-all"
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
                        ))}
                    </div>
                )}
            </div>
        </HelmetProvider>
    );
};

export default PipelinePage;
