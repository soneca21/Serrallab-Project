
import { supabase } from '@/lib/customSupabaseClient';

/**
 * Sends an orcamento email via Edge Function
 * @param {string} orcamentoId 
 * @param {string} toEmail 
 * @returns {Promise<{ outbox_id: string, status: string, message?: string }>}
 */
export async function sendOrcamentoEmail(orcamentoId, toEmail) {
  const { data, error } = await supabase.functions.invoke('send-email', {
    body: {
      type: 'orcamento',
      entity_id: orcamentoId,
      to_email: toEmail
    }
  });

  if (error) {
    console.error('Edge Function Error:', error);
    throw new Error(error.message || 'Falha ao conectar com serviço de email');
  }

  // Edge function might return 200 but contain logic error in body if not handled by throw
  if (data && data.error) {
    throw new Error(data.error);
  }

  return data;
}
