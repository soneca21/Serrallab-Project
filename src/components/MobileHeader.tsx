
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
        <header className={cn("sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border h-14 flex items-center px-4 justify-between", className)}>
            <div className="flex items-center w-10">
                {onBack && (
                    <Button variant="ghost" size="icon" onClick={onBack} className="h-10 w-10">
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                )}
            </div>
            
            <h1 className="text-lg font-heading font-semibold truncate text-center flex-1">
                {title}
            </h1>

            <div className="flex items-center w-10 justify-end">
                {onMenu && (
                    <Button variant="ghost" size="icon" onClick={onMenu} className="h-10 w-10">
                        <Menu className="h-6 w-6" />
                    </Button>
                )}
            </div>
        </header>
    );
};

export default MobileHeader;
