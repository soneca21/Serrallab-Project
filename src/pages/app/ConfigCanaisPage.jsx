
import React from 'react';
import { Helmet } from 'react-helmet-async';
import ChannelsSettings from '@/features/settings/components/ChannelsSettings';

const ConfigCanaisPage = () => {
    return (
        <>
            <Helmet><title>Canais — Serrallab</title></Helmet>
            <div className="space-y-6 w-full max-w-6xl mx-auto">
                 <div>
                    <h2 className="text-3xl font-heading font-bold">Canais</h2>
                    <p className="text-muted-foreground">Gerencie seus canais de comunicação.</p>
                </div>
                <ChannelsSettings />
            </div>
        </>
    );
};

export default ConfigCanaisPage;
