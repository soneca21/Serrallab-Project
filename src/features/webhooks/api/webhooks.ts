
import { supabase } from '@/lib/customSupabaseClient';
import { Webhook, WebhookLog } from '@/types/webhooks';
import { generateSecret } from '@/lib/webhooks';

export async function getWebhook(): Promise<Webhook | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
        .from('outbound_webhooks')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

    if (error) throw error;
    return data;
}

export async function createWebhook(endpoint_url: string): Promise<Webhook> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const secret = generateSecret();

    const { data, error } = await supabase
        .from('outbound_webhooks')
        .insert({
            user_id: user.id,
            endpoint_url,
            secret,
            enabled: true
        })
        .select('*')
        .single();

    if (error) throw error;
    return data;
}

export async function updateWebhook(id: string, data: Partial<Webhook>): Promise<Webhook> {
    const { data: updated, error } = await supabase
        .from('outbound_webhooks')
        .update(data)
        .eq('id', id)
        .select('*')
        .single();

    if (error) throw error;
    return updated;
}

export async function deleteWebhook(id: string): Promise<void> {
    const { error } = await supabase
        .from('outbound_webhooks')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

export async function toggleWebhook(id: string, enabled: boolean): Promise<Webhook> {
    return updateWebhook(id, { enabled });
}

export async function regenerateSecret(id: string): Promise<Webhook> {
    const secret = generateSecret();
    return updateWebhook(id, { secret });
}

export async function getWebhookLogs(limit = 50, offset = 0): Promise<{ data: WebhookLog[], count: number }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error, count } = await supabase
        .from('webhook_events_log')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) throw error;
    return { data: data || [], count: count || 0 };
}
