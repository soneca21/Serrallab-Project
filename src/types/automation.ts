
export interface MessageRetryRule {
  id: string;
  created_at?: string;
  updated_at?: string;
  user_id: string;
  name: string;
  trigger_event: 'message_failed' | 'message_undelivered' | 'orcamento_status_change' | 'time_elapsed';
  trigger_condition: {
    channels?: string[]; // for message_failed/undelivered
    from_status?: string; // for orcamento_status_change
    to_status?: string; // for orcamento_status_change
    days?: number; // for time_elapsed
    status?: string; // for time_elapsed check
  };
  action: 'retry_message' | 'send_message' | 'fallback_channel';
  action_config: {
    delay_minutes?: number; // for retry
    max_retries?: number; // for retry
    template?: string; // for send_message
    to_channel?: string; // for fallback
    from_channel?: string; // for fallback validation
  };
  enabled: boolean;
}

export interface MessageAutomationLog {
  id: string;
  created_at: string;
  user_id: string;
  rule_id: string;
  trigger_event: string;
  source_outbox_id?: string;
  action_taken: string;
  result_outbox_id?: string;
  error_message?: string;
  
  // Joins
  rule_name?: string;
}
