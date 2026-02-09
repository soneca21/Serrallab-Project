import { supabase } from '@/lib/customSupabaseClient';
import { v4 as uuidv4 } from 'uuid';
import type { OfflineMutationQueueItem, OfflineMutationUiState } from '@/types/pwa';
import { enqueueOfflineMutation } from '@/lib/offlineQueue';
import { registerOfflineMutationProcessor } from '@/lib/offlineQueueProcessor';
import { logOfflineConflict } from '@/lib/offlineConflicts';
import { getLeadsOffline, getOrcamentosOffline, saveLeadsOffline, saveOrcamentosOffline, savePipelineOffline } from '@/lib/offline';
import { groupOrdersByPipelineStage, STATUS_STAGE_FALLBACK } from '@/lib/sync';

export const OFFLINE_MUTATION_TYPES = {
    CREATE_LEAD: 'lead.create',
    UPDATE_PIPELINE_STAGE: 'order.update_pipeline_stage',
    UPDATE_ORDER_STATUS: 'order.update_status',
} as const;

type MutationResult = {
    state: OfflineMutationUiState;
    message: string;
};

type CreateLeadInput = {
    id?: string;
    user_id: string;
    name: string;
    phone: string;
    source?: string;
};

type UpdatePipelineStageInput = {
    order_id: string;
    pipeline_stage_id: string;
    pipeline_stage_name?: string;
};

type UpdateOrderStatusInput = {
    order_id: string;
    status: string;
};

type MutationExecutionContext = {
    queued_at?: string;
    idempotency_key?: string;
};

