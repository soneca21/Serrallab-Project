
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

export async function checkPlanLimits(
  supabase: SupabaseClient,
  userId: string,
  feature: string
): Promise<{ allowed: boolean; error?: string }> {
  try {
    // Get user's subscription and plan
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*, plans(*)')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    if (!subscription) {
      // Check for free tier or default limits if no active subscription
      // For now, we'll assume basic limits for non-subscribers
      return { allowed: true } 
    }

    const plan = subscription.plans
    if (!plan || !plan.features) {
      return { allowed: true }
    }

    const limits = plan.features as Record<string, any>
    
    // Check specific feature limits
    if (feature === 'messages_per_month') {
      const limit = limits.messages_per_month || 100
      // Here we would check usage against limit
      // For now returning true as usage tracking is separate
      return { allowed: true }
    }

    return { allowed: true }
  } catch (error) {
    console.error('Plan guard error:', error)
    // Fail closed for security/limits
    return { allowed: false, error: 'Failed to verify plan limits' }
  }
}
