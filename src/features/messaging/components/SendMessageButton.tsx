
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Send, Loader2, MessageSquare, Phone } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { sendMessage } from '@/features/messaging/api/sendMessage';
import { MESSAGING_CHANNELS, MESSAGING_TEMPLATES, getChannelIcon } from '@/lib/messaging';

interface Props {
  cliente_id: string;
  orcamento_id?: string;
  template: keyof typeof MESSAGING_TEMPLATES;
  disabled?: boolean;
}

const SendMessageButton: React.FC<Props> = ({ cliente_id, orcamento_id, template, disabled }) => {
  const { toast } = useToast();
  const [sending, setSending] = useState(false);

  const handleSend = async (channel: 'sms' | 'whatsapp') => {
    try {
      setSending(true);
      await sendMessage(channel, cliente_id, MESSAGING_TEMPLATES[template], orcamento_id);
      toast({
        title: "Mensagem Enviada",
        description: `Notificação enviada via ${channel.toUpperCase()}.`,
      });
    } catch (error: any) {
      if (error.message?.includes('Upgrade')) {
          toast({ title: "Plano Limitado", description: "Faça upgrade para enviar mensagens.", variant: "destructive" });
      } else if (error.message?.includes('configurado')) {
          toast({ title: "Configuração Necessária", description: error.message, variant: "destructive" });
      } else {
          toast({ title: "Erro", description: "Falha ao enviar mensagem.", variant: "destructive" });
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled || sending} className="gap-2">
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Notificar Cliente
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Escolha o Canal</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleSend('sms')} className="cursor-pointer gap-2">
            <MessageSquare className="h-4 w-4 text-blue-500" />
            <span>Via SMS</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleSend('whatsapp')} className="cursor-pointer gap-2">
             <Phone className="h-4 w-4 text-green-500" />
            <span>Via WhatsApp</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default SendMessageButton;
