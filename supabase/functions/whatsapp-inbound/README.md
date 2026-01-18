
# WhatsApp Inbound Webhook

Handles incoming WhatsApp messages from Twilio, creates leads, and sends auto-replies.

## Configuration

1. **Twilio Console**:
   - Go to Messaging > Senders > WhatsApp Senders.
   - Edit your sender.
   - Under "Webhook URL for incoming messages", enter your Supabase Function URL:
     `https://[YOUR_PROJECT_ID].supabase.co/functions/v1/whatsapp-inbound`
   - Method: POST

2. **Environment Variables**:
   - Ensure `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN` are set in Supabase Secrets.
   - Ensure `SUPABASE_SERVICE_ROLE_KEY` is available to the function.

## Behavior

- **New Number**: Creates a new Lead entry, sends auto-reply, creates Notification.
- **Existing Number**: Logs message to `lead_messages`.
- **Auto-Reply**: Sent only once per Lead (tracked in `lead_auto_reply_log`).
