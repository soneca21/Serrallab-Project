
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';

// Components
import ProfileSettings from './components/ProfileSettings';
import CompanySettings from './components/CompanySettings';
import TeamSettings from './components/TeamSettings';
import BillingSettings from './components/BillingSettings';
import SecuritySettings from './components/SecuritySettings';
import ChannelsSettings from './components/ChannelsSettings';
import NotificationSettings from './components/NotificationSettings';
import AuditLogs from './components/AuditLogs';

const COMPONENTS = {
    profile: ProfileSettings,
    company: CompanySettings,
    team: TeamSettings,
    billing: BillingSettings,
    channels: ChannelsSettings,
    notifications: NotificationSettings,
    security: SecuritySettings,
    audit: AuditLogs,
};

const SettingsLayout = () => {
    const [searchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'profile';
    
    // Fallback to ProfileSettings if tab is invalid
    const ActiveComponent = COMPONENTS[activeTab] || ProfileSettings;

    return (
        <div className="w-full">
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="w-full"
                >
                    <ActiveComponent />
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default SettingsLayout;
