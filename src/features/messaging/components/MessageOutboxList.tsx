
import React, { useState, useMemo, useEffect } from 'react';
import MessageOutboxItem from './MessageOutboxItem';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Filter } from 'lucide-react';
import { subscribeMessageDelivery } from '@/features/messaging/realtime/subscribeMessageDelivery';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { DeliveryChange } from '@/lib/messaging';

interface MessageOutboxListProps {
  messages: any[];
  isLoading: boolean;
  onUpdate?: () => void; // Callback to refresh if needed, though we use realtime
}

const MessageOutboxList: React.FC<MessageOutboxListProps> = ({ messages: initialMessages, isLoading }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState(initialMessages);
  const [statusFilter, setStatusFilter] = useState('all');
  const [channelFilter, setChannelFilter] = useState('all');

  // Sync props to state
  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;

    const handleDeliveryChange = (change: DeliveryChange) => {
      setMessages((prevMessages) => 
        prevMessages.map((msg) => 
          msg.id === change.outbox_id 
            ? { ...msg, ...change } 
            : msg
        )
      );
    };

    const channel = subscribeMessageDelivery(user.id, handleDeliveryChange);

    return () => {
      channel.unsubscribe();
    };
  }, [user]);

  // Filtering
  const filteredMessages = useMemo(() => {
    return messages.filter(m => {
      if (statusFilter !== 'all' && m.delivery_status !== statusFilter) return false;
      if (channelFilter !== 'all' && m.channel !== channelFilter) return false;
      return true;
    });
  }, [messages, statusFilter, channelFilter]);

  // Stats
  const stats = useMemo(() => {
    const total = messages.length;
    if (total === 0) return { sent: 0, delivered: 0, failed: 0, rate: 0 };
    
    const delivered = messages.filter(m => m.delivery_status === 'delivered').length;
    const failed = messages.filter(m => ['failed', 'undelivered'].includes(m.delivery_status)).length;
    const sent = total;
    const rate = sent > 0 ? Math.round((delivered / sent) * 100) : 0;
    
    return { sent, delivered, failed, rate };
  }, [messages]);

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-end sm:items-center bg-gray-50 p-3 rounded-lg border">
         <div className="flex gap-2 w-full sm:w-auto">
             <div className="w-1/2 sm:w-40">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos Status</SelectItem>
                        <SelectItem value="queued">Na Fila</SelectItem>
                        <SelectItem value="sent">Enviado</SelectItem>
                        <SelectItem value="delivered">Entregue</SelectItem>
                        <SelectItem value="failed">Falha</SelectItem>
                    </SelectContent>
                </Select>
             </div>
             <div className="w-1/2 sm:w-40">
                <Select value={channelFilter} onValueChange={setChannelFilter}>
                    <SelectTrigger><SelectValue placeholder="Canal" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos Canais</SelectItem>
                        <SelectItem value="sms">SMS</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    </SelectContent>
                </Select>
             </div>
         </div>

         {/* Mini Stats */}
         <div className="flex gap-4 text-xs text-gray-600">
             <div className="text-center">
                 <span className="block font-bold text-lg text-blue-600">{stats.sent}</span>
                 Enviados
             </div>
             <div className="text-center">
                 <span className="block font-bold text-lg text-green-600">{stats.delivered}</span>
                 Entregues
             </div>
             <div className="text-center">
                 <span className="block font-bold text-lg text-red-600">{stats.failed}</span>
                 Falhas
             </div>
             <div className="text-center">
                 <span className="block font-bold text-lg text-gray-800">{stats.rate}%</span>
                 Taxa
             </div>
         </div>
      </div>

      {/* List */}
      <div className="space-y-2">
        {filteredMessages.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            Nenhuma mensagem encontrada com estes filtros.
          </div>
        ) : (
          filteredMessages.map((msg) => (
            <MessageOutboxItem key={msg.id} message={msg} />
          ))
        )}
      </div>
    </div>
  );
};

export default MessageOutboxList;
