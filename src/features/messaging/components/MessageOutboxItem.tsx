
import React from 'react';
import { motion } from 'framer-motion';
import { 
  getDeliveryStatusIcon, 
  getDeliveryStatusColor, 
  getDeliveryStatusLabel, 
  formatDeliveryTime, 
  getChannelIcon 
} from '@/lib/messaging';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface MessageOutboxItemProps {
  message: {
    id: string;
    to_value: string;
    channel: string;
    template: string;
    created_at: string;
    delivery_status: string;
    delivery_status_updated_at?: string;
    delivery_error_code?: string;
    delivery_error_details?: any;
    cliente_nome?: string; // Optional if we join or fetch client name
  };
}

const MessageOutboxItem: React.FC<MessageOutboxItemProps> = ({ message }) => {
  const StatusIcon = getDeliveryStatusIcon(message.delivery_status);
  const ChannelIcon = getChannelIcon(message.channel);
  const statusColor = getDeliveryStatusColor(message.delivery_status);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      layout
      className="flex items-start p-4 border rounded-lg bg-card shadow-sm hover:shadow-md transition-all mb-3"
    >
      {/* Icon Column */}
      <div className="mr-4 mt-1">
        <div className={`p-2 rounded-full ${statusColor} transition-colors duration-500`}>
          <StatusIcon className="h-5 w-5" />
        </div>
      </div>

      {/* Content Column */}
      <div className="flex-1">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <ChannelIcon className="h-3 w-3 text-gray-500" />
              {message.cliente_nome || message.to_value}
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Template: <span className="font-medium">{message.template}</span>
            </p>
          </div>
          <div className="text-right">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor}`}>
              {getDeliveryStatusLabel(message.delivery_status)}
            </span>
            <p className="text-[10px] text-gray-400 mt-1">
              {formatDeliveryTime(message.created_at)}
            </p>
          </div>
        </div>

        {/* Error Details or Footer Info */}
        {(message.delivery_status === 'failed' || message.delivery_status === 'undelivered') && (
           <motion.div 
             initial={{ height: 0, opacity: 0 }}
             animate={{ height: 'auto', opacity: 1 }}
             className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded"
           >
             <strong>Erro:</strong> {message.delivery_error_details?.message || message.delivery_error_code || "Desconhecido"}
           </motion.div>
        )}
        
        {message.delivery_status === 'delivered' && (
          <div className="mt-2 text-[10px] text-gray-400">
             Entregue {formatDeliveryTime(message.delivery_status_updated_at)}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default MessageOutboxItem;