function isOnline() {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

function normalizeError(error: unknown) {
    if (error instanceof Error) return error.message;
    return String(error ?? 'Erro desconhecido');
}

function isLikelyTemporaryError(error: unknown) {
    const message = normalizeError(error).toLowerCase();
    const status = (error as { status?: number })?.status;
    return (
        message.includes('network') ||
        message.includes('failed to fetch') ||
        message.includes('timeout') ||
        status === 408 ||
        status === 429 ||
        (typeof status === 'number' && status >= 500)
    );
}

async function patchOrderOffline(orderId: string, patch: Record<string, unknown>) {
    const cachedOrders = await getOrcamentosOffline();
    const nextOrders = (cachedOrders || []).map((order) => {
        if (order.id !== orderId) return order;
        return { ...order, ...patch };
    });

    await saveOrcamentosOffline(nextOrders);
    await savePipelineOffline(groupOrdersByPipelineStage(nextOrders));
}

async function appendLeadOffline(lead: Record<string, unknown>) {
    const cachedLeads = await getLeadsOffline();
    const filtered = (cachedLeads || []).filter((item) => item.id !== lead.id);
    await saveLeadsOffline([{ ...lead }, ...filtered]);
}

async function fetchRemoteOrderSnapshot(orderId: string) {
    const { data, error } = await supabase
        .from('orders')
        .select('id, updated_at, pipeline_stage_id, status')
        .eq('id', orderId)
        .single();

    if (error) return null;
    return data;
}

async function registerDivergenceIfNeeded(params: {
    mutation_type: string;
    entity: string;
    idempotency_key?: string;
    queued_at?: string;
    local_snapshot: Record<string, unknown>;
    remote_snapshot: Record<string, unknown> | null;
    changedField: 'pipeline_stage_id' | 'status';
}) {
    const { queued_at, local_snapshot, remote_snapshot, changedField } = params;
    if (!queued_at || !remote_snapshot?.updated_at) return;

    const queuedTs = new Date(queued_at).getTime();
    const remoteTs = new Date(String(remote_snapshot.updated_at)).getTime();
    if (!Number.isFinite(queuedTs) || !Number.isFinite(remoteTs) || remoteTs <= queuedTs) return;

    if (String(remote_snapshot[changedField] ?? '') === String(local_snapshot[changedField] ?? '')) return;

    const conflict = await logOfflineConflict({
        mutation_type: params.mutation_type,
        entity: params.entity,
        idempotency_key: params.idempotency_key || `auto:${params.mutation_type}:${Date.now()}`,
        local_snapshot,
        remote_snapshot,
        note: 'Conflito detectado: remoto mais novo; politica aplicada = last_write_wins.',
    });

    console.warn('[offline-conflict] divergence detected (last_write_wins)', {
        conflict_id: conflict.id,
        mutation_type: params.mutation_type,
        idempotency_key: params.idempotency_key,
    });
}

async function executeCreateLead(input: CreateLeadInput) {
    const payload = {
        id: input.id || uuidv4(),
        user_id: input.user_id,
        name: input.name,
        phone: input.phone,
        source: input.source || 'manual',
    };

    const { data, error } = await supabase
        .from('leads')
        .insert(payload)
        .select('*')
        .single();

    if (error) {
        const isDuplicate = error.code === '23505' || String(error.message || '').toLowerCase().includes('duplicate');
        if (isDuplicate) {
            return { duplicate: true };
        }
        throw error;
    }

    await appendLeadOffline(data || payload);
    return { duplicate: false };
}

async function executeUpdatePipelineStage(input: UpdatePipelineStageInput, context: MutationExecutionContext = {}) {
    const remoteSnapshot = await fetchRemoteOrderSnapshot(input.order_id);

    await registerDivergenceIfNeeded({
        mutation_type: OFFLINE_MUTATION_TYPES.UPDATE_PIPELINE_STAGE,
        entity: 'orders',
        idempotency_key: context.idempotency_key,
        queued_at: context.queued_at,
        local_snapshot: {
            order_id: input.order_id,
            pipeline_stage_id: input.pipeline_stage_id,
            pipeline_stage_name: input.pipeline_stage_name,
        },
        remote_snapshot: remoteSnapshot,
        changedField: 'pipeline_stage_id',
    });

    const { error } = await supabase
        .from('orders')
        .update({ pipeline_stage_id: input.pipeline_stage_id })
        .eq('id', input.order_id);

    if (error) throw error;

    await patchOrderOffline(input.order_id, {
        pipeline_stage_id: input.pipeline_stage_id,
        pipeline_stage_name: input.pipeline_stage_name,
    });
}

async function executeUpdateOrderStatus(input: UpdateOrderStatusInput, context: MutationExecutionContext = {}) {
    const remoteSnapshot = await fetchRemoteOrderSnapshot(input.order_id);

    await registerDivergenceIfNeeded({
        mutation_type: OFFLINE_MUTATION_TYPES.UPDATE_ORDER_STATUS,
        entity: 'orders',
        idempotency_key: context.idempotency_key,
        queued_at: context.queued_at,
        local_snapshot: {
            order_id: input.order_id,
            status: input.status,
        },
        remote_snapshot: remoteSnapshot,
        changedField: 'status',
    });

    const { error } = await supabase
        .from('orders')
        .update({ status: input.status })
        .eq('id', input.order_id);

    if (error) throw error;

    await patchOrderOffline(input.order_id, {
        status: input.status,
        pipeline_stage_name: STATUS_STAGE_FALLBACK[input.status] || undefined,
    });
}

async function runOrEnqueue(
    mutationType: string,
    entity: string,
    payload: Record<string, unknown>,
    idempotencyKey: string,
    executor: (context?: MutationExecutionContext) => Promise<{ duplicate?: boolean } | void>,
    applyOfflineOptimistic: () => Promise<void>
): Promise<MutationResult> {
    if (!isOnline()) {
        await applyOfflineOptimistic();
        await enqueueOfflineMutation({
            idempotency_key: idempotencyKey,
            mutation_type: mutationType,
            entity,
            payload,
            status: 'pending',
        });
        return { state: 'pending', message: 'Pendente (offline)' };
    }

    try {
        const result = await executor({ idempotency_key: idempotencyKey });
        if (result?.duplicate) {
            return { state: 'synced', message: 'Sincronizado (idempotente)' };
        }
        return { state: 'synced', message: 'Sincronizado' };
    } catch (error) {
        if (isLikelyTemporaryError(error)) {
            await applyOfflineOptimistic();
            await enqueueOfflineMutation({
                idempotency_key: idempotencyKey,
                mutation_type: mutationType,
                entity,
                payload,
                status: 'pending',
                last_error: normalizeError(error),
            });
            return { state: 'pending', message: 'Pendente (falha temporaria)' };
        }

        return { state: 'failed', message: `Falhou: ${normalizeError(error)}` };
    }
}

export async function createLeadWithOfflineSupport(input: CreateLeadInput): Promise<MutationResult> {
    const leadId = input.id || uuidv4();
    const payload = {
        id: leadId,
        user_id: input.user_id,
        name: input.name,
        phone: input.phone,
        source: input.source || 'manual',
        created_at: new Date().toISOString(),
    };

    return runOrEnqueue(
        OFFLINE_MUTATION_TYPES.CREATE_LEAD,
        'leads',
        payload,
        `lead:create:${leadId}`,
        () => executeCreateLead(payload),
        () => appendLeadOffline(payload)
    );
}

export async function updatePipelineStageWithOfflineSupport(input: UpdatePipelineStageInput): Promise<MutationResult> {
    const payload = {
        order_id: input.order_id,
        pipeline_stage_id: input.pipeline_stage_id,
        pipeline_stage_name: input.pipeline_stage_name,
    };

    return runOrEnqueue(
        OFFLINE_MUTATION_TYPES.UPDATE_PIPELINE_STAGE,
        'orders',
        payload,
        `order:pipeline:${input.order_id}:${input.pipeline_stage_id}`,
        (ctx) => executeUpdatePipelineStage(payload, ctx),
        () => patchOrderOffline(input.order_id, {
            pipeline_stage_id: input.pipeline_stage_id,
            pipeline_stage_name: input.pipeline_stage_name,
        })
    );
}

export async function updateOrderStatusWithOfflineSupport(input: UpdateOrderStatusInput): Promise<MutationResult> {
    const payload = {
        order_id: input.order_id,
        status: input.status,
    };

    return runOrEnqueue(
        OFFLINE_MUTATION_TYPES.UPDATE_ORDER_STATUS,
        'orders',
        payload,
        `order:status:${input.order_id}:${input.status}`,
        (ctx) => executeUpdateOrderStatus(payload, ctx),
        () => patchOrderOffline(input.order_id, {
            status: input.status,
            pipeline_stage_name: STATUS_STAGE_FALLBACK[input.status] || undefined,
        })
    );
}

registerOfflineMutationProcessor(OFFLINE_MUTATION_TYPES.CREATE_LEAD, async (item: OfflineMutationQueueItem) => {
    return executeCreateLead(item.payload as CreateLeadInput);
});

registerOfflineMutationProcessor(OFFLINE_MUTATION_TYPES.UPDATE_PIPELINE_STAGE, async (item: OfflineMutationQueueItem) => {
    await executeUpdatePipelineStage(item.payload as UpdatePipelineStageInput, {
        queued_at: item.created_at,
        idempotency_key: item.idempotency_key,
    });
});

registerOfflineMutationProcessor(OFFLINE_MUTATION_TYPES.UPDATE_ORDER_STATUS, async (item: OfflineMutationQueueItem) => {
    await executeUpdateOrderStatus(item.payload as UpdateOrderStatusInput, {
        queued_at: item.created_at,
        idempotency_key: item.idempotency_key,
    });
});
