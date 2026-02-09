import type { OfflineMutationQueueItem } from '@/types/pwa';
import {
    incrementOfflineMutationRetry,
    listOfflineMutations,
    removeOfflineMutation,
    updateOfflineMutationStatus,
} from '@/lib/offlineQueue';

type MutationProcessorResult = {
    duplicate?: boolean;
};

type MutationProcessor = (item: OfflineMutationQueueItem) => Promise<MutationProcessorResult | void>;
type ErrorClassification = 'temporary' | 'permanent';

const mutationProcessors = new Map<string, MutationProcessor>();
const inFlightIdempotencyKeys = new Set<string>();

const BACKOFF_BASE_MS = 5000;
const BACKOFF_MAX_MS = 5 * 60 * 1000;

function logInfo(message: string, context?: Record<string, unknown>) {
    console.info(`[offline-queue] ${message}`, context || {});
}

function logWarn(message: string, context?: Record<string, unknown>) {
    console.warn(`[offline-queue] ${message}`, context || {});
}

function logError(message: string, context?: Record<string, unknown>) {
    console.error(`[offline-queue] ${message}`, context || {});
}

function getBackoffMs(retryCount: number) {
    return Math.min(BACKOFF_MAX_MS, BACKOFF_BASE_MS * Math.pow(2, Math.max(0, retryCount)));
}

function isRetryWindowOpen(item: OfflineMutationQueueItem) {
    if (item.failure_type === 'permanent') {
        return false;
    }

    if (item.status !== 'failed') {
        return true;
    }

    const lastUpdatedAt = new Date(item.updated_at || item.created_at).getTime();
    const elapsed = Date.now() - lastUpdatedAt;
    return elapsed >= getBackoffMs(item.retry_count || 0);
}

function extractStatusCode(error: unknown): number | null {
    if (!error || typeof error !== 'object') return null;

    const maybeError = error as Record<string, unknown>;
    if (typeof maybeError.status === 'number') return maybeError.status;
    if (typeof maybeError.code === 'number') return maybeError.code;

    if (typeof maybeError.code === 'string') {
        const parsed = Number(maybeError.code);
        if (!Number.isNaN(parsed)) return parsed;
    }

    return null;
}

function classifyError(error: unknown): ErrorClassification {
    const code = extractStatusCode(error);
    const message = (error as { message?: string })?.message?.toLowerCase() || '';

    if (message.includes('network') || message.includes('timeout') || message.includes('failed to fetch')) {
        return 'temporary';
    }

    if (code === 408 || code === 429) return 'temporary';
    if (code !== null && code >= 500) return 'temporary';

    return 'permanent';
}

function getErrorMessage(error: unknown) {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    return 'Unknown offline queue processing error';
}

export function registerOfflineMutationProcessor(mutationType: string, processor: MutationProcessor) {
    mutationProcessors.set(mutationType, processor);
}

export function unregisterOfflineMutationProcessor(mutationType: string) {
    mutationProcessors.delete(mutationType);
}

export async function processOfflineMutationQueue() {
    const [pending, failed] = await Promise.all([
        listOfflineMutations({ status: 'pending' }),
        listOfflineMutations({ status: 'failed' }),
    ]);

    const queue = [...pending, ...failed].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    const seenInBatch = new Set<string>();
    const summary = {
        total: queue.length,
        processed: 0,
        failedTemporary: 0,
        failedPermanent: 0,
        skippedBackoff: 0,
        skippedDuplicate: 0,
        skippedNoProcessor: 0,
    };

    for (const item of queue) {
        if (!isRetryWindowOpen(item)) {
            summary.skippedBackoff += 1;
            continue;
        }

        if (seenInBatch.has(item.idempotency_key) || inFlightIdempotencyKeys.has(item.idempotency_key)) {
            summary.skippedDuplicate += 1;
            logWarn('Skipping duplicate idempotency key in queue batch', {
                id: item.id,
                idempotency_key: item.idempotency_key,
                mutation_type: item.mutation_type,
            });
            continue;
        }

        const processor = mutationProcessors.get(item.mutation_type);
        if (!processor) {
            summary.skippedNoProcessor += 1;
            await updateOfflineMutationStatus(item.id, 'failed', {
                last_error: `No processor registered for mutation_type "${item.mutation_type}"`,
            });
            logWarn('No processor registered for queued mutation', {
                id: item.id,
                mutation_type: item.mutation_type,
                entity: item.entity,
            });
            continue;
        }

        seenInBatch.add(item.idempotency_key);
        inFlightIdempotencyKeys.add(item.idempotency_key);

            await updateOfflineMutationStatus(item.id, 'processing', {
                last_error: null,
                failure_type: null,
            });

        try {
            const result = await processor(item);
            if (result?.duplicate) {
                summary.skippedDuplicate += 1;
                logInfo('Processor marked mutation as duplicate; removing from queue', {
                    id: item.id,
                    idempotency_key: item.idempotency_key,
                });
            } else {
                summary.processed += 1;
                logInfo('Mutation processed successfully', {
                    id: item.id,
                    mutation_type: item.mutation_type,
                    entity: item.entity,
                    retry_count: item.retry_count,
                });
            }

            await removeOfflineMutation(item.id);
        } catch (error) {
            const classification = classifyError(error);
            const message = getErrorMessage(error);

            if (classification === 'temporary') {
                summary.failedTemporary += 1;
                await incrementOfflineMutationRetry(item.id, message);
            } else {
                summary.failedPermanent += 1;
                await updateOfflineMutationStatus(item.id, 'failed', {
                    retry_count: item.retry_count + 1,
                    last_error: `Permanent failure: ${message}`,
                    failure_type: 'permanent',
                });
            }

            logError('Mutation processing failed', {
                id: item.id,
                mutation_type: item.mutation_type,
                entity: item.entity,
                classification,
                retry_count: item.retry_count + 1,
                error: message,
            });
        } finally {
            inFlightIdempotencyKeys.delete(item.idempotency_key);
        }
    }

    logInfo('Queue processing completed', summary);
    return summary;
}
