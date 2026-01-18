
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert.jsx";

interface ConnectModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: string;
    label: string;
    category: 'channel' | 'integration';
    onConnect: (token: string, credentials?: any) => Promise<boolean>;
}

const INSTRUCTIONS: Record<string, string> = {
    whatsapp: 'Insira seu token de API do WhatsApp Business ou provedor parceiro (ex: Twilio, Gupshup).',
    telegram: 'Insira o token do seu Bot obtido com o @BotFather.',
    stripe: 'Insira sua chave secreta (Secret Key) do Stripe. Começa geralmente com "sk_".',
    zapier: 'Gere um Webhook Key no painel do Zapier e cole aqui.',
    email: 'Configure suas credenciais SMTP ou API Key do provedor (SendGrid, AWS SES).',
    sms: 'Insira suas credenciais do provedor de SMS (Twilio Account SID & Auth Token).',
    default: 'Insira o token de acesso ou chave de API para conectar.'
};

const ConnectModal = ({ isOpen, onClose, type, label, category, onConnect }: ConnectModalProps) => {
    const [token, setToken] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        
        if (!token.trim()) {
            setError('O token/chave é obrigatório.');
            return;
        }

        setLoading(true);
        try {
            const success = await onConnect(token, {}); // Extend for complex creds if needed
            if (success) {
                setToken('');
                onClose();
            }
        } catch (err) {
            setError('Ocorreu um erro ao conectar.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Conectar {label}</DialogTitle>
                    <DialogDescription>
                        Integre o {label} ao seu sistema para automatizar fluxos.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-4">
                     <Alert variant="default" className="bg-primary/5 border-primary/20 text-foreground">
                        <ExternalLink className="h-4 w-4 text-primary" />
                        <AlertTitle className="text-primary font-semibold ml-2">Como obter?</AlertTitle>
                        <AlertDescription className="ml-2 text-muted-foreground mt-1">
                            {INSTRUCTIONS[type] || INSTRUCTIONS.default}
                        </AlertDescription>
                    </Alert>

                    <form id="connect-form" onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="token">Token de Acesso / API Key</Label>
                            <Input
                                id="token"
                                type="password"
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                                placeholder="sk_test_..."
                                className="font-mono text-sm"
                                disabled={loading}
                            />
                        </div>
                        {error && <p className="text-sm text-destructive font-medium">{error}</p>}
                    </form>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={loading}>Cancelar</Button>
                    <Button type="submit" form="connect-form" disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Conectar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ConnectModal;
