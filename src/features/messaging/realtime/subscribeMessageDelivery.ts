
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/customSupabaseClient';
import { DeliveryChange } from '@/lib/messaging';

export function subscribeMessageDelivery(
  userId: string, 
  onDeliveryChange: (change: DeliveryChange) => void
): RealtimeChannel {
  return supabase
    .channel('message_delivery_updates')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'message_outbox',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        const { id, delivery_status, delivery_status_updated_at, delivery_error_code, delivery_error_details } = payload.new;
        onDeliveryChange({
          outbox_id: id,
          delivery_status,
          delivery_status_updated_at,
          delivery_error_code,
          delivery_error_details,
        });
      }
    )
    .subscribe();
}
