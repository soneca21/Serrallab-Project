import { supabase } from '@/lib/customSupabaseClient';

/**
 * Fetch Stripe invoices for current customer.
 */
export async function getInvoices() {
  const { data, error } = await supabase.functions.invoke('list-stripe-invoices');

  if (error) {
    throw new Error(error.message || 'Falha ao carregar faturas');
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data?.invoices || [];
}
