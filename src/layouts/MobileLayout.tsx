
import React from 'react';
import MobileBottomNav from '@/components/MobileBottomNav';
import OfflineIndicator from '@/components/OfflineIndicator';
import InstallPrompt from '@/components/InstallPrompt';
import { Toaster } from '@/components/ui/toaster';

interface MobileLayoutProps {
    children: React.ReactNode;
}

const MobileLayout: React.FC<MobileLayoutProps> = ({ children }) => {
    return (
        <div className="min-h-screen bg-background text-foreground pb-20">
            <OfflineIndicator />
            <main className="flex-1 overflow-x-hidden">
                {children}
            </main>
            <InstallPrompt />
            <MobileBottomNav />
            <Toaster />
        </div>
    );
};

export default MobileLayout;
