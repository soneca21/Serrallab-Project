import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert.jsx';

interface ConnectModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: string;
    label: string;
    category: 'channel' | 'integration';
    onConnect: (token: string, credentials?: any) => Promise<boolean>;
}

const INSTRUCTIONS: Record<string, string> = {
    whatsapp: 'Informe o Account SID e o Auth Token da Twilio para WhatsApp.',
    sms: 'Informe o Account SID e o Auth Token da Twilio para SMS.',
    telegram: 'Insira o token do seu Bot obtido com o @BotFather.',
    stripe: 'Insira sua chave secreta (Secret Key) do Stripe. Comeca geralmente com "sk_".',
    zapier: 'Gere um Webhook Key no painel do Zapier e cole aqui.',
    email: 'Configure suas credenciais SMTP ou API Key do provedor (SendGrid, AWS SES).',
    default: 'Insira o token de acesso ou chave de API para conectar.'
};

const ConnectModal = ({ isOpen, onClose, type, label, category, onConnect }: ConnectModalProps) => {
    const [token, setToken] = useState('');
    const [accountSid, setAccountSid] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isTwilio = type === 'whatsapp' || type === 'sms';
    const instruction = INSTRUCTIONS[type] || INSTRUCTIONS.default;

    useEffect(() => {
        if (!isOpen) return;
        setToken('');
        setAccountSid('');
        setError(null);
    }, [isOpen, type]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (isTwilio && !accountSid.trim()) {
            setError('O Account SID e obrigatorio.');
            return;
        }

        if (!token.trim()) {
            setError('O Auth Token e obrigatorio.');
            return;
        }

        setLoading(true);
        try {
            const credentials = isTwilio ? { provider: 'twilio', account_sid: accountSid.trim() } : {};
            const success = await onConnect(token.trim(), credentials);
            if (success) {
                setToken('');
                setAccountSid('');
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
                            {instruction}
                        </AlertDescription>
                    </Alert>

                    <form id="connect-form" onSubmit={handleSubmit} className="space-y-4">
                        {isTwilio && (
                            <div className="space-y-2">
                                <Label htmlFor="accountSid">Account SID</Label>
                                <Input
                                    id="accountSid"
                                    type="text"
                                    value={accountSid}
                                    onChange={(e) => setAccountSid(e.target.value)}
                                    placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                                    className="font-mono text-sm"
                                    disabled={loading}
                                />
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="token">Auth Token / API Key</Label>
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
