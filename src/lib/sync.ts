import { supabase } from '@/lib/customSupabaseClient';
import { saveLeadsOffline, saveOrcamentosOffline, savePipelineOffline } from './offline';

const STATUS_STAGE_FALLBACK = {
    Rascunho: 'Novo',
    Enviado: 'Enviado',
    Aprovado: 'Em Producao',
    'Proposta Aceita': 'Em Producao',
    'Conclu\u00eddo': 'Entregue',
    Concluido: 'Entregue',
    Ganho: 'Entregue',
    Rejeitado: 'Perdido',
};

export async function syncLeads() {
    const { data, error } = await supabase.from('leads').select('*');
    if (error) throw error;
    if (data) await saveLeadsOffline(data);
    return data;
}

export async function syncOrcamentos() {
    const [ordersRes, stagesRes] = await Promise.all([
        supabase.from('orders').select('*, clients(*)').order('created_at', { ascending: false }),
        supabase.from('pipeline_stages').select('id, name'),
    ]);

    if (ordersRes.error) throw ordersRes.error;
    if (stagesRes.error) throw stagesRes.error;

    const stageMap = (stagesRes.data || []).reduce((acc, stage) => {
        acc[stage.id] = stage.name;
        return acc;
    }, {});

    const normalized = (ordersRes.data || []).map((order) => ({
        ...order,
        pipeline_stage_name: stageMap[order.pipeline_stage_id] || STATUS_STAGE_FALLBACK[order.status] || 'Novo',
    }));

    await saveOrcamentosOffline(normalized);
    return normalized;
}

export async function syncPipeline(ordersData) {
    const data = ordersData || await syncOrcamentos();
    const pipelineData = data.reduce((acc, order) => {
        const stage = order.pipeline_stage_name || 'Novo';
        if (!acc[stage]) acc[stage] = [];
        acc[stage].push(order);
        return acc;
    }, {});

    await savePipelineOffline(pipelineData);
    return pipelineData;
}

export async function syncAll() {
    try {
        const [leads, orcamentos] = await Promise.all([
            syncLeads(),
            syncOrcamentos(),
        ]);
        await syncPipeline(orcamentos);
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
