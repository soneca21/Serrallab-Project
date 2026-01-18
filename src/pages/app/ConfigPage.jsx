
import React from 'react';
import { Helmet } from 'react-helmet-async';
import SettingsLayout from '@/features/settings/SettingsLayout';

const ConfigPage = () => {
    return (
        <>
            <Helmet><title>Configurações — Serrallab</title></Helmet>
            <div className="w-full">
                <SettingsLayout />
            </div>
        </>
    );
};

export default ConfigPage;
