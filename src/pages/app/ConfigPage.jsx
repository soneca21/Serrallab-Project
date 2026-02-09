import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useSearchParams } from 'react-router-dom';
import SettingsLayout from '@/features/settings/SettingsLayout';
import AppSectionHeader from '@/components/AppSectionHeader';
import { Button } from '@/components/ui/button';

const TAB_LABELS = {
    profile: 'Perfil',
    company: 'Organizacao',
    team: 'Equipe',
    billing: 'Planos',
    channels: 'Canais',
    notifications: 'Notificacoes',
    security: 'Seguranca',
};

const ConfigPage = () => {
    const [searchParams] = useSearchParams();
    const tab = searchParams.get('tab') || 'profile';
    const label = TAB_LABELS[tab] || TAB_LABELS.profile;

    return (
        <>
            <Helmet>
                <title>Configuracoes - Serrallab</title>
            </Helmet>
            <div className="w-full space-y-6">
                <AppSectionHeader
                    title={label}
                    description={'Ajuste sua conta, equipe, notificacoes e integracoes em um so lugar.'}
                />
                <div className="rounded-xl border border-border/60 bg-card/40 p-4 flex items-center justify-between gap-3">
                    <div>
                        <p className="font-medium">Sincronizacao</p>
                        <p className="text-sm text-muted-foreground">Central de fila e reprocessamento de pendencias offline.</p>
                    </div>
                    <Button asChild variant="outline">
                        <Link to="/app/sincronizacao">Abrir central</Link>
                    </Button>
                </div>
                <SettingsLayout />
            </div>
        </>
    );
};

export default ConfigPage;
