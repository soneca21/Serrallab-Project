import React from 'react';
import { AlertTriangle, CheckCircle2, Clock3, Loader2, WifiOff, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SystemStatus =
    | 'pending'
    | 'synced'
    | 'failed'
    | 'offline'
    | 'syncing'
    | 'warning'
    | 'error';

const STATUS_META: Record<SystemStatus, { label: string; icon: React.ElementType; toneClass: string; chipClass: string }> = {
    pending: {
        label: 'Pendente',
        icon: Clock3,
        toneClass: 'text-warning',
        chipClass: 'pwa-status-chip pwa-status-chip--pending',
    },
    synced: {
        label: 'Sincronizado',
        icon: CheckCircle2,
        toneClass: 'text-success',
        chipClass: 'pwa-status-chip pwa-status-chip--synced',
    },
    failed: {
        label: 'Falhou',
        icon: XCircle,
        toneClass: 'text-error',
        chipClass: 'pwa-status-chip pwa-status-chip--failed',
    },
    offline: {
        label: 'Offline',
        icon: WifiOff,
        toneClass: 'text-offline',
        chipClass: 'pwa-status-chip pwa-status-chip--offline',
    },
    syncing: {
        label: 'Sincronizando',
        icon: Loader2,
        toneClass: 'text-syncing',
        chipClass: 'pwa-status-chip pwa-status-chip--syncing',
    },
    warning: {
        label: 'Atencao',
        icon: AlertTriangle,
        toneClass: 'text-warning',
        chipClass: 'pwa-status-chip pwa-status-chip--pending',
    },
    error: {
        label: 'Erro',
        icon: AlertTriangle,
        toneClass: 'text-error',
        chipClass: 'pwa-status-chip pwa-status-chip--failed',
    },
};

export function getSystemStatusMeta(status: SystemStatus) {
    return STATUS_META[status];
}

type SystemStatusChipProps = {
    status: SystemStatus;
    className?: string;
    label?: string;
    prefix?: string;
};

export const SystemStatusChip: React.FC<SystemStatusChipProps> = ({ status, className, label, prefix }) => {
    const meta = getSystemStatusMeta(status);
    const Icon = meta.icon;
    const text = `${prefix ? `${prefix}: ` : ''}${label || meta.label}`;

    return (
        <span className={cn(meta.chipClass, className)}>
            <Icon className={cn('h-3 w-3 mr-1.5', status === 'syncing' && 'animate-spin')} aria-hidden="true" />
            {text}
        </span>
    );
};

type SystemStatusInlineProps = {
    status: SystemStatus;
    className?: string;
    label?: string;
};

export const SystemStatusInline: React.FC<SystemStatusInlineProps> = ({ status, className, label }) => {
    const meta = getSystemStatusMeta(status);
    const Icon = meta.icon;
    return (
        <div className={cn('flex items-center gap-2 text-xs', meta.toneClass, className)} role="status" aria-live="polite" aria-atomic="true">
            <Icon className={cn('h-3 w-3', status === 'syncing' && 'animate-spin')} aria-hidden="true" />
            <span>{label || meta.label}</span>
        </div>
    );
};
