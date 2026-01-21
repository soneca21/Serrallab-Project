export interface TwilioMessagePayload {
  to: string;
  body: string;
  from: string;
}

export async function sendTwilioMessage(payload: TwilioMessagePayload) {
  const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID") ?? "";
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN") ?? "";

  if (!accountSid || !authToken) {
    throw new Error("Twilio credentials are not configured.");
  }

  const auth = btoa(`${accountSid}:${authToken}`);
  const body = new URLSearchParams({
    To: payload.to,
    From: payload.from,
    Body: payload.body,
  });

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    },
  );

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Twilio error: ${text}`);
  }

  return JSON.parse(text);
}
