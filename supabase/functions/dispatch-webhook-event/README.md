
# Dispatch Webhook Event

This Edge Function handles the delivery of webhook events to user-configured endpoints.

## Features
- Fetches user's webhook configuration.
- signs payload using HMAC-SHA256 with user's secret.
- Sends POST request to the configured endpoint.
- Logs delivery status and response code.
- 10-second timeout.

## Usage
**POST** to function URL.

**Body:**
