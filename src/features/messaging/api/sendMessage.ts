
import { supabase } from '@/lib/customSupabaseClient';

export async function sendMessage(channel: 'sms' | 'whatsapp', cliente_id: string, template: string, orcamento_id?: string): Promise<{ outbox_id: string, status: string }> {
  const { data, error } = await supabase.functions.invoke('send-message', {
    body: { channel, cliente_id, template, orcamento_id },
  });

  if (error) {
    console.error('Send message error:', error);
    // You might want to parse error body if structured
    throw new Error(error.message || 'Falha ao enviar mensagem.');
  }

  return data;
}
