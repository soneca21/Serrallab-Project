import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { sendTwilioMessage } from "../_shared/twilio.ts";

const normalizePhone = (raw: string | null | undefined) => {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.length >= 12 && digits.startsWith("55")) {
    return `+${digits}`;
  }
  if (digits.length === 10 || digits.length === 11) {
    return `+55${digits}`;
  }
  return `+${digits}`;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const days = Number(Deno.env.get("ORCAMENTO_REMINDER_DAYS") ?? "3");
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - days);

    const { data: orders } = await supabase
      .from("orders")
      .select("id, title, status, client_id, user_id, updated_at, clients(name,phone)")
      .eq("status", "Enviado")
      .lt("updated_at", dateLimit.toISOString());

    if (!orders || orders.length === 0) {
      return new Response(
        JSON.stringify({ success: true, processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const fromWhatsapp = Deno.env.get("TWILIO_WHATSAPP_FROM") ?? "";
    const fromSms = Deno.env.get("TWILIO_SMS_FROM") ?? "";

    if (!fromWhatsapp && !fromSms) {
      throw new Error("TWILIO_WHATSAPP_FROM or TWILIO_SMS_FROM must be configured.");
    }

    let processed = 0;

    for (const order of orders) {
      const clientePhone = normalizePhone(order.clients?.phone);
      if (!clientePhone) continue;

      const { count } = await supabase
        .from("message_outbox")
        .select("*", { count: "exact", head: true })
        .eq("orcamento_id", order.id)
        .eq("template", "reminder")
        .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (count && count > 0) continue;

      const body = `Lembrete: seu orçamento ${order.title || order.id.substring(0, 8)} ainda está pendente.`;

      if (fromWhatsapp) {
        await sendTwilioMessage({
          to: `whatsapp:${clientePhone}`,
          from: `whatsapp:${fromWhatsapp}`,
          body,
        });
      }

      if (fromSms) {
        await sendTwilioMessage({
          to: clientePhone,
          from: fromSms,
          body,
        });
      }

      await supabase.from("message_outbox").insert({
        user_id: order.user_id,
        channel: "whatsapp",
        to_value: clientePhone,
        template: "reminder",
        payload: { orcamento_id: order.id },
        cliente_id: order.client_id,
        orcamento_id: order.id,
        status: "sent",
        provider: "twilio",
      });

      processed += 1;
    }

    return new Response(
      JSON.stringify({ success: true, processed }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
