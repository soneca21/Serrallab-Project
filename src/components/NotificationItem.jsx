
import React from 'react';
import { motion } from 'framer-motion';
import { getNotificationIcon, getNotificationColor, formatNotificationTime } from '@/lib/realtime';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

const NotificationItem = ({ notification, onMarkAsRead, onClick }) => {
  const Icon = getNotificationIcon(notification.type);
  const colorClass = getNotificationColor(notification.type);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -10 }}
      className={cn(
        "group flex gap-4 p-4 rounded-lg transition-colors cursor-pointer border-b last:border-0",
        notification.read ? "bg-white hover:bg-gray-50" : "bg-blue-50/50 hover:bg-blue-50"
      )}
      onClick={() => onClick && onClick(notification)}
    >
      <div className={cn("flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center", colorClass)}>
        <Icon className="w-5 h-5" />
      </div>
      
      <div className="flex-grow min-w-0">
        <div className="flex justify-between items-start gap-2">
          <p className={cn("text-sm font-medium", notification.read ? "text-gray-900" : "text-blue-900")}>
            {notification.title}
          </p>
          <span className="text-xs text-gray-500 whitespace-nowrap">
            {formatNotificationTime(notification.created_at)}
          </span>
        </div>
        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
          {notification.body}
        </p>
      </div>

      {!notification.read && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMarkAsRead(notification.id);
          }}
          className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-blue-100 rounded-full text-blue-600"
          title="Marcar como lida"
        >
          <Check className="w-4 h-4" />
        </button>
      )}
    </motion.div>
  );
};

export default NotificationItem;
