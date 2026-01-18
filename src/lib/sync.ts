
import { supabase } from '@/lib/customSupabaseClient';
import { saveLeadsOffline, saveOrcamentosOffline, savePipelineOffline } from './offline';

export async function syncLeads() {
    const { data, error } = await supabase.from('leads').select('*');
    if (error) throw error;
    if (data) await saveLeadsOffline(data);
    return data;
}

export async function syncOrcamentos() {
    // Syncing orders as orcamentos
    const { data, error } = await supabase.from('orders').select('*, clients(*)').order('created_at', { ascending: false });
    if (error) throw error;
    if (data) await saveOrcamentosOffline(data);
    return data;
}

export async function syncPipeline() {
    // For pipeline, we fetch orders and group them client-side or use a view
    // Here we reuse the order fetch but process it for pipeline structure storage if needed
    // Or fetch a specific view. Let's assume we store the raw orders and process on read,
    // but the prompt asks to sync pipeline data.
    const { data, error } = await supabase.from('orders').select('*, clients(*)');
    if (error) throw error;
    
    // Process pipeline data structure
    const pipelineData = {
        'Proposta': data?.filter(o => o.status === 'Proposta') || [],
        'Negociação': data?.filter(o => o.status === 'Negociação') || [],
        'Aprovado': data?.filter(o => o.status === 'Aprovado') || [], // Won
        'Rejeitado': data?.filter(o => o.status === 'Rejeitado') || [], // Lost
    };
    
    if (pipelineData) await savePipelineOffline(pipelineData);
    return pipelineData;
}

export async function syncAll() {
    try {
        await Promise.all([
            syncLeads(),
            syncOrcamentos(),
            syncPipeline()
        ]);
        return { success: true, timestamp: new Date() };
    } catch (error) {
        console.error('Sync failed:', error);
        return { success: false, error };
    }
}

export async function registerBackgroundSync() {
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
        try {
            const registration = await navigator.serviceWorker.ready;
            // @ts-ignore
            await registration.sync.register('sync-data');
        } catch (error) {
            console.log('Background sync registration failed:', error);
        }
    }
}
