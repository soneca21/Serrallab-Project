export interface SendGridPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendSendGridEmail(payload: SendGridPayload) {
  const apiKey = Deno.env.get("SENDGRID_API_KEY") ?? "";
  const fromEmail = Deno.env.get("SENDGRID_FROM_EMAIL") ?? "";
  const fromName = Deno.env.get("SENDGRID_FROM_NAME") ?? "Serrallab";

  if (!apiKey || !fromEmail) {
    throw new Error("SendGrid credentials are not configured.");
  }

  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [
        {
          to: [{ email: payload.to }],
          subject: payload.subject,
        },
      ],
      from: { email: fromEmail, name: fromName },
      content: [
        ...(payload.text ? [{ type: "text/plain", value: payload.text }] : []),
        { type: "text/html", value: payload.html },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`SendGrid error: ${text}`);
  }

  return true;
}
