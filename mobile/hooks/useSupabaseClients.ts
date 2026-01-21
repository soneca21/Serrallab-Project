import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

type ClientRecord = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  plan: string;
  status: string;
};

export const useSupabaseClients = () => {
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let active = true;

    const resolver = async () => {
      try {
        const { data, error } = await supabase
          .from('customers')
          .select('id, name, email, phone, plan, status')
          .limit(20)
          .order('created_at', { ascending: false });

        if (!active) return;

        if (error) throw error;

        setClients(
          (data ?? []).map((record) => ({
            id: record.id,
            name: record.name,
            email: record.email,
            phone: record.phone,
            plan: record.plan ?? 'Plano não definido',
            status: record.status ?? 'Indefinido',
          })),
        );
      } catch (requestError) {
        if (!active) return;
        setError(requestError as Error);
      } finally {
        if (!active) return;
        setLoading(false);
      }
    };

    resolver();
    return () => {
      active = false;
    };
  }, []);

  return { clients, loading, error };
};
