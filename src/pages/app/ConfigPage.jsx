import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useSearchParams } from 'react-router-dom';
import SettingsLayout from '@/features/settings/SettingsLayout';
import AppSectionHeader from '@/components/AppSectionHeader';

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
                <SettingsLayout />
            </div>
        </>
    );
};

export default ConfigPage;
