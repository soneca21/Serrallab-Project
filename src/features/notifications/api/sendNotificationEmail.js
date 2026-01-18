
import { supabase } from '@/lib/customSupabaseClient';

/**
 * Sends a notification email via Edge Function
 * @param {string} notificationId 
 * @param {string} toEmail 
 * @returns {Promise<{ outbox_id: string, status: string }>}
 */
export async function sendNotificationEmail(notificationId, toEmail) {
  const { data, error } = await supabase.functions.invoke('send-email', {
    body: {
      type: 'notification',
      entity_id: notificationId,
      to_email: toEmail
    }
  });

  if (error) {
    console.error('Edge Function Error:', error);
    throw new Error(error.message || 'Falha ao conectar com serviço de email');
  }

  if (data && data.error) {
    throw new Error(data.error);
  }

  return data;
}
