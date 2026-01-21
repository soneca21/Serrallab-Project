import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

type QuoteRecord = {
  id: string;
  title: string;
  total: number;
  status: string;
};

type QuoteSummary = {
  drafts: number;
  sent: number;
  approved: number;
};

export const useSupabaseQuotes = () => {
  const [quotes, setQuotes] = useState<QuoteRecord[]>([]);
  const [summary, setSummary] = useState<QuoteSummary>({ drafts: 0, sent: 0, approved: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let active = true;

    const resolver = async () => {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('id, title, total_cost, status')
          .order('created_at', { ascending: false })
          .limit(10);

        if (!active) return;
        if (error) throw error;

        setQuotes(
          (data ?? []).map((order) => ({
            id: order.id,
            title: order.title ?? 'Orçamento sem título',
            total: order.total_cost ?? 0,
            status: order.status ?? 'Rascunho',
          })),
        );

        const counts = { drafts: 0, sent: 0, approved: 0 };
        (data ?? []).forEach((item) => {
          if (item.status === 'aprovado') counts.approved += 1;
          else if (item.status === 'enviado') counts.sent += 1;
          else counts.drafts += 1;
        });

        setSummary(counts);
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

  return { quotes, summary, loading, error };
};
