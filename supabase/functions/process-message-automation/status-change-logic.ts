
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export async function handleStatusChange(
    supabase: SupabaseClient, 
    orcamento_id: string,
    old_status: string,
    new_status: string,
    rule: any, 
    user_id: string
): Promise<string[]> {
    
    // Validate Status Transitions
    if (rule.trigger_condition?.from_status && rule.trigger_condition.from_status !== old_status) return [];
    if (rule.trigger_condition?.to_status && rule.trigger_condition.to_status !== new_status) return [];

    // Get Order & Client
    const { data: order } = await supabase
        .from('orders')
        .select('*, client:clients(*)')
        .eq('id', orcamento_id)
        .single();

    if (!order || !order.client_id) return [];

    // Prevent duplicates (optional, check if message for this transition sent recently)
    // ... logic omitted for brevity, assuming UI handles debouncing or logs check

    // Get Channels to send to
    const channels = ['sms', 'whatsapp']; // Or configured in rule?
    // Usually rules specify "Send Message" -> maybe check available channels of client
    
    const { data: contacts } = await supabase
        .from('contact_channels')
        .select('*')
        .eq('cliente_id', order.client_id);
    
    if (!contacts || contacts.length === 0) return [];

    const createdIds: string[] = [];
    const template = rule.action_config?.template || 'status_update';

    // Logic: Send to ALL available channels or preferred?
    // Let's send to all found contacts for simplicity or just one preference.
    // Better: Send to first valid.
    
    for (const contact of contacts) {
        const { data: newMsg } = await supabase
            .from('message_outbox')
            .insert({
                user_id,
                channel: contact.type,
                to_value: contact.value,
                template: template,
                payload: {
                    cliente_nome: order.client.name,
                    numero: order.id.substring(0, 8),
                    status_humano: new_status
                },
                cliente_id: order.client_id,
                orcamento_id: order.id,
                status: 'queued'
            })
            .select()
            .single();
        
        if (newMsg) createdIds.push(newMsg.id);
    }

    return createdIds;
}
