
import { supabase } from '@/lib/customSupabaseClient';
import { MessageSchedule, MessageScheduleRun } from '@/types/schedules';

export async function getSchedules(): Promise<MessageSchedule[]> {
  const { data, error } = await supabase
    .from('message_schedules')
    .select('*, client:clients(name), order:orders(title, id)')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createSchedule(schedule: Partial<MessageSchedule>): Promise<MessageSchedule> {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error('Unauthorized');

  const { data, error } = await supabase
    .from('message_schedules')
    .insert({ ...schedule, user_id: user.id })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateSchedule(id: string, schedule: Partial<MessageSchedule>): Promise<MessageSchedule> {
  const { data, error } = await supabase
    .from('message_schedules')
    .update(schedule)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteSchedule(id: string): Promise<void> {
  const { error } = await supabase
    .from('message_schedules')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function toggleSchedule(id: string, enabled: boolean): Promise<MessageSchedule> {
  const { data, error } = await supabase
    .from('message_schedules')
    .update({ enabled })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getScheduleRuns(schedule_id: string, limit: number = 50): Promise<MessageScheduleRun[]> {
  const { data, error } = await supabase
    .from('message_schedule_runs')
    .select('*')
    .eq('schedule_id', schedule_id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}
