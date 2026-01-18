
import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
// Assuming useSubscription is available from previous tasks/context
import { useSubscription } from '@/contexts/SubscriptionContext'; 
import { subscribeNotifications } from '@/features/notifications/realtime/subscribeNotifications';
import { subscribePipeline } from '@/features/notifications/realtime/subscribePipeline';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

const RealtimeContext = createContext(undefined);

export const RealtimeProvider = ({ children }) => {
  const { user } = useAuth();
  // Using subscription context if available, otherwise defaulting to allow (safe fallback)
  const { isActive, hasFeature } = useSubscription(); 
  const { toast } = useToast();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [pipelineChanges, setPipelineChanges] = useState([]);
  const [hasNewLeads, setHasNewLeads] = useState(false);
  
  const notificationsChannelRef = useRef(null);
  const pipelineChannelRef = useRef(null);
  const retryTimeoutRef = useRef(null);
  const retryCountRef = useRef(0);

  const fetchInitialNotifications = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      setNotifications(data || []);
      setUnreadCount((data || []).filter(n => !n.read).length);
    } catch (err) {
      console.error('Error fetching initial notifications:', err);
    }
  };

  const handleNewNotification = useCallback((notification) => {
    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);
    
    // Check if it's a lead notification
    if (notification.type === 'lead_received') {
        setHasNewLeads(true);
    }

    toast({
      title: notification.title,
      description: notification.body,
    });
  }, [toast]);

  const handleNotificationUpdate = useCallback((updatedNotification) => {
    setNotifications(prev => prev.map(n => n.id === updatedNotification.id ? updatedNotification : n));
    // Recalculate unread count is safer than decrementing to avoid sync issues
    setNotifications(current => {
      const newNotifications = current.map(n => n.id === updatedNotification.id ? updatedNotification : n);
      setUnreadCount(newNotifications.filter(n => !n.read).length);
      return newNotifications;
    });
  }, []);

  const handlePipelineChange = useCallback((change) => {
    setPipelineChanges(prev => [change, ...prev]);
    // Optional: Toast for pipeline changes
    toast({
      title: "Pipeline Atualizado",
      description: `Orçamento atualizado para: ${change.newStatus}`,
    });
  }, [toast]);

  const connect = useCallback(() => {
    if (!user) return;
    
    // Cleanup existing
    if (notificationsChannelRef.current) notificationsChannelRef.current.unsubscribe();
    if (pipelineChannelRef.current) pipelineChannelRef.current.unsubscribe();

    try {
      notificationsChannelRef.current = subscribeNotifications(
        user.id,
        handleNewNotification,
        handleNotificationUpdate
      );

      // Only subscribe to pipeline if user has plan permission (assuming 'pipeline' feature key)
      // If plan checking is strict, uncomment check below:
      // if (hasFeature('pipeline')) {
        pipelineChannelRef.current = subscribePipeline(user.id, handlePipelineChange);
      // }

      setIsConnected(true);
      retryCountRef.current = 0; // Reset retry count on success
    } catch (error) {
      console.error('Realtime connection error:', error);
      setIsConnected(false);
      scheduleReconnect();
    }
  }, [user, handleNewNotification, handleNotificationUpdate, handlePipelineChange, hasFeature]);

  const scheduleReconnect = () => {
    const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 30000); // Max 30s
    console.log(`Reconnecting in ${delay}ms...`);
    
    if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
    
    retryTimeoutRef.current = setTimeout(() => {
      retryCountRef.current += 1;
      connect();
    }, delay);
  };

  useEffect(() => {
    if (user) {
      fetchInitialNotifications();
      connect();
    } else {
      setIsConnected(false);
      setNotifications([]);
      setUnreadCount(0);
    }

    return () => {
      if (notificationsChannelRef.current) notificationsChannelRef.current.unsubscribe();
      if (pipelineChannelRef.current) pipelineChannelRef.current.unsubscribe();
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
    };
  }, [user, connect]);

  const markAsRead = async (id) => {
    try {
      // Optimistic update
      handleNotificationUpdate({ ...notifications.find(n => n.id === id), read: true });
      
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);
        
      if (error) throw error;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      // Revert optimistic update if needed, or just let next fetch fix it
      fetchInitialNotifications();
    }
  };
  
  const markAllAsRead = async () => {
      try {
           const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
           if (unreadIds.length === 0) return;

           // Optimistic
           setNotifications(prev => prev.map(n => ({...n, read: true})));
           setUnreadCount(0);

           const { error } = await supabase
               .from('notifications')
               .update({ read: true })
               .in('id', unreadIds);
               
           if (error) throw error;
      } catch (error) {
          console.error("Error marking all as read", error);
          fetchInitialNotifications();
      }
  }

  const clearNewLeadsFlag = () => setHasNewLeads(false);

  return (
    <RealtimeContext.Provider value={{ 
      notifications, 
      unreadCount, 
      isConnected, 
      pipelineChanges,
      hasNewLeads,
      markAsRead,
      markAllAsRead,
      clearNewLeadsFlag
    }}>
      {children}
    </RealtimeContext.Provider>
  );
};

export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (context === undefined) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
};
