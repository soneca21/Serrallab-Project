
import { supabase } from '@/lib/customSupabaseClient';

/**
 * Subscribes to realtime notifications for a specific user.
 * @param {string} userId 
 * @param {function} onNotification - Callback for INSERT events
 * @param {function} onUpdate - Callback for UPDATE events (e.g., read status)
 * @returns {object} RealtimeChannel
 */
export const subscribeNotifications = (userId, onNotification, onUpdate) => {
  return supabase
    .channel('public:notifications')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        if (onNotification) onNotification(payload.new);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        if (onUpdate) onUpdate(payload.new);
      }
    )
    .subscribe((status) => {
      console.log(`Notification subscription status: ${status}`);
    });
};
