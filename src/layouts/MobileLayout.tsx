
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
                {children}
            </main>
            <MobileBottomNav />
            <Toaster />
        </div>
    );
};

export default MobileLayout;
