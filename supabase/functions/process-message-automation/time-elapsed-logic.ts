
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export async function handleTimeElapsed(
    supabase: SupabaseClient, 
    rule: any, 
    user_id: string
): Promise<string[]> {
    
    const days = rule.trigger_condition?.days || 3;
    const targetStatus = rule.trigger_condition?.status || 'sent';

    // Find orders in status X updated > Y days ago
    // "Older than X days" means updated_at < (now - X days)
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - days);
    
    const { data: orders } = await supabase
        .from('orders')
        .select('*, client:clients(*)')
        .eq('user_id', user_id)
        .eq('status', targetStatus)
        .lt('updated_at', dateLimit.toISOString());

    if (!orders || orders.length === 0) return [];

    const createdIds: string[] = [];
    const template = rule.action_config?.template || 'lembrete';

    for (const order of orders) {
        // Check if we already sent a reminder for this order recently (e.g., last 7 days) to avoid spam
        // Check automation log for this rule and this entity? 
        // We don't have entity_id in log easily reachable. 
        // We can check message_outbox for this orcamento_id and template 'lembrete'
        
        const { count } = await supabase
            .from('message_outbox')
            .select('*', { count: 'exact', head: true })
            .eq('orcamento_id', order.id)
            .eq('template', template)
            .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Last 24h
        
        if (count && count > 0) continue; // Skip if sent recently

        // Send message
         const { data: contacts } = await supabase
            .from('contact_channels')
            .select('*')
            .eq('cliente_id', order.client_id);
        
        if (contacts && contacts.length > 0) {
             const contact = contacts[0]; // Pick first
             const { data: newMsg } = await supabase
                .from('message_outbox')
                .insert({
                    user_id,
                    channel: contact.type,
                    to_value: contact.value,
                    template: template,
                    payload: {
                        cliente_nome: order.client.name,
                        numero: order.id.substring(0, 8)
                    },
                    cliente_id: order.client_id,
                    orcamento_id: order.id,
                    status: 'queued'
                })
                .select()
                .single();
             if (newMsg) createdIds.push(newMsg.id);
        }
    }

    return createdIds;
}
