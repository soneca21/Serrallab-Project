
import { supabase } from '@/lib/customSupabaseClient';

/**
 * Subscribes to realtime pipeline changes (orders table) for a specific user.
 * @param {string} userId 
 * @param {function} onPipelineChange 
 * @returns {object} RealtimeChannel
 */
export const subscribePipeline = (userId, onPipelineChange) => {
  return supabase
    .channel('public:orders_pipeline')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        // We are interested if status changed
        if (payload.old.status !== payload.new.status) {
          if (onPipelineChange) {
            onPipelineChange({
              id: payload.new.id,
              oldStatus: payload.old.status,
              newStatus: payload.new.status,
              data: payload.new
            });
          }
        }
      }
    )
    .subscribe((status) => {
        console.log(`Pipeline subscription status: ${status}`);
    });
};
