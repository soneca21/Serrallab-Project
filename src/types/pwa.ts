
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
