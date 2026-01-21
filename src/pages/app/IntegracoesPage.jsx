import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { MessageSquare, Smartphone, CreditCard, Calendar, FileSpreadsheet, Building2, Mail, Workflow } from 'lucide-react';
import { useConnections } from '@/features/connections/hooks/useConnections.ts';
import ConnectionCard from '@/features/connections/components/ConnectionCard.tsx';
import ConnectModal from '@/features/connections/components/ConnectModal.tsx';
import DisconnectConfirm from '@/features/connections/components/DisconnectConfirm.tsx';
import { Skeleton } from '@/components/ui/skeleton';
import AppSectionHeader from '@/components/AppSectionHeader';

const INTEGRATIONS = [
    { id: 'whatsapp', label: 'WhatsApp (Twilio)', provider: 'twilio', icon: MessageSquare, description: 'Envie alertas, follow-ups e confirmacoes via WhatsApp Business.' },
    { id: 'sms', label: 'SMS (Twilio)', provider: 'twilio', icon: Smartphone, description: 'Dispare avisos e lembretes por SMS em escala.' },
    { id: 'sendgrid', label: 'Email (SendGrid)', icon: Mail, description: 'Emails transacionais e comunicados automaticos.' },
    { id: 'mercado_pago', label: 'Mercado Pago', icon: CreditCard, description: 'Receba via PIX e cartao com links de pagamento.' },
    { id: 'google_calendar', label: 'Google Calendar', icon: Calendar, description: 'Sincronize agendamentos da equipe em tempo real.' },
    { id: 'google_sheets', label: 'Google Sheets', icon: FileSpreadsheet, description: 'Exporte leads e orcamentos para planilhas.' },
    { id: 'conta_azul', label: 'Conta Azul', icon: Building2, description: 'Integre financeiro e emissao de cobrancas.' },
    { id: 'zapier_make', label: 'Zapier/Make', icon: Workflow, description: 'Automatize integracoes com outros sistemas.' },
];

const IntegracoesPage = () => {
    const { connections, loading, connect, disconnect } = useConnections();

    const [connectModal, setConnectModal] = useState({ isOpen: false, type: null });
    const [disconnectModal, setDisconnectModal] = useState({ isOpen: false, id: null, type: null });
    const [actionLoading, setActionLoading] = useState(false);

    const handleConnect = async (token, creds) => {
        const integration = INTEGRATIONS.find(c => c.id === connectModal.type);
        if (!integration) return;
        const nextCreds = integration.provider ? { ...creds, provider: integration.provider } : creds;
        return await connect(integration.id, 'integration', token, nextCreds);
    };

    const handleDisconnect = async () => {
        if (!disconnectModal.id) return;
        setActionLoading(true);
        await disconnect(disconnectModal.id);
        setActionLoading(false);
        setDisconnectModal({ isOpen: false, id: null, type: null });
    };

    return (
        <>
            <Helmet><title>Integracoes - Serrallab</title></Helmet>
            <div className="space-y-6 w-full max-w-full">
                <AppSectionHeader
                    title={<span className="pl-3 border-l-4 border-primary">Integracoes</span>}
                    description="Conecte ferramentas essenciais para cobranca, comunicacao e operacao diaria."
                    actions={null}
                />

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
