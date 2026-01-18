
import { supabase } from '@/lib/customSupabaseClient';
import { MessageRetryRule, MessageAutomationLog } from '@/types/automation';

export async function getAutomationRules(): Promise<MessageRetryRule[]> {
  const { data, error } = await supabase
    .from('message_retry_rules')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createAutomationRule(rule: Partial<MessageRetryRule>): Promise<MessageRetryRule> {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from('message_retry_rules')
    .insert({ ...rule, user_id: user.id })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateAutomationRule(id: string, rule: Partial<MessageRetryRule>): Promise<MessageRetryRule> {
  const { data, error } = await supabase
    .from('message_retry_rules')
    .update(rule)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteAutomationRule(id: string): Promise<void> {
  const { error } = await supabase
    .from('message_retry_rules')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function getAutomationLog(limit: number = 50): Promise<MessageAutomationLog[]> {
  const { data, error } = await supabase
    .from('message_automation_log')
    .select(`
      *,
      message_retry_rules (
        name
      )
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  
  return (data || []).map(log => ({
    ...log,
    rule_name: log.message_retry_rules?.name || 'Regra Excluída'
  }));
}
