import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

type AgendaItem = {
  id: string;
  time: string;
  title: string;
  meta?: string;
};

export const useSupabaseAgenda = () => {
  const [agenda, setAgenda] = useState<AgendaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let active = true;

    const resolver = async () => {
      try {
        const { data, error } = await supabase
          .from('events')
          .select('id, start_time, title, notes')
          .order('start_time', { ascending: true })
          .limit(12);

        if (!active) return;
        if (error) throw error;

        setAgenda(
          (data ?? []).map((event) => ({
            id: event.id,
            time: new Date(event.start_time).toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            }),
            title: event.title ?? 'Evento sem título',
            meta: event.notes ?? '',
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

  return { agenda, loading, error };
};
