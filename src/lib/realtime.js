
import { Info, AlertTriangle, CheckCircle, XCircle, Bell, FileText, User, Truck } from 'lucide-react';

export const REALTIME_EVENTS = {
  INSERT: 'INSERT',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
};

export const NOTIFICATION_TYPES = {
  INFO: 'info',
  WARNING: 'warning',
  SUCCESS: 'success',
  ERROR: 'error',
};

export const getNotificationIcon = (type) => {
  switch (type) {
    case NOTIFICATION_TYPES.WARNING:
      return AlertTriangle;
    case NOTIFICATION_TYPES.SUCCESS:
      return CheckCircle;
    case NOTIFICATION_TYPES.ERROR:
      return XCircle;
    case NOTIFICATION_TYPES.INFO:
    default:
      return Info;
  }
};

export const getNotificationColor = (type) => {
  switch (type) {
    case NOTIFICATION_TYPES.WARNING:
      return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
    case NOTIFICATION_TYPES.SUCCESS:
      return 'text-green-500 bg-green-500/10 border-green-500/20';
    case NOTIFICATION_TYPES.ERROR:
      return 'text-red-500 bg-red-500/10 border-red-500/20';
    case NOTIFICATION_TYPES.INFO:
    default:
      return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
  }
};

export const formatNotificationTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  const rtf = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' });

  if (diffInSeconds < 60) return rtf.format(-diffInSeconds, 'second');
  if (diffInSeconds < 3600) return rtf.format(-Math.floor(diffInSeconds / 60), 'minute');
  if (diffInSeconds < 86400) return rtf.format(-Math.floor(diffInSeconds / 3600), 'hour');
  if (diffInSeconds < 604800) return rtf.format(-Math.floor(diffInSeconds / 86400), 'day');
  return rtf.format(-Math.floor(diffInSeconds / 604800), 'week');
};

export const getNotificationRoute = (entity, entityId) => {
  if (!entity || !entityId) return null;
  
  switch (entity) {
    case 'orcamentos':
    case 'orders': // Handling both potential namings
      return `/app/orcamentos/editar/${entityId}`;
    case 'clientes':
    case 'clients':
      return `/app/clientes`; // Assuming list view for now if detail doesn't exist
    case 'pipeline':
      return `/app/pipeline`;
    default:
      return null;
  }
};
