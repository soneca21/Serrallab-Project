
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { WebhookLog } from '@/types/webhooks';
import { formatEventType } from '@/lib/webhooks';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface WebhookLogsProps {
    logs: WebhookLog[];
    count: number;
    page: number;
    onPageChange: (page: number) => void;
    isLoading: boolean;
}

const WebhookLogs: React.FC<WebhookLogsProps> = ({ logs, count, page, onPageChange, isLoading }) => {
    const [selectedLog, setSelectedLog] = useState<WebhookLog | null>(null);
    const limit = 20;
    const totalPages = Math.ceil(count / limit);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Histórico de Envios</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Data/Hora</TableHead>
                            <TableHead>Evento</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Código</TableHead>
                            <TableHead className="text-right">Detalhes</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                             <TableRow>
                                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">Carregando...</TableCell>
                            </TableRow>
                        ) : logs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">Nenhum registro encontrado.</TableCell>
                            </TableRow>
                        ) : (
                            logs.map(log => (
                                <TableRow key={log.id}>
                                    <TableCell className="text-sm">
                                        {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{formatEventType(log.event_type)}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={log.status === 'sent' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}>
                                            {log.status === 'sent' ? 'Sucesso' : 'Falha'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="font-mono text-xs">
                                        {log.response_code || '-'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => setSelectedLog(log)}>
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>

                {totalPages > 1 && (
                    <div className="flex justify-end items-center gap-2 mt-4">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => onPageChange(page - 1)} 
                            disabled={page === 0}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm text-muted-foreground">
                            Página {page + 1} de {totalPages}
                        </span>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => onPageChange(page + 1)} 
                            disabled={page >= totalPages - 1}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                )}
            </CardContent>

            <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Detalhes do Webhook</DialogTitle>
                        <DialogDescription>
                            Evento: {selectedLog && formatEventType(selectedLog.event_type)}
                        </DialogDescription>
                    </DialogHeader>
                    {selectedLog && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="font-bold">ID:</span> {selectedLog.id}
                                </div>
                                <div>
                                    <span className="font-bold">Status:</span> {selectedLog.status} ({selectedLog.response_code})
                                </div>
                            </div>
                            <div className="space-y-2">
                                <span className="text-sm font-bold">Payload JSON:</span>
                                <div className="bg-slate-900 text-slate-50 p-4 rounded-md overflow-x-auto text-xs font-mono max-h-[300px]">
                                    <pre>{JSON.stringify(selectedLog.payload, null, 2)}</pre>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </Card>
    );
};

export default WebhookLogs;
