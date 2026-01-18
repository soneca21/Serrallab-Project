
# Process Message Schedules Edge Function

This function processes pending message schedules (`message_schedules`) and creates queued messages in `message_outbox`.

## Setup

1. **Enable pg_cron extension** in Supabase Dashboard > Database > Extensions.

2. **Schedule the Cron Job** via SQL Editor:

