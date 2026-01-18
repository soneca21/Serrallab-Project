
import React, { useEffect, useState } from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { useRealtime } from '@/contexts/RealtimeContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Loader2, BellOff } from 'lucide-react';
import NotificationItem from '@/components/NotificationItem';
import { useNavigate } from 'react-router-dom';
import { getNotificationRoute } from '@/lib/realtime';

const NotificacoesPage = () => {
  const { notifications, markAsRead, unreadCount } = useRealtime();
  const [filter, setFilter] = useState('all');
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Simulate initial loading if needed, though context handles it
    setLoading(false);
  }, []);

  useEffect(() => {
    if (filter === 'unread') {
      setFilteredNotifications(notifications.filter(n => !n.read));
    } else if (filter === 'read') {
      setFilteredNotifications(notifications.filter(n => n.read));
    } else {
      setFilteredNotifications(notifications);
    }
  }, [notifications, filter]);

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    const route = getNotificationRoute(notification.entity, notification.entity_id);
    if (route) {
      navigate(route);
    }
  };

  return (
    <HelmetProvider>
      <Helmet><title>Notificações — Serrallab</title></Helmet>
      <div className="container mx-auto max-w-4xl p-4 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Notificações</h1>
            <p className="text-muted-foreground">
              Acompanhe as atualizações do seu sistema em tempo real.
            </p>
          </div>
          <div className="flex items-center gap-2">
             {unreadCount > 0 && (
                 <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                     {unreadCount} não lidas
                 </span>
             )}
          </div>
        </div>

        <Tabs defaultValue="all" onValueChange={setFilter} className="w-full">
          <TabsList>
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="unread">Não Lidas</TabsTrigger>
            <TabsTrigger value="read">Lidas</TabsTrigger>
          </TabsList>

          <Card className="mt-4">
            <CardContent className="p-0">
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-metallic-orange" />
                </div>
              ) : filteredNotifications.length > 0 ? (
                <div className="divide-y">
                  {filteredNotifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={markAsRead}
                      onClick={handleNotificationClick}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-center p-8 text-gray-400">
                  <BellOff className="h-12 w-12 mb-4 opacity-50" />
                  <p className="text-lg font-medium">Nenhuma notificação encontrada</p>
                  <p className="text-sm">Você está em dia com suas atualizações!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </Tabs>
      </div>
    </HelmetProvider>
  );
};

export default NotificacoesPage;
