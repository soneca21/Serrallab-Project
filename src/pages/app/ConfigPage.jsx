import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useSearchParams } from 'react-router-dom';
import SettingsLayout from '@/features/settings/SettingsLayout';
import AppSectionHeader from '@/components/AppSectionHeader';
import { Button } from '@/components/ui/button';

const TAB_LABELS = {
    profile: 'Perfil',
    company: 'Organiza\u00e7\u00e3o',
    team: 'Equipe',
    billing: 'Planos',
    channels: 'Canais',
    notifications: 'Notifica\u00e7\u00f5es',
    security: 'Seguran\u00e7a',
};

const ConfigPage = () => {
    const [searchParams] = useSearchParams();
    const tab = searchParams.get('tab') || 'profile';
    const label = TAB_LABELS[tab] || TAB_LABELS.profile;

    return (
        <>
            <Helmet>
                <title>Configura\u00e7\u00f5es - Serrallab</title>
            </Helmet>
            <div className="w-full space-y-6">
                <AppSectionHeader
                    title={label}
                    description={'Ajuste sua conta, equipe, notifica\u00e7\u00f5es e integra\u00e7\u00f5es em um s\u00f3 lugar.'}
                />
                <div className="rounded-xl border border-border/60 bg-card/40 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="space-y-1">
                        <p className="font-medium">Sincroniza\u00e7\u00e3o</p>
                        <p className="text-sm text-muted-foreground">Central de fila e reprocessamento de pend\u00eancias offline.</p>
                    </div>
                    <Button asChild variant="outline" className="w-full sm:w-auto">
                        <Link to="/app/sincronizacao">Abrir central</Link>
                    </Button>
                </div>
                <SettingsLayout />
            </div>
        </>
    );
};

export default ConfigPage;
