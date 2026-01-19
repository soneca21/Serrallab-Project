import React from 'react';
import { Helmet } from 'react-helmet-async';
import ChannelsSettings from '@/features/settings/components/ChannelsSettings';
import AppSectionHeader from '@/components/AppSectionHeader';

const ConfigCanaisPage = () => (
    <>
        <Helmet>
            <title>Canais — Serrallab</title>
        </Helmet>
            <div className="w-full space-y-6">
            <AppSectionHeader
                title="Canais"
                description="Gerencie seus canais de comunicação e envios."
            />
            <div className="space-y-6 max-w-6xl">
                <ChannelsSettings />
            </div>
        </div>
    </>
);

export default ConfigCanaisPage;
