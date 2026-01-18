
import { Mail, MessageSquare, Clock, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const MESSAGING_CHANNELS = {
  SMS: 'sms',
  WHATSAPP: 'whatsapp',
  EMAIL: 'email',
};

export const MESSAGING_TEMPLATES = {
  ORCAMENTO_ENVIADO: 'orcamento_enviado',
  STATUS_UPDATE: 'status_update',
  LEMBRETE: 'lembrete',
};

/**
 * Validates and formats phone to E.164
 * Simplistic implementation for BRL/International
 */
export function formatPhoneE164(phone: string): string | null {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length < 10) return null;
  
  // Assume BR if starts with 55 or length is 10/11
  if (cleaned.startsWith('55') && (cleaned.length === 12 || cleaned.length === 13)) {
    return `+${cleaned}`;
  }
  
  if (cleaned.length === 10 || cleaned.length === 11) {
    return `+55${cleaned}`;
  }
  
  return `+${cleaned}`;
}

export function getChannelIcon(channel: string) {
  switch(channel) {
    case MESSAGING_CHANNELS.SMS: return MessageSquare;
    case MESSAGING_CHANNELS.WHATSAPP: return MessageSquare; 
    case MESSAGING_CHANNELS.EMAIL: return Mail;
    default: return Mail;
  }
}

export function getChannelColor(channel: string): string {
  switch(channel) {
    case MESSAGING_CHANNELS.SMS: return 'text-blue-500 bg-blue-100';
    case MESSAGING_CHANNELS.WHATSAPP: return 'text-green-500 bg-green-100';
    case MESSAGING_CHANNELS.EMAIL: return 'text-purple-500 bg-purple-100';
    default: return 'text-gray-500 bg-gray-100';
  }
}

export function getTemplateLabel(template: string): string {
  switch(template) {
    case MESSAGING_TEMPLATES.ORCAMENTO_ENVIADO: return 'Orçamento Enviado';
    case MESSAGING_TEMPLATES.STATUS_UPDATE: return 'Atualização de Status';
    case MESSAGING_TEMPLATES.LEMBRETE: return 'Lembrete';
    default: return template;
  }
}

export function renderTemplate(template: string, data: { cliente_nome?: string, numero?: string, valor_fmt?: string, status_humano?: string }): string {
  const { cliente_nome = '', numero = '', valor_fmt = '', status_humano = '' } = data;
  switch(template) {
    case MESSAGING_TEMPLATES.ORCAMENTO_ENVIADO:
      return `Olá ${cliente_nome}, seu orçamento #${numero} no valor de ${valor_fmt} foi gerado.`;
    case MESSAGING_TEMPLATES.STATUS_UPDATE:
      return `Olá ${cliente_nome}, o status do seu orçamento #${numero} mudou para: ${status_humano}.`;
    case MESSAGING_TEMPLATES.LEMBRETE:
      return `Olá ${cliente_nome}, este é um lembrete sobre seu orçamento #${numero}.`;
    default:
      return '';
  }
}

// --- Delivery Status Helpers ---

export function getDeliveryStatusIcon(status: string) {
  switch(status) {
    case 'queued': return Clock;
    case 'sent': return CheckCircle2;
    case 'delivered': return CheckCircle2; 
    case 'undelivered':
    case 'failed': return XCircle;
    default: return AlertTriangle;
  }
}

export function getDeliveryStatusColor(status: string): string {
  switch(status) {
    case 'queued': return 'text-gray-500 bg-gray-100';
    case 'sent': return 'text-blue-500 bg-blue-100';
    case 'delivered': return 'text-green-600 bg-green-100';
    case 'undelivered':
    case 'failed': return 'text-red-600 bg-red-100';
    default: return 'text-yellow-600 bg-yellow-100';
  }
}

export function getDeliveryStatusLabel(status: string): string {
  switch(status) {
    case 'queued': return 'Na Fila';
    case 'sent': return 'Enviado';
    case 'delivered': return 'Entregue';
    case 'undelivered': return 'Não Entregue';
    case 'failed': return 'Falha';
    case 'read': return 'Lido';
    default: return status || 'Desconhecido';
  }
}

export function formatDeliveryTime(dateStr: string | Date | null): string {
  if (!dateStr) return '-';
  try {
    const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
  } catch (e) {
    return '-';
  }
}

export interface DeliveryChange {
  outbox_id: string;
  delivery_status: string;
  delivery_status_updated_at: string;
  delivery_error_code?: string;
  delivery_error_details?: any;
}

// --- Automation Helpers ---

export function getTriggerEventLabel(event: string): string {
  switch(event) {
    case 'message_failed': return 'Falha no Envio';
    case 'message_undelivered': return 'Não Entregue';
    case 'orcamento_status_change': return 'Mudança de Status';
    case 'time_elapsed': return 'Tempo Decorrido';
    default: return event;
  }
}

export function getActionLabel(action: string): string {
  switch(action) {
    case 'retry_message': return 'Tentar Novamente';
    case 'send_message': return 'Enviar Mensagem';
    case 'fallback_channel': return 'Canal Alternativo';
    default: return action;
  }
}

export function getActionTakenLabel(action: string): string {
  switch(action) {
    case 'retry_sent': return 'Reenvio Iniciado';
    case 'send_sent': return 'Mensagem Enviada';
    case 'fallback_sent': return 'Fallback Enviado';
    case 'skipped': return 'Ignorado';
    default: return action;
  }
}
