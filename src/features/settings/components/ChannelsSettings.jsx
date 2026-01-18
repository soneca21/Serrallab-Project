
import React, { useState } from 'react';
import { MessageSquare, Send, Instagram, Facebook, Mail, Phone, Loader2 } from 'lucide-react';
import { useConnections } from '@/features/connections/hooks/useConnections.ts';
import ConnectionCard from '@/features/connections/components/ConnectionCard.tsx';
import ConnectModal from '@/features/connections/components/ConnectModal.tsx';
import DisconnectConfirm from '@/features/connections/components/DisconnectConfirm.tsx';
import { Skeleton } from '@/components/ui/skeleton';

const CHANNELS = [
    { id: 'whatsapp', label: 'WhatsApp', icon: Phone, description: 'Envie orçamentos e notificações automáticas via WhatsApp.' },
    { id: 'telegram', label: 'Telegram', icon: Send, description: 'Receba alertas de novos leads e atualizações de status.' },
    { id: 'instagram', label: 'Instagram', icon: Instagram, description: 'Responda a DMs e interaja com clientes diretamente.' },
    { id: 'facebook', label: 'Facebook', icon: Facebook, description: 'Conecte sua página para gerenciar mensagens.' },
    { id: 'email', label: 'Email', icon: Mail, description: 'Configure seu SMTP para envio de propostas profissionais.' },
    { id: 'sms', label: 'SMS', icon: MessageSquare, description: 'Envie lembretes curtos e códigos de verificação.' },
];

const ChannelsSettings = () => {
    const { connections, loading, connect, disconnect } = useConnections();
    
    const [connectModal, setConnectModal] = useState({ isOpen: false, type: null });
    const [disconnectModal, setDisconnectModal] = useState({ isOpen: false, id: null, type: null });
    const [actionLoading, setActionLoading] = useState(false);

    const handleConnect = async (token, creds) => {
        const channel = CHANNELS.find(c => c.id === connectModal.type);
        if(!channel) return;
        return await connect(channel.id, 'channel', token, creds);
    };

    const handleDisconnect = async () => {
        if(!disconnectModal.id) return;
        setActionLoading(true);
        await disconnect(disconnectModal.id);
        setActionLoading(false);
        setDisconnectModal({ isOpen: false, id: null, type: null });
    };

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-64 rounded-xl border border-surface-strong bg-surface p-6 space-y-4">
                        <Skeleton className="h-10 w-10 rounded-lg" />
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-10 w-full mt-auto" />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-heading font-semibold text-foreground">Canais de Comunicação</h3>
                <p className="text-sm text-muted-foreground">Conecte-se com seus clientes através das plataformas que eles mais usam.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {CHANNELS.map((channel) => {
                    const connection = connections.find(c => c.type === channel.id && c.category === 'channel');
                    return (
                        <ConnectionCard
                            key={channel.id}
                            type={channel.id}
                            label={channel.label}
                            description={channel.description}
                            icon={channel.icon}
                            status={connection?.status || 'disconnected'}
                            connectedAt={connection?.connected_at}
                            onConnect={() => setConnectModal({ isOpen: true, type: channel.id })}
                            onDisconnect={() => setDisconnectModal({ isOpen: true, id: connection.id, type: channel.id })}
                            isLoading={actionLoading && disconnectModal.id === connection?.id}
                        />
                    );
                })}
            </div>

            {/* Modals */}
            <ConnectModal 
                isOpen={connectModal.isOpen}
                onClose={() => setConnectModal({ isOpen: false, type: null })}
                type={connectModal.type || ''}
                label={CHANNELS.find(c => c.id === connectModal.type)?.label || ''}
                category="channel"
                onConnect={handleConnect}
            />

            <DisconnectConfirm
                isOpen={disconnectModal.isOpen}
                onClose={() => setDisconnectModal({ isOpen: false, id: null, type: null })}
                onConfirm={handleDisconnect}
                label={CHANNELS.find(c => c.id === disconnectModal.type)?.label || ''}
                loading={actionLoading}
            />
        </div>
    );
};

export default ChannelsSettings;
