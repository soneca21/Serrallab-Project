
import { supabase } from '@/lib/customSupabaseClient';

export async function provisionTenantMessaging(): Promise<{ provider: string, provider_account_sid: string }> {
  const { data, error } = await supabase.functions.invoke('provision-tenant-messaging', {
    body: {},
  });

  if (error) {
    console.error('Provisioning error:', error);
    throw new Error('Falha ao provisionar canais de mensagem.');
  }

  return data;
}
