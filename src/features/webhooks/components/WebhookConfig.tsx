
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Webhook } from '@/types/webhooks';
import { createWebhook, updateWebhook, deleteWebhook, regenerateSecret } from '@/features/webhooks/api/webhooks';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Copy, RefreshCw, Trash2, Save, Eye, EyeOff } from 'lucide-react';
import ConfirmDialog from '@/components/ConfirmDialog';

interface WebhookConfigProps {
    webhook: Webhook | null;
    onSave: (webhook: Webhook | null) => void;
}

const WebhookConfig: React.FC<WebhookConfigProps> = ({ webhook, onSave }) => {
    const { toast } = useToast();
    const [endpoint, setEndpoint] = useState(webhook?.endpoint_url || '');
    const [isEnabled, setIsEnabled] = useState(webhook?.enabled ?? true);
    const [isLoading, setIsLoading] = useState(false);
    const [showSecret, setShowSecret] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    // Update local state when prop changes
    React.useEffect(() => {
        if (webhook) {
            setEndpoint(webhook.endpoint_url);
            setIsEnabled(webhook.enabled);
        } else {
            setEndpoint('');
            setIsEnabled(true);
        }
    }, [webhook]);

    const handleSave = async () => {
        if (!endpoint) {
            toast({ title: 'Erro', description: 'URL do endpoint é obrigatória', variant: 'destructive' });
            return;
        }

        setIsLoading(true);
        try {
            let savedWebhook;
            if (webhook) {
                savedWebhook = await updateWebhook(webhook.id, { endpoint_url: endpoint, enabled: isEnabled });
                toast({ title: 'Webhook atualizado com sucesso' });
            } else {
                savedWebhook = await createWebhook(endpoint);
                toast({ title: 'Webhook criado com sucesso' });
            }
            onSave(savedWebhook);
        } catch (error: any) {
            toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!webhook) return;
        setIsLoading(true);
        try {
            await deleteWebhook(webhook.id);
            toast({ title: 'Webhook excluído' });
            onSave(null);
        } catch (error: any) {
            toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' });
        } finally {
            setIsLoading(false);
            setDeleteDialogOpen(false);
        }
    };

    const handleRegenerateSecret = async () => {
        if (!webhook) return;
        setIsLoading(true);
        try {
            const updated = await regenerateSecret(webhook.id);
            toast({ title: 'Segredo regenerado' });
            onSave(updated);
        } catch (error: any) {
            toast({ title: 'Erro', description: error.message, variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };

    const copySecret = () => {
        if (webhook?.secret) {
            navigator.clipboard.writeText(webhook.secret);
            toast({ title: 'Segredo copiado para área de transferência' });
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>Configuração do Webhook</CardTitle>
                        <CardDescription>Receba notificações de eventos em tempo real no seu sistema.</CardDescription>
                    </div>
                    {webhook && (
                        <div className="flex items-center space-x-2">
                            <Label htmlFor="enabled-mode">{isEnabled ? 'Ativado' : 'Desativado'}</Label>
                            <Switch id="enabled-mode" checked={isEnabled} onCheckedChange={setIsEnabled} />
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label>URL do Endpoint (POST)</Label>
                    <Input 
                        placeholder="https://seu-sistema.com/api/webhook" 
                        value={endpoint} 
                        onChange={(e) => setEndpoint(e.target.value)} 
                    />
                </div>

                {webhook && (
                    <div className="space-y-2">
                        <Label>Segredo de Assinatura (HMAC SHA256)</Label>
                        <div className="flex space-x-2">
                            <div className="relative flex-grow">
                                <Input 
                                    readOnly 
                                    value={showSecret ? webhook.secret : '••••••••••••••••••••••••••••••••'} 
                                    className="pr-10 font-mono"
                                />
                                <button 
                                    onClick={() => setShowSecret(!showSecret)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                >
                                    {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            <Button variant="outline" size="icon" onClick={copySecret} title="Copiar Segredo">
                                <Copy className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="icon" onClick={handleRegenerateSecret} title="Regenerar Segredo">
                                <RefreshCw className="h-4 w-4" />
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">Use este segredo para validar a assinatura `X-Serrallab-Signature`.</p>
                    </div>
                )}
            </CardContent>
            <CardFooter className="flex justify-between">
                {webhook ? (
                    <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)} disabled={isLoading}>
                        <Trash2 className="mr-2 h-4 w-4" /> Excluir
                    </Button>
                ) : <div />}
                
                <Button onClick={handleSave} disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4" /> Salvar Configuração
                </Button>
            </CardFooter>

            <ConfirmDialog 
                open={deleteDialogOpen} 
                onOpenChange={setDeleteDialogOpen} 
                title="Excluir Webhook?" 
                description="Seu sistema deixará de receber eventos. Essa ação não pode ser desfeita."
                onConfirm={handleDelete}
                confirmText="Excluir Definitivamente"
                confirmVariant="destructive"
            />
        </Card>
    );
};

export default WebhookConfig;
