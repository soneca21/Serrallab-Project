
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { getConnections, createConnection, deleteConnection, UserConnection, testConnection as apiTestConnection } from '../api/connections';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

export const useConnections = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [connections, setConnections] = useState<UserConnection[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchConnections = useCallback(async () => {
        if (!user) return;
        try {
            const data = await getConnections(user.id);
            setConnections(data);
        } catch (error) {
            console.error('Error fetching connections:', error);
            toast({
                title: "Erro",
                description: "Não foi possível carregar as conexões.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    }, [user, toast]);

    useEffect(() => {
        fetchConnections();

        // Realtime subscription
        const subscription = supabase
            .channel('user_connections_changes')
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'user_connections',
                filter: `user_id=eq.${user?.id}`
            }, (payload) => {
                 fetchConnections(); // Refresh on any change
            })
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [fetchConnections, user?.id]);

    const connect = async (type: string, category: 'channel' | 'integration', token: string, credentials?: any) => {
        if (!user) return;
        try {
            // Test first
            await apiTestConnection(type, token);
            
            await createConnection(user.id, type, category, token, credentials);
            
            toast({
                title: "Conectado!",
                description: `${type.charAt(0).toUpperCase() + type.slice(1)} conectado com sucesso.`,
            });
            await fetchConnections();
            return true;
        } catch (error) {
            console.error('Connection error:', error);
            toast({
                title: "Falha na conexão",
                description: error.message || "Verifique suas credenciais e tente novamente.",
                variant: "destructive"
            });
            return false;
        }
    };

    const disconnect = async (id: string) => {
        try {
            await deleteConnection(id);
             toast({
                title: "Desconectado",
                description: "Conexão removida com sucesso.",
            });
            await fetchConnections();
            return true;
        } catch (error) {
            console.error('Disconnection error:', error);
             toast({
                title: "Erro",
                description: "Não foi possível desconectar.",
                variant: "destructive"
            });
            return false;
        }
    };

    return {
        connections,
        loading,
        fetchConnections,
        connect,
        disconnect
    };
};

export default useConnections;
