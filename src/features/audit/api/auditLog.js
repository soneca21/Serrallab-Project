
import { supabase } from '@/lib/customSupabaseClient';
/**
 * Creates an audit log entry and optionally a notification
 * @param {string} entity 
 * @param {string} entityId 
 * @param {import('@/types/db').ActionType} action 
 * @param {object} [metadata] 
 * @param {object} [options]
 * @returns {Promise<void>}
 */
export const createAuditLog = async (entity, entityId, action, metadata = {}, options = {}) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  let companyId = options.companyId;
  if (!companyId) {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .maybeSingle();
    companyId = profileData?.company_id || null;
  }

  const payload = {
    user_id: user.id,
    company_id: companyId,
    entity,
    entity_id: entityId ? String(entityId) : null,
    action,
    details: metadata,
  };

  if (options.ipAddress) {
    payload.ip_address = options.ipAddress;
  }

  const { error } = await supabase.from('audit_logs').insert(payload);

  if (error) {
    console.error('Failed to create audit log:', error);
    return; // Don't block flow if audit fails, but log it
  }

  // Optional: Create notification for significant actions in the future.
};
