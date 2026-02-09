import React, { useId } from 'react';
import { AlertTriangle, CheckCircle2, Inbox, Loader2, WifiOff } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

type OperationalStateKind = 'loading' | 'empty' | 'error' | 'offline-empty' | 'synced';

interface OperationalStateCardProps {
    kind: OperationalStateKind;
    title?: string;
    description?: string;
    onPrimaryAction?: () => void;
    primaryActionLabel?: string;
    onSecondaryAction?: () => void;
    secondaryActionLabel?: string;
    loadingRows?: number;
}

const styleByKind: Record<OperationalStateKind, string> = {
    loading: 'pwa-state--loading',
    empty: 'pwa-state--empty',
    error: 'pwa-state--error',
    'offline-empty': 'pwa-state--offline-empty',
    synced: 'pwa-state--synced',
};

const iconByKind: Record<OperationalStateKind, React.ReactNode> = {
    loading: <Loader2 className="h-5 w-5 text-primary animate-spin" />,
    empty: <Inbox className="h-5 w-5 text-muted-foreground" />,
    error: <AlertTriangle className="h-5 w-5 text-error" />,
    'offline-empty': <WifiOff className="h-5 w-5 text-offline" />,
    synced: <CheckCircle2 className="h-5 w-5 text-success" />,
};

const defaultCopy: Record<OperationalStateKind, { title: string; description: string; action: string }> = {
    loading: {
        title: 'Carregando dados',
        description: 'Buscando dados locais e verificando sincronizacao.',
        action: 'Atualizar',
    },
    empty: {
        title: 'Nenhum dado disponivel',
        description: 'Nao ha registros para exibir neste momento.',
        action: 'Atualizar',
    },
    error: {
        title: 'Falha ao carregar dados',
        description: 'Nao foi possivel concluir a leitura. Tente novamente.',
        action: 'Tentar novamente',
    },
    'offline-empty': {
        title: 'Sem cache inicial',
        description: 'Conecte-se a internet ao menos uma vez para baixar os dados deste modulo.',
        action: 'Tentar novamente',
    },
    synced: {
        title: 'Dados sincronizados',
        description: 'As informacoes locais estao atualizadas.',
        action: 'Sincronizar agora',
    },
};

const OperationalStateCard: React.FC<OperationalStateCardProps> = ({
    kind,
    title,
    description,
    onPrimaryAction,
    primaryActionLabel,
    onSecondaryAction,
    secondaryActionLabel,
    loadingRows = 3,
}) => {
    const titleId = useId();
    const descriptionId = useId();
    const prefersReducedMotion = useReducedMotion();
    const copy = defaultCopy[kind];
    const resolvedTitle = title || copy.title;
    const resolvedDescription = description || copy.description;
    const resolvedActionLabel = primaryActionLabel || copy.action;
    const statusRole = kind === 'error' || kind === 'offline-empty' ? 'alert' : 'status';
    const ariaLive = kind === 'error' || kind === 'offline-empty' ? 'assertive' : 'polite';

    return (
        <AnimatePresence mode="wait" initial={false}>
            <motion.div
                key={kind}
                initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 6, scale: 0.995 }}
                animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
                exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -4, scale: 0.995 }}
                transition={{ duration: prefersReducedMotion ? 0.05 : 0.18, ease: 'easeOut' }}
            >
                <Card
                    className={styleByKind[kind]}
                    role={statusRole}
                    aria-live={ariaLive}
                    aria-atomic="true"
                    aria-busy={kind === 'loading'}
                    aria-labelledby={titleId}
                    aria-describedby={descriptionId}
                >
                    <CardContent className="pwa-surface-pad space-y-3">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5" aria-hidden="true">{iconByKind[kind]}</div>
                                <div className="space-y-1">
                                    <p id={titleId} className="pwa-type-subtitle">{resolvedTitle}</p>
                                    <p id={descriptionId} className="pwa-type-body text-muted-foreground">{resolvedDescription}</p>
                                </div>
                            </div>
                            {onPrimaryAction && kind !== 'loading' && (
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" onClick={onPrimaryAction}>
                                        {resolvedActionLabel}
                                    </Button>
                                    {onSecondaryAction && secondaryActionLabel && (
                                        <Button variant="ghost" size="sm" onClick={onSecondaryAction}>
                                            {secondaryActionLabel}
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>

                        {kind === 'loading' && (
                            <div className="space-y-2">
                                {Array.from({ length: Math.max(1, loadingRows) }).map((_, index) => (
                                    <Skeleton key={index} className="h-10 w-full rounded-lg" />
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        </AnimatePresence>
    );
};

export default OperationalStateCard;
