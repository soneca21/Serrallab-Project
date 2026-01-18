
import { supabase } from '@/lib/customSupabaseClient';
import { createNotification } from '@/features/notifications/api/notifications';

/**
 * Creates an audit log entry and optionally a notification
 * @param {string} entity 
 * @param {string} entityId 
 * @param {import('@/types/db').ActionType} action 
 * @param {object} [metadata] 
 * @returns {Promise<void>}
 */
export const createAuditLog = async (entity, entityId, action, metadata = {}) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase.from('audit_log').insert({
    user_id: user.id,
    entity,
    entity_id: entityId,
    action,
    metadata
  });

  if (error) {
    console.error('Failed to create audit log:', error);
    return; // Don't block flow if audit fails, but log it
  }

  // Optional: Create notification for significant actions
  // This logic could be more complex or moved to a trigger
  if (action === 'delete' || action === 'update') {
    // Example: Notify user of critical changes? 
    // For now we just log, but function signature supports expansion
  }
};
