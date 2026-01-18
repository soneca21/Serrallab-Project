
import { supabase } from '@/lib/customSupabaseClient';

/**
 * Creates a Stripe Checkout Session for a subscription plan
 * @param {string} planId 
 * @returns {Promise<{checkout_url: string}>}
 */
export async function createCheckoutSession(planId) {
  const { data, error } = await supabase.functions.invoke('create-checkout-session', {
    body: { plan_id: planId }
  });

  if (error) {
    console.error('Checkout API Error:', error);
    throw new Error(error.message || 'Falha ao conectar com o serviço de pagamentos');
  }

  // Handle application-level errors returned in 200 responses if standard for project
  // But edge function returns proper status codes in my implementation
  // However, Supabase invoke helper wraps non-2xx responses in 'error' usually? 
  // Actually invoke returns { data, error } where error is populated on non-2xx if using standard client.
  
  if (data?.error) {
      throw new Error(data.error);
  }

  return data;
}
