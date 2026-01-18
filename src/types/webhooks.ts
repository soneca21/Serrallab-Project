
export interface Webhook {
    id: string;
    created_at: string;
    user_id: string;
    endpoint_url: string;
    secret: string;
    enabled: boolean;
}

export interface WebhookLog {
    id: string;
    created_at: string;
    user_id: string;
    event_type: string;
    payload: any;
    status: 'sent' | 'failed';
    response_code?: number;
}
