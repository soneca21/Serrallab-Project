
/**
 * @typedef {Object} MessageOutbox
 * @property {string} id
 * @property {string} created_at
 * @property {string} user_id
 * @property {string} channel
 * @property {string} to_value
 * @property {string} template
 * @property {Object} payload
 * @property {string} status
 * @property {string} provider
 * @property {string} provider_message_id
 * @property {string} error_message
 * @property {string} sent_at
 * @property {string} delivery_status
 * @property {string} delivery_status_updated_at
 * @property {string} delivery_error_code
 * @property {Object} delivery_error_details
 */

/**
 * @typedef {'INSERT' | 'UPDATE' | 'DELETE'} ActionType
 */

export const ActionType = {
  CREATE: 'INSERT',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
};

export {};
