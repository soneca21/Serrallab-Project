
import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { CreditCard, Calendar, Slack, Database, Mail } from 'lucide-react';
import { useConnections } from '@/features/connections/hooks/useConnections.ts';
import ConnectionCard from '@/features/connections/components/ConnectionCard.tsx';
import ConnectModal from '@/features/connections/components/ConnectModal.tsx';
import DisconnectConfirm from '@/features/connections/components/DisconnectConfirm.tsx';
import { Skeleton } from '@/components/ui/skeleton';

const INTEGRATIONS = [
    { id: 'stripe', label: 'Stripe', icon: CreditCard, description: 'Processamento de pagamentos e faturas automatizadas.' },
    { id: 'google_calendar', label: 'Google Calendar', icon: Calendar, description: 'Sincronize agendamentos e visitas técnicas.' },
    { id: 'slack', label: 'Slack', icon: Slack, description: 'Notificações de equipe em tempo real.' },
    { id: 'zapier', label: 'Zapier', icon: Database, description: 'Conecte com mais de 5000 apps via webhooks.' },
    { id: 'mailchimp', label: 'Mailchimp', icon: Mail, description: 'Sincronize contatos para campanhas de marketing.' },
];

const IntegracoesPage = () => {
    const { connections, loading, connect, disconnect } = useConnections();
    
    const [connectModal, setConnectModal] = useState({ isOpen: false, type: null });
    const [disconnectModal, setDisconnectModal] = useState({ isOpen: false, id: null, type: null });
    const [actionLoading, setActionLoading] = useState(false);

    const handleConnect = async (token, creds) => {
        const integration = INTEGRATIONS.find(c => c.id === connectModal.type);
        if(!integration) return;
        return await connect(integration.id, 'integration', token, creds);
    };

    const handleDisconnect = async () => {
        if(!disconnectModal.id) return;
        setActionLoading(true);
        await disconnect(disconnectModal.id);
        setActionLoading(false);
        setDisconnectModal({ isOpen: false, id: null, type: null });
    };

    return (
        <>
            <Helmet><title>Integrações — Serrallab</title></Helmet>
            <div className="space-y-6 w-full max-w-6xl mx-auto">
                 <div>
                    <h2 className="text-3xl font-heading font-bold">Integrações</h2>
                    <p className="text-muted-foreground">Conecte ferramentas externas para turbinar sua serralheria.</p>
                </div>

                {loading ? (
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
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {INTEGRATIONS.map((integration) => {
                            const connection = connections.find(c => c.type === integration.id && c.category === 'integration');
                            return (
                                <ConnectionCard
                                    key={integration.id}
                                    type={integration.id}
                                    label={integration.label}
                                    description={integration.description}
                                    icon={integration.icon}
                                    status={connection?.status || 'disconnected'}
                                    connectedAt={connection?.connected_at}
                                    onConnect={() => setConnectModal({ isOpen: true, type: integration.id })}
                                    onDisconnect={() => setDisconnectModal({ isOpen: true, id: connection.id, type: integration.id })}
                                    isLoading={actionLoading && disconnectModal.id === connection?.id}
                                />
                            );
                        })}
                    </div>
                )}

                {/* Modals */}
                <ConnectModal 
                    isOpen={connectModal.isOpen}
                    onClose={() => setConnectModal({ isOpen: false, type: null })}
                    type={connectModal.type || ''}
                    label={INTEGRATIONS.find(c => c.id === connectModal.type)?.label || ''}
                    category="integration"
                    onConnect={handleConnect}
                />

                <DisconnectConfirm
                    isOpen={disconnectModal.isOpen}
                    onClose={() => setDisconnectModal({ isOpen: false, id: null, type: null })}
                    onConfirm={handleDisconnect}
                    label={INTEGRATIONS.find(c => c.id === disconnectModal.type)?.label || ''}
                    loading={actionLoading}
                />
            </div>
        </>
    );
};

export default IntegracoesPage;
