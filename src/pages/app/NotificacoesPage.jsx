import React, { useEffect, useMemo, useState } from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { useRealtime } from '@/contexts/RealtimeContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, BellOff, Bell, Settings2, CheckCheck, Trash2 } from 'lucide-react';
import NotificationItem from '@/components/NotificationItem';
import { useNavigate } from 'react-router-dom';
import { getNotificationRoute, NOTIFICATION_TYPES } from '@/lib/realtime';

const typeLabels = {
  all: 'Todos os tipos',
  [NOTIFICATION_TYPES.INFO]: 'Informativo',
  [NOTIFICATION_TYPES.SUCCESS]: 'Sucesso',
  [NOTIFICATION_TYPES.WARNING]: 'Aviso',
  [NOTIFICATION_TYPES.ERROR]: 'Erro'
};

const NotificacoesPage = () => {
  const {
    notifications,
    markAsRead,
    markAllAsRead,
    deleteReadNotifications,
    deleteAllNotifications,
    unreadCount,
    isConnected
  } = useRealtime();
  const [filter, setFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(false);
  }, []);

  const counts = useMemo(() => ({
    all: notifications.length,
    unread: notifications.filter(n => !n.read).length,
    read: notifications.filter(n => n.read).length
  }), [notifications]);

  const filteredNotifications = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return notifications.filter((notification) => {
      if (filter === 'unread' && notification.read) return false;
      if (filter === 'read' && !notification.read) return false;
      if (typeFilter !== 'all' && notification.type !== typeFilter) return false;
      if (normalizedQuery) {
        const haystack = `${notification.title || ''} ${notification.body || ''}`.toLowerCase();
        return haystack.includes(normalizedQuery);
      }
      return true;
    });
  }, [notifications, filter, typeFilter, query]);

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    const route = getNotificationRoute(notification.entity, notification.entity_id);
    if (route) {
      navigate(route);
    }
  };

  const handleDeleteAll = () => {
    if (!notifications.length) return;
    if (window.confirm('Deseja apagar todas as notificações? Esta ação não pode ser desfeita.')) {
      deleteAllNotifications();
    }
  };

  return (
    <HelmetProvider>
      <Helmet><title>Notificações - Serrallab</title></Helmet>
      <div className="container mx-auto max-w-5xl p-4 space-y-6">
        <div className="space-y-2"><div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Bell className="h-6 w-6 text-primary" />
              <h1 className="text-3xl font-bold tracking-tight">Notificações</h1>
            </div>
            <p className="text-muted-foreground">Acompanhe alertas, eventos e atualizações do sistema.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-yellow-400'}`} />
              {isConnected ? 'Tempo real ativo' : 'Reconectando'}
            </span>
            <Button variant="outline" size="sm" onClick={() => navigate('/app/config?tab=notifications')}>
              <Settings2 className="mr-2 h-4 w-4" />
              Configurar notificações
            </Button>
            <Button variant="default" size="sm" onClick={markAllAsRead} disabled={unreadCount === 0}>
              <CheckCheck className="mr-2 h-4 w-4" />
              Marcar todas
            </Button>
            <Button variant="outline" size="sm" onClick={deleteReadNotifications} disabled={counts.read === 0}>
              <Trash2 className="mr-2 h-4 w-4" />
              Limpar lidas
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDeleteAll} disabled={notifications.length === 0}>
              <Trash2 className="mr-2 h-4 w-4" />
              Limpar tudo
            </Button>
          </div>
        </div><div className="h-px bg-border mb-4" /></div>

        <Card>
          <CardHeader className="border-b border-border">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="text-base">Histórico</CardTitle>
                <CardDescription>Selecione uma notificação para abrir o item relacionado.</CardDescription>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Input
                  placeholder="Buscar por título ou mensagem"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="sm:w-[240px]"
                />
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="sm:w-[200px]">
                    <SelectValue placeholder="Filtrar por tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    <SelectItem value={NOTIFICATION_TYPES.INFO}>Informativo</SelectItem>
                    <SelectItem value={NOTIFICATION_TYPES.SUCCESS}>Sucesso</SelectItem>
                    <SelectItem value={NOTIFICATION_TYPES.WARNING}>Aviso</SelectItem>
                    <SelectItem value={NOTIFICATION_TYPES.ERROR}>Erro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs defaultValue="all" onValueChange={setFilter} className="w-full">
              <div className="px-4 pt-4">
                <TabsList>
                  <TabsTrigger value="all">Todas ({counts.all})</TabsTrigger>
                  <TabsTrigger value="unread">Não lidas ({counts.unread})</TabsTrigger>
                  <TabsTrigger value="read">Lidas ({counts.read})</TabsTrigger>
                </TabsList>
              </div>

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
                <div className="flex flex-col items-center justify-center h-64 text-center p-8 text-muted-foreground">
                  <BellOff className="h-12 w-12 mb-4 opacity-50" />
                  <p className="text-lg font-medium">Nenhuma notificação encontrada</p>
                  <p className="text-sm">Ajuste filtros ou volte mais tarde.</p>
                </div>
              )}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </HelmetProvider>
  );
};

export default NotificacoesPage;


