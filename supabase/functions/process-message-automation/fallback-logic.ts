
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export async function fallbackChannel(
    supabase: SupabaseClient, 
    outbox_id: string, 
    rule: any, 
    user_id: string
): Promise<string | null> {

    const { data: msg } = await supabase
        .from('message_outbox')
        .select('*')
        .eq('id', outbox_id)
        .single();
    
    if (!msg) return null;

    const targetChannel = rule.action_config?.to_channel || 'whatsapp';
    
    // Don't fallback to same channel
    if (msg.channel === targetChannel) return null;

    // Check if we already did fallback for this message
    const { count } = await supabase
        .from('message_automation_log')
        .select('*', { count: 'exact', head: true })
        .eq('source_outbox_id', outbox_id)
        .eq('action_taken', 'fallback_sent');
    
    if (count && count > 0) return null;

    // Check if client has contact info for target channel
    // Assuming we can find it via cliente_id
    if (!msg.cliente_id) return null;

    const { data: contact } = await supabase
        .from('contact_channels')
        .select('value')
        .eq('cliente_id', msg.cliente_id)
        .eq('type', targetChannel)
        .single();
    
    if (!contact) return null; // No contact info for fallback

    // Create message
    const { data: newMsg, error } = await supabase
        .from('message_outbox')
        .insert({
            user_id: msg.user_id,
            channel: targetChannel,
            to_value: contact.value,
            template: msg.template,
            payload: msg.payload, // Reuse payload
            cliente_id: msg.cliente_id,
            orcamento_id: msg.orcamento_id,
            status: 'queued'
        })
        .select()
        .single();

    if (error) throw error;
    return newMsg.id;
}
