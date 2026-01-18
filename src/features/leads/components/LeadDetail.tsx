
import React, { useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Lead, LeadMessage } from '@/types/leads';
import { getLeadMessages } from '@/features/leads/api/leads';
import { formatPhoneNumber } from '@/lib/leads';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MessageSquare, Trash2, UserPlus, RefreshCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface LeadDetailProps {
    lead: Lead | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConvert: (lead: Lead) => void;
    onDelete: (id: string) => void;
    onResetReply: (phone: string) => void;
}

const LeadDetail: React.FC<LeadDetailProps> = ({ lead, open, onOpenChange, onConvert, onDelete, onResetReply }) => {
    const [messages, setMessages] = useState<LeadMessage[]>([]);
    const [loadingMsgs, setLoadingMsgs] = useState(false);

    useEffect(() => {
        if (lead && open) {
            setLoadingMsgs(true);
            getLeadMessages(lead.id)
                .then(setMessages)
                .finally(() => setLoadingMsgs(false));
        }
    }, [lead, open]);

    if (!lead) return null;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-[400px] sm:w-[540px] flex flex-col h-full">
                <SheetHeader>
                    <SheetTitle>{lead.name || 'Lead sem nome'}</SheetTitle>
                    <SheetDescription>
                        Recebido em {format(new Date(lead.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                        <br />
                        <span className="font-mono text-primary">{formatPhoneNumber(lead.phone)}</span>
                    </SheetDescription>
                </SheetHeader>
                
                <div className="flex-1 flex flex-col my-4 overflow-hidden border rounded-md bg-slate-50">
                    <div className="p-2 border-b bg-white text-xs font-medium text-muted-foreground flex items-center gap-2">
                        <MessageSquare className="h-3 w-3" /> Histórico de Mensagens
                    </div>
                    <ScrollArea className="flex-1 p-4">
                        {loadingMsgs ? (
                            <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                        ) : messages.length === 0 ? (
                            <p className="text-center text-sm text-muted-foreground p-4">Nenhuma mensagem encontrada.</p>
                        ) : (
                            <div className="space-y-4">
                                {messages.map((msg) => (
                                    <div 
                                        key={msg.id} 
                                        className={cn(
                                            "flex flex-col max-w-[80%] rounded-lg p-3 text-sm",
                                            msg.direction === 'inbound' 
                                                ? "self-start bg-white border mr-auto" 
                                                : "self-end bg-primary/10 ml-auto"
                                        )}
                                    >
                                        <p>{msg.content}</p>
                                        <span className="text-[10px] text-muted-foreground mt-1 self-end">
                                            {format(new Date(msg.created_at), "HH:mm")}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </div>

                <SheetFooter className="flex-col sm:flex-col gap-2 sm:space-x-0">
                    <Button className="w-full" onClick={() => onConvert(lead)}>
                        <UserPlus className="mr-2 h-4 w-4" /> Converter em Cliente
                    </Button>
                    
                    <div className="grid grid-cols-2 gap-2 w-full">
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="outline" className="w-full">
                                    <Trash2 className="mr-2 h-4 w-4 text-red-500" /> Excluir
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Excluir Lead?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Esta ação não pode ser desfeita. O histórico de mensagens será perdido.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => {
                                        onDelete(lead.id);
                                        onOpenChange(false);
                                    }} className="bg-red-600 hover:bg-red-700">
                                        Confirmar Exclusão
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>

                        <Button variant="outline" onClick={() => onResetReply(lead.phone)}>
                            <RefreshCcw className="mr-2 h-4 w-4" /> Resetar Auto-Reply
                        </Button>
                    </div>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
};

export default LeadDetail;
