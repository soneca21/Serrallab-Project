
import { supabase } from '@/lib/customSupabaseClient';

/**
 * Get current user subscription
 * @param {string} userId 
 */
export async function getSubscription(userId) {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching subscription:', error);
  }
  
  return data;
}

/**
 * Get available plans
 */
export async function getPlans() {
  const { data, error } = await supabase
    .from('plans')
    .select('*')
    .order('price', { ascending: true }); // Assuming 'price' based on schema, previous code had price_cents which might be wrong based on schema provided in prompt

  if (error) {
    console.error('Error fetching plans:', error);
    throw error;
  }
  
  return data || [];
}

/**
 * Get user's current plan details
 * @param {string} userId 
 */
export async function getCurrentPlan(userId) {
  // First get subscription to know plan_id
  const sub = await getSubscription(userId);
  
  if (!sub || !['active', 'trialing'].includes(sub.status)) return null;

  const { data, error } = await supabase
    .from('plans')
    .select('*')
    .eq('id', sub.plan_id)
    .maybeSingle();

  if (error) {
    console.error('Error fetching plan details:', error);
    return null;
  }
  
  return data;
}
