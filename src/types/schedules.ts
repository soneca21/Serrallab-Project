
export interface MessageSchedule {
  id: string;
  created_at?: string;
  updated_at?: string;
  user_id: string;
  enabled: boolean;
  channel: 'sms' | 'whatsapp';
  cliente_id: string;
  template: 'orcamento_enviado' | 'status_update' | 'lembrete';
  orcamento_id?: string;
  payload?: any;
  run_at: string; // ISO String
  timezone: string;
  recurrence: 'once' | 'daily' | 'weekly';
  recurrence_interval: number;
  recurrence_weekdays?: number[]; // 1-7 (ISO)
  end_at?: string | null;
  next_run_at: string;
  dedupe_key?: string;
  last_run_at?: string | null;
  last_run_status?: 'success' | 'failed' | 'skipped' | null;
  failure_count: number;
  
  // Joins for UI
  client?: { name: string };
  order?: { title: string; id: string };
}

export interface MessageScheduleRun {
  id: string;
  created_at: string;
  user_id: string;
  schedule_id: string;
  scheduled_for: string;
  action_taken: 'sent' | 'failed' | 'skipped' | 'disabled';
  outbox_id?: string | null;
  error_message?: string | null;
  metadata?: any;
}
