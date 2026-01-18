
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export async function retryFailedMessage(
    supabase: SupabaseClient, 
    outbox_id: string, 
    rule: any, 
    user_id: string
): Promise<string | null> {
    
    // 1. Fetch original message
    const { data: msg, error } = await supabase
        .from('message_outbox')
        .select('*')
        .eq('id', outbox_id)
        .single();
    
    if (error || !msg) return null;

    // 2. Validate Channels condition
    if (rule.trigger_condition?.channels?.length > 0) {
        if (!rule.trigger_condition.channels.includes(msg.channel)) {
            return null; // Channel not covered by rule
        }
    }

    // 3. Check retry count
    const { count } = await supabase
        .from('message_automation_log')
        .select('*', { count: 'exact', head: true })
        .eq('source_outbox_id', outbox_id)
        .eq('action_taken', 'retry_sent');
    
    const maxRetries = rule.action_config?.max_retries || 3;
    if ((count || 0) >= maxRetries) return null;

    // 4. Create new Outbox entry
    const { data: newMsg, error: insertError } = await supabase
        .from('message_outbox')
        .insert({
            user_id: msg.user_id,
            channel: msg.channel,
            to_value: msg.to_value,
            template: msg.template,
            payload: msg.payload,
            cliente_id: msg.cliente_id,
            orcamento_id: msg.orcamento_id,
            status: 'queued',
            provider: msg.provider
        })
        .select()
        .single();

    if (insertError) throw insertError;

    return newMsg.id;
}
