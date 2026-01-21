import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

type NotificationRecord = {
  id: string;
  title: string;
  detail: string;
  timestamp: string;
};

export const useSupabaseNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let active = true;

    const resolver = async () => {
      try {
        const { data, error } = await supabase
          .from('audit')
          .select('id, action, entity, details, created_at')
          .order('created_at', { ascending: false })
          .limit(10);

        if (!active) return;
        if (error) throw error;

        setNotifications(
          (data ?? []).map((record) => ({
            id: record.id,
            title: `${record.action} · ${record.entity}`,
            detail: record.details ?? '',
            timestamp: new Date(record.created_at).toLocaleTimeString('pt-BR'),
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

  return { notifications, loading, error };
};
