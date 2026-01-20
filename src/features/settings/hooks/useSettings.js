
import { useState, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';

export const useSettings = () => {
    const { user, refreshProfile } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    const saveProfile = useCallback(async (data) => {
        if (!user) return;
        setLoading(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update(data)
                .eq('id', user.id);

            if (error) throw error;

            await refreshProfile?.();
            toast({ title: 'Perfil atualizado', description: 'Suas informações foram salvas.' });
            return true;
        } catch (error) {
            console.error('Error saving profile:', error);
            toast({ variant: 'destructive', title: 'Erro', description: error.message });
            return false;
        } finally {
            setLoading(false);
        }
    }, [user, toast, refreshProfile]);

    const saveCompany = useCallback(async (companyId, data) => {
        if (!user || !companyId) return;
        setLoading(true);
        try {
            const { error } = await supabase
                .from('companies')
                .update(data)
                .eq('id', companyId);

            if (error) throw error;

            toast({ title: 'Empresa atualizada', description: 'Informações da empresa salvas com sucesso.' });
            return true;
        } catch (error) {
            console.error('Error saving company:', error);
            toast({ variant: 'destructive', title: 'Erro', description: error.message });
            return false;
        } finally {
            setLoading(false);
        }
    }, [user, toast]);

    const savePreferences = useCallback(async (preferences) => {
        if (!user) return;
        setLoading(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ preferences })
                .eq('id', user.id);

            if (error) throw error;

            await refreshProfile?.();
            toast({ title: 'Preferências salvas', description: 'Suas configurações de notificação foram atualizadas.' });
            return true;
        } catch (error) {
            console.error('Error saving preferences:', error);
            toast({ variant: 'destructive', title: 'Erro', description: error.message });
            return false;
        } finally {
            setLoading(false);
        }
    }, [user, toast, refreshProfile]);

    return {
        loading,
        saveProfile,
        saveCompany,
        savePreferences
    };
};


