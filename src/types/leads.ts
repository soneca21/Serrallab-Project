
export interface Lead {
    id: string;
    created_at: string;
    user_id: string;
    phone: string;
    name?: string;
    source: 'whatsapp';
    pipeline_stage_id?: string | null;
}

export interface LeadMessage {
    id: string;
    created_at: string;
    lead_id: string;
    direction: 'inbound' | 'outbound';
    content: string;
}

export interface LeadAutoReplyLog {
    user_id: string;
    phone: string;
    last_replied_at: string;
}
