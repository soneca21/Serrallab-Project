
import React from 'react';
import MobileBottomNav from '@/components/MobileBottomNav';
import OfflineIndicator from '@/components/OfflineIndicator';
import { Toaster } from '@/components/ui/toaster';

interface MobileLayoutProps {
    children: React.ReactNode;
}

const MobileLayout: React.FC<MobileLayoutProps> = ({ children }) => {
    return (
        <div className="pwa-native-shell md:hidden">
            <OfflineIndicator />
            <main className="pwa-native-main overflow-x-hidden">
                <div className="pwa-native-content">
                    {children}
                </div>
            </main>
            <MobileBottomNav />
            <Toaster />
        </div>
    );
};

export default MobileLayout;
