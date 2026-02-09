
import React, { useEffect, useState, useCallback } from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { Webhook, WebhookLog } from '@/types/webhooks';
import { getWebhook, getWebhookLogs } from '@/features/webhooks/api/webhooks';
import WebhookConfig from '@/features/webhooks/components/WebhookConfig';
import WebhookLogs from '@/features/webhooks/components/WebhookLogs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { WEBHOOK_EVENTS } from '@/lib/webhooks';
import { Webhook as WebhookIcon, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AppSectionHeader from '@/components/AppSectionHeader';

const WebhooksPage = () => {
    const [webhook, setWebhook] = useState<Webhook | null>(null);
    const [logs, setLogs] = useState<WebhookLog[]>([]);
    const [logCount, setLogCount] = useState(0);
    const [page, setPage] = useState(0);
    const [loadingLogs, setLoadingLogs] = useState(false);

    const fetchConfig = async () => {
        try {
            const data = await getWebhook();
            setWebhook(data);
        } catch (error) {
            console.error('Error fetching webhook config', error);
        }
    };

    const fetchLogs = useCallback(async () => {
        setLoadingLogs(true);
        try {
            const { data, count } = await getWebhookLogs(20, page * 20);
            setLogs(data);
            setLogCount(count);
        } catch (error) {
            console.error('Error fetching logs', error);
        } finally {
            setLoadingLogs(false);
        }
    }, [page]);

    useEffect(() => {
        fetchConfig();
        fetchLogs();
    }, [fetchLogs]);

    return (
        <HelmetProvider>
            <Helmet><title>Webhooks — Serrallab</title></Helmet>
            <div className="container mx-auto max-w-5xl space-y-6">
                <AppSectionHeader
                    title="Webhooks"
                    description="Integre o Serrallab com outras plataformas via eventos em tempo real."
                />

                <div className="grid gap-6 md:grid-cols-3">
                    <div className="md:col-span-2 space-y-6">
                        <WebhookConfig webhook={webhook} onSave={setWebhook} />
                        
                        <div className="flex justify-between items-center mt-8 mb-2">
                             <h2 className="text-lg font-semibold">Logs de Atividade</h2>
                             <Button variant="outline" size="sm" onClick={fetchLogs}>
                                <RefreshCw className={`h-4 w-4 mr-2 ${loadingLogs ? 'animate-spin' : ''}`} /> Atualizar
                             </Button>
                        </div>
                        <WebhookLogs 
                            logs={logs} 
                            count={logCount} 
                            page={page} 
                            onPageChange={setPage} 
                            isLoading={loadingLogs} 
                        />
                    </div>

                    <div className="space-y-6">
                         <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Eventos Disponíveis</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Accordion type="single" collapsible className="w-full">
                                    {WEBHOOK_EVENTS.map((evt) => (
                                        <AccordionItem value={evt.value} key={evt.value} className="px-4 border-b">
                                            <AccordionTrigger className="text-sm hover:no-underline hover:text-primary">
                                                {evt.label}
                                                <br/>
                                                <span className="text-xs text-muted-foreground font-mono font-normal">{evt.value}</span>
                                            </AccordionTrigger>
                                            <AccordionContent>
                                                <div className="bg-slate-100 p-2 rounded text-xs font-mono text-slate-700">
                                                    {`{
  "event": "${evt.value}",
  "timestamp": "2023-01-01T12:00:00Z",
  "data": { ... }
}`}
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    ))}
                                </Accordion>
                            </CardContent>
                        </Card>

                        <Card>
                             <CardHeader>
                                <CardTitle className="text-lg">Validação</CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm text-muted-foreground space-y-2">
                                <p>Todos os requests incluem um header <code>X-Serrallab-Signature</code>.</p>
                                <p>Ele contém o HMAC SHA-256 do corpo da requisição, assinado com seu segredo.</p>
                                <p className="font-mono text-xs bg-slate-100 p-1 rounded">sha256=7f83b165...</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </HelmetProvider>
    );
};

export default WebhooksPage;
