import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zbumkcbtrupufdsjzyvb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpidW1rY2J0cnVwdWZkc2p6eXZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxMDE1OTQsImV4cCI6MjA3NzY3NzU5NH0.-p5tghKr3yGqD87d4OzfaDQMxM9DEZZ9vZGBLZtsSjU';

const customSupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export default customSupabaseClient;

export { 
    customSupabaseClient,
    customSupabaseClient as supabase,
};
