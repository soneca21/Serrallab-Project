
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileHeaderProps {
    title: string;
    description?: string;
    onBack?: () => void;
    onMenu?: () => void;
    className?: string;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({ title, description, onBack, onMenu, className }) => {
    return (
        <header
            className={cn(
                'pwa-native-header fixed top-0 left-0 right-0 z-50 flex items-center gap-3 px-3 py-3 border-b border-border',
                className
            )}
        >
            <div className="flex items-center w-11 flex-shrink-0">
                {onBack && (
                    <Button variant="ghost" size="icon" onClick={onBack} className="h-9 w-9 rounded-xl">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                )}
            </div>

            <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                <h1 className="text-xl font-heading font-bold text-foreground tracking-tight truncate">
                    {title}
                </h1>
                {description && (
                    <p className="text-sm text-muted-foreground leading-snug line-clamp-2">
                        {description}
                    </p>
                )}
            </div>

            <div className="flex items-center w-11 flex-shrink-0 justify-end">
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
