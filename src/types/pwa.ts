
export interface PushToken {
    id: string;
    created_at: string;
    user_id: string;
    token: string;
    user_agent: string | null;
}

export interface NotificationLog {
    id: string;
    created_at: string;
    user_id: string;
    title: string;
    body: string;
    status: 'sent' | 'failed';
}

export interface PWAState {
    isInstalled: boolean;
    isInstallable: boolean;
    isOnline: boolean;
    isSyncing: boolean;
    lastSync: Date | null;
}

export type OfflineMutationStatus = 'pending' | 'processing' | 'failed' | 'processed';

export interface OfflineMutationQueueItem {
    id: string;
    created_at: string;
    updated_at: string;
    idempotency_key: string;
    mutation_type: string;
    entity: string;
    payload: unknown;
    retry_count: number;
    last_error: string | null;
    status: OfflineMutationStatus;
    failure_type?: 'temporary' | 'permanent' | null;
}

export interface EnqueueOfflineMutationInput {
    idempotency_key: string;
    mutation_type: string;
    entity: string;
    payload: unknown;
    status?: OfflineMutationStatus;
    retry_count?: number;
    last_error?: string | null;
    failure_type?: 'temporary' | 'permanent' | null;
}

export interface OfflineConflictLogItem {
    id: string;
    created_at: string;
    mutation_type: string;
    entity: string;
    idempotency_key: string;
    local_snapshot: unknown;
    remote_snapshot: unknown;
    resolution: 'last_write_wins';
    note: string | null;
}

export type OfflineMutationUiState = 'pending' | 'synced' | 'failed';
