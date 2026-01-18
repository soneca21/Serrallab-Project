
import { supabase } from '@/lib/customSupabaseClient';

/**
 * Get notifications for user
 * @param {string} userId 
 * @param {number} limit 
 * @returns {Promise<import('@/types/db').Notification[]>}
 */
export const getNotifications = async (userId, limit = 20) => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
};

/**
 * Create a new notification
 * @param {string} userId 
 * @param {Omit<import('@/types/db').Notification, 'id' | 'created_at'>} notification 
 * @returns {Promise<import('@/types/db').Notification>}
 */
export const createNotification = async (userId, notification) => {
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      ...notification
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Mark notification as read
 * @param {string} notificationId 
 */
export const markAsRead = async (notificationId) => {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId);

  if (error) throw error;
};

/**
 * Delete a notification
 * @param {string} notificationId 
 */
export const deleteNotification = async (notificationId) => {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId);

  if (error) throw error;
};
