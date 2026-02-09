
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileHeaderProps {
    title: string;
    onBack?: () => void;
    onMenu?: () => void;
    className?: string;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({ title, onBack, onMenu, className }) => {
    return (
        <header
            className={cn(
                'pwa-native-header fixed top-0 left-0 right-0 z-50 flex items-center px-3 justify-between',
                className
            )}
        >
            <div className="flex items-center w-11">
                {onBack && (
                    <Button variant="ghost" size="icon" onClick={onBack} className="h-9 w-9 rounded-xl">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                )}
            </div>
            
            <h1 className="pwa-type-subtitle truncate text-center flex-1 tracking-tight">
                {title}
            </h1>

            <div className="flex items-center w-11 justify-end">
                {onMenu && (
                    <Button variant="ghost" size="icon" onClick={onMenu} className="h-9 w-9 rounded-xl">
                        <Menu className="h-5 w-5" />
                    </Button>
                )}
            </div>
        </header>
    );
};

export default MobileHeader;
