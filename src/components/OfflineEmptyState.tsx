import React from 'react';
import { WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface OfflineEmptyStateProps {
    title: string;
    description: string;
    onRetry?: () => void;
}

const OfflineEmptyState: React.FC<OfflineEmptyStateProps> = ({ title, description, onRetry }) => {
    return (
        <Card className="border-dashed border-border/70 bg-card/60">
            <CardContent className="py-8 px-5 text-center space-y-3">
                <div className="mx-auto h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                    <WifiOff className="h-5 w-5 text-destructive" />
                </div>
                <div>
                    <p className="font-semibold text-sm">{title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{description}</p>
                </div>
                {onRetry && (
                    <Button variant="outline" size="sm" onClick={onRetry}>
                        Tentar novamente
                    </Button>
                )}
            </CardContent>
        </Card>
    );
};

export default OfflineEmptyState;
