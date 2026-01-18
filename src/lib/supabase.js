
// Re-export the singleton instance from customSupabaseClient
// to ensure consistency across the application and avoid multiple instances.
// This maintains compatibility with existing imports while using the new configuration.
export { supabase } from './customSupabaseClient'
