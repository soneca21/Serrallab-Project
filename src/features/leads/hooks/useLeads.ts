
import { useState, useCallback, useEffect } from 'react';
import { getLeads, deleteLead as apiDeleteLead, resetAutoReply as apiResetAutoReply } from '@/features/leads/api/leads';
import { Lead } from '@/types/leads';
import { useToast } from '@/components/ui/use-toast';

export function useLeads() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [count, setCount] = useState(0);
    const { toast } = useToast();

    const fetchLeads = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const { data, count } = await getLeads();
            setLeads(data);
            setCount(count);
        } catch (err: any) {
            console.error(err);
            setError(err);
            toast({
                variant: 'destructive',
                title: 'Erro ao carregar leads',
                description: err.message
            });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchLeads();
    }, [fetchLeads]);

    const removeLead = async (id: string) => {
        try {
            await apiDeleteLead(id);
            setLeads(prev => prev.filter(l => l.id !== id));
            setCount(prev => prev - 1);
            toast({ title: 'Lead removido com sucesso' });
        } catch (err: any) {
            toast({
                variant: 'destructive',
                title: 'Erro ao remover lead',
                description: err.message
            });
        }
    };

    const resetReply = async (phone: string) => {
        try {
            await apiResetAutoReply(phone);
            toast({ title: 'Auto-resposta resetada para este número' });
        } catch (err: any) {
            toast({
                variant: 'destructive',
                title: 'Erro ao resetar auto-resposta',
                description: err.message
            });
        }
    };

    return {
        leads,
        count,
        isLoading,
        error,
        refetch: fetchLeads,
        removeLead,
        resetReply
    };
}
