
import { addDays, addWeeks, isBefore, set, getDay, startOfDay } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';

export const RECURRENCE_OPTIONS = [
  { value: 'once', label: 'Uma vez' },
  { value: 'daily', label: 'Diário' },
  { value: 'weekly', label: 'Semanal' },
];

export const WEEKDAY_LABELS = {
  1: 'Segunda',
  2: 'Terça',
  3: 'Quarta',
  4: 'Quinta',
  5: 'Sexta',
  6: 'Sábado',
  7: 'Domingo',
};

export const TIMEZONE_OPTIONS = [
  'America/Sao_Paulo',
  'America/New_York',
  'Europe/London',
  'UTC',
];

/**
 * Calculates the next run date based on configuration
 * Note: This is a simplified frontend prediction. Robust logic also exists in Edge Function.
 */
export function calculateNextRunAt(
  runAt: Date | string,
  recurrence: string,
  interval: number = 1,
  weekdays: number[] = [],
  timezone: string = 'America/Sao_Paulo'
): Date {
  let baseDate = typeof runAt === 'string' ? new Date(runAt) : runAt;
  
  // If base date is in the past, we need to project forward from NOW
  // For simplicity in UI, we usually just show the initial run_at or calculate from it.
  
  // This logic is primarily for showing the user "If you save this, the first run will be..."
  // Or "The run AFTER this one will be..."
  
  if (recurrence === 'once') return baseDate;

  // Simple projection for next occurrence logic
  if (recurrence === 'daily') {
     return addDays(baseDate, interval);
  }

  if (recurrence === 'weekly') {
     // If complex weekly logic is needed (e.g., finding next valid day in list)
     // This requires more complex date math often better handled by a library like rrule
     // For basic purposes:
     return addWeeks(baseDate, interval); 
  }

  return baseDate;
}

export function formatScheduleRecurrence(
  recurrence: string,
  interval: number,
  weekdays: number[] | undefined
): string {
  if (recurrence === 'once') return 'Uma vez';
  
  if (recurrence === 'daily') {
    return interval === 1 ? 'Diariamente' : `A cada ${interval} dias`;
  }
  
  if (recurrence === 'weekly') {
    const days = weekdays?.map(d => WEEKDAY_LABELS[d as keyof typeof WEEKDAY_LABELS]).join(', ');
    return interval === 1 
      ? `Semanalmente (${days})` 
      : `A cada ${interval} semanas (${days})`;
  }
  
  return recurrence;
}

export async function generateDedupeKey(
  user_id: string,
  cliente_id: string,
  template: string,
  channel: string,
  orcamento_id: string | null | undefined,
  run_at: string,
  recurrence: string
): Promise<string> {
  const str = `${user_id}-${cliente_id}-${template}-${channel}-${orcamento_id || ''}-${run_at}-${recurrence}`;
  
  // Using Web Crypto API for SHA-256
  const msgBuffer = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function validateScheduleForm(schedule: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!schedule.cliente_id) errors.push('Cliente é obrigatório');
  if (!schedule.run_at) errors.push('Data de início é obrigatória');
  
  const runAt = new Date(schedule.run_at);
  if (isBefore(runAt, new Date(Date.now() + 60000))) { // Now + 1 min tolerance
      // errors.push('Data de execução deve ser no futuro (pelo menos 2 min)');
      // Relaxed validation for editing
  }

  if (schedule.recurrence === 'weekly' && (!schedule.recurrence_weekdays || schedule.recurrence_weekdays.length === 0)) {
    errors.push('Selecione pelo menos um dia da semana para recorrência semanal');
  }

  if (schedule.recurrence !== 'once' && (!schedule.recurrence_interval || schedule.recurrence_interval < 1)) {
    errors.push('Intervalo de recorrência inválido');
  }

  return { valid: errors.length === 0, errors };
}
