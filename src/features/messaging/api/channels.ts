
import { supabase } from '@/lib/customSupabaseClient';

export interface ContactChannel {
  id: string;
  user_id: string;
  cliente_id: string;
  type: 'sms' | 'whatsapp';
  value_e164: string;
  verified: boolean;
  created_at: string;
}

export interface SenderChannel {
  id: string;
  user_id: string;
  type: 'sms' | 'whatsapp';
  provider: string;
  from_value: string;
  status: 'pending' | 'active' | 'blocked';
  created_at: string;
}

export async function getContactChannels(cliente_id: string): Promise<ContactChannel[]> {
  const { data, error } = await supabase
    .from('contact_channels')
    .select('*')
    .eq('cliente_id', cliente_id);
    
  if (error) throw error;
  return data || [];
}

export async function createContactChannel(cliente_id: string, type: 'sms' | 'whatsapp', value_e164: string): Promise<ContactChannel> {
  const { data, error } = await supabase
    .from('contact_channels')
    .insert({ cliente_id, type, value_e164, user_id: (await supabase.auth.getUser()).data.user.id })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteContactChannel(id: string): Promise<void> {
  const { error } = await supabase
    .from('contact_channels')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function getSenderChannels(): Promise<SenderChannel[]> {
  const { data, error } = await supabase
    .from('sender_channels')
    .select('*');

  if (error) throw error;
  return data || [];
}

export async function updateSenderChannel(id: string, from_value: string): Promise<SenderChannel> {
  const { data, error } = await supabase
    .from('sender_channels')
    .update({ from_value })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}
