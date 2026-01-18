
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ConnectionCardProps {
    type: string;
    label: string;
    description: string;
    icon: React.ElementType;
    status?: 'connected' | 'disconnected' | 'error';
    connectedAt?: string;
    onConnect: () => void;
    onDisconnect: () => void;
    isLoading?: boolean;
}

const ConnectionCard = ({ 
    type, 
    label, 
    description, 
    icon: Icon, 
    status = 'disconnected', 
    connectedAt,
    onConnect,
    onDisconnect,
    isLoading 
}: ConnectionCardProps) => {
    
    const isConnected = status === 'connected';

    return (
        <Card className={cn(
            "rounded-xl border transition-all duration-200 hover:shadow-lg",
            isConnected ? "border-primary/20 bg-primary/5" : "border-surface-strong bg-card"
        )}>
            <CardContent className="p-6 flex flex-col h-full justify-between gap-4">
                <div className="flex justify-between items-start">
                    <div className={cn(
                        "p-3 rounded-xl",
                        isConnected ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "bg-surface-strong text-muted-foreground"
                    )}>
                        <Icon className="h-6 w-6" />
                    </div>
                    <Badge variant={isConnected ? "success" : status === 'error' ? "destructive" : "secondary"}>
                        {isConnected ? "Conectado" : status === 'error' ? "Erro" : "Desconectado"}
                    </Badge>
                </div>

                <div>
                    <h3 className="font-heading font-bold text-lg">{label}</h3>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{description}</p>
                </div>

                <div className="pt-4 border-t border-border/50 flex flex-col gap-3">
                    {isConnected && connectedAt && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 text-success" />
                            Ativo desde {format(new Date(connectedAt), "dd MMM, yyyy", { locale: ptBR })}
                        </div>
                    )}
                    
                    {isConnected ? (
                        <Button 
                            variant="outline" 
                            className="w-full border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive/50"
                            onClick={onDisconnect}
                            disabled={isLoading}
                        >
                            Desconectar
                        </Button>
                    ) : (
                        <Button 
                            className="w-full"
                            onClick={onConnect}
                            disabled={isLoading}
                        >
                            Conectar
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default ConnectionCard;
