import { supabase } from '@/lib/customSupabaseClient';

/**
 * Creates a Stripe Billing Portal session.
 * @param {string} returnUrl
 */
export async function createBillingPortalSession(returnUrl) {
  const { data, error } = await supabase.functions.invoke('create-billing-portal-session', {
    body: { return_url: returnUrl }
  });

  if (error) {
    throw new Error(error.message || 'Falha ao abrir portal de cobranca');
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data;
}
