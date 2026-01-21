import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useSearchParams } from 'react-router-dom';
import SettingsLayout from '@/features/settings/SettingsLayout';
import AppSectionHeader from '@/components/AppSectionHeader';

const TAB_LABELS = {
    profile: 'Perfil',
    company: 'Organização',
    team: 'Equipe',
    billing: 'Planos',
    channels: 'Canais',
    notifications: 'Notificações',
    security: 'Segurança',
};

const ConfigPage = () => {
    const [searchParams] = useSearchParams();
    const tab = searchParams.get('tab') || 'profile';
    const label = TAB_LABELS[tab] || TAB_LABELS.profile;

    return (
        <>
            <Helmet>
                <title>Configurações - Serrallab</title>
            </Helmet>
            <div className="w-full space-y-6">
                <AppSectionHeader
                    title={label}
                    description={'Ajuste sua conta, equipe, notificações e integrações em um só lugar.'}
                />
                <SettingsLayout />
            </div>
        </>
    );
};

export default ConfigPage;
