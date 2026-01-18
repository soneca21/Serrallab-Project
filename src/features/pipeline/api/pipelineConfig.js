
import { supabase } from '@/lib/customSupabaseClient';

/**
 * Fetches pipeline config for a user
 * @param {string} userId 
 * @returns {Promise<import('@/types/db').PipelineConfig>}
 */
export const getPipelineConfig = async (userId) => {
  const { data, error } = await supabase
    .from('pipeline_config')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 is 'Row not found'
    throw error;
  }

  // Return default if not found
  if (!data) {
    return {
      user_id: userId,
      auto_escalation_enabled: true,
      auto_escalation_days: 7,
      preferences: {
        autoMoveOnSent: true,
        autoMoveOnApproved: true,
        autoMoveOnRejected: true
      }
    };
  }

  return data;
};

/**
 * Upserts pipeline config
 * @param {string} userId 
 * @param {Partial<import('@/types/db').PipelineConfig>} config 
 * @returns {Promise<import('@/types/db').PipelineConfig>}
 */
export const upsertPipelineConfig = async (userId, config) => {
  const { data, error } = await supabase
    .from('pipeline_config')
    .upsert({
      user_id: userId,
      ...config,
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};
