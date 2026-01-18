
import { startOfDay, endOfDay, subDays, subMonths, subYears, format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const PERIOD_PRESETS = {
  TODAY: {
    label: 'Hoje',
    start: startOfDay(new Date()).toISOString(),
    end: endOfDay(new Date()).toISOString(),
  },
  LAST_WEEK: {
    label: 'Última Semana',
    start: startOfDay(subDays(new Date(), 7)).toISOString(),
    end: endOfDay(new Date()).toISOString(),
  },
  LAST_MONTH: {
    label: 'Último Mês',
    start: startOfDay(subMonths(new Date(), 1)).toISOString(),
    end: endOfDay(new Date()).toISOString(),
  },
  LAST_3_MONTHS: {
    label: 'Últimos 3 Meses',
    start: startOfDay(subMonths(new Date(), 3)).toISOString(),
    end: endOfDay(new Date()).toISOString(),
  },
  LAST_YEAR: {
    label: 'Último Ano',
    start: startOfDay(subYears(new Date(), 1)).toISOString(),
    end: endOfDay(new Date()).toISOString(),
  },
};

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatPercentage(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
}

export function formatDate(date: Date | string): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'dd/MM/yyyy', { locale: ptBR });
}

export function calculatePeriodDays(start: string, end: string): number {
  return differenceInDays(new Date(end), new Date(start));
}

export function getPeriodLabel(start: string, end: string): string {
  return `${formatDate(start)} - ${formatDate(end)}`;
}

export function downloadCsv(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
