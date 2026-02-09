import { supabase } from '@/lib/customSupabaseClient';
import { saveLeadsOffline, saveOrcamentosOffline, savePipelineOffline } from './offline';
import { processOfflineMutationQueue } from './offlineQueueProcessor';
import { trackPwaTelemetry } from '@/lib/pwaTelemetry';

export const STATUS_STAGE_FALLBACK = {
    Rascunho: 'Novo',
    Enviado: 'Enviado',
    Aprovado: 'Em Producao',
    'Proposta Aceita': 'Em Producao',
    'Concluído': 'Entregue',
    Concluido: 'Entregue',
    Ganho: 'Entregue',
    Rejeitado: 'Perdido',
};

export const PIPELINE_STAGE_ORDER = [
    'Novo',
    'Atendimento',
    'Enviado',
    'Em Producao',
    'Entregue',
    'Perdido',
];

export function resolvePipelineStageName(order, stageMap = {}) {
    return stageMap[order.pipeline_stage_id] || order.pipeline_stage_name || STATUS_STAGE_FALLBACK[order.status] || 'Novo';
}

export function groupOrdersByPipelineStage(orders = []) {
    const seed = PIPELINE_STAGE_ORDER.reduce((acc, stage) => {
        acc[stage] = [];
        return acc;
    }, {});

    return (orders || []).reduce((acc, order) => {
        const stage = resolvePipelineStageName(order);
        if (!acc[stage]) {
            acc[stage] = [];
        }
        acc[stage].push(order);
        return acc;
    }, seed);
}

export async function syncLeads() {
    const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    const normalized = data || [];
    await saveLeadsOffline(normalized);
    return normalized;
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
        pipeline_stage_name: resolvePipelineStageName(order, stageMap),
    }));

    await saveOrcamentosOffline(normalized);
    return normalized;
}

export async function syncPipeline(ordersData) {
    const data = ordersData || await syncOrcamentos();
    const pipelineData = groupOrdersByPipelineStage(data);

    await savePipelineOffline(pipelineData);
    return pipelineData;
}

export async function syncAll() {
    try {
        const queueSummary = await processOfflineMutationQueue();
        void trackPwaTelemetry('queue_size', {
            total: queueSummary.total,
            processed: queueSummary.processed,
            failed_temporary: queueSummary.failedTemporary,
            failed_permanent: queueSummary.failedPermanent,
            skipped_backoff: queueSummary.skippedBackoff,
            skipped_duplicate: queueSummary.skippedDuplicate,
            skipped_no_processor: queueSummary.skippedNoProcessor,
        });

        const [leads, orcamentos] = await Promise.all([
            syncLeads(),
            syncOrcamentos(),
        ]);
        await syncPipeline(orcamentos);
        void trackPwaTelemetry('sync_success', {
            leads_count: leads.length,
            orcamentos_count: orcamentos.length,
            queue_total: queueSummary.total,
            queue_processed: queueSummary.processed,
        });
        return {
            success: true,
            timestamp: new Date(),
            leadsCount: leads.length,
            orcamentosCount: orcamentos.length,
            queue: queueSummary,
        };
    } catch (error) {
        console.error('Sync failed:', error);
        void trackPwaTelemetry('sync_error', {
            message: error instanceof Error ? error.message : String(error),
        });
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
