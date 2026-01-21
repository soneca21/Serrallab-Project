import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { sendTwilioMessage } from "../_shared/twilio.ts";
import { sendSendGridEmail } from "../_shared/sendgrid.ts";

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

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const authHeader = req.headers.get("Authorization") ?? "";
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { orcamento_id, event, old_status, new_status, channels } = await req.json();
    if (!orcamento_id || !event) {
      return new Response(
        JSON.stringify({ error: "Missing orcamento_id/event" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, title, description, status, final_price, client_id, user_id, created_at, updated_at, clients(name,email,phone)")
      .eq("id", orcamento_id)
      .single();

    if (orderError || !order) {
      throw orderError ?? new Error("Orcamento nao encontrado.");
    }

    if (order.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: "Forbidden" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_name, email")
      .eq("id", user.id)
      .single();

    const companyName = profile?.company_name || "Serrallab";
    const cliente = order.clients || {};
    const clienteName = cliente.name || "Cliente";
    const clienteEmail = cliente.email;
    const clientePhone = normalizePhone(cliente.phone);
    const numero = order.id.substring(0, 8);
    const valor = formatCurrency(order.final_price || 0);

    const statusLabel = new_status || order.status || "Atualizado";

    const subjectByEvent: Record<string, string> = {
      created: `Novo orcamento ${numero} criado`,
      updated: `Orcamento ${numero} atualizado`,
      sent: `Orcamento ${numero} enviado`,
      status_changed: `Status do orcamento ${numero} atualizado`,
      reminder: `Lembrete do orcamento ${numero}`,
    };

    const titleByEvent: Record<string, string> = {
      created: "Seu orcamento foi criado",
      updated: "Seu orcamento foi atualizado",
      sent: "Seu orcamento foi enviado",
      status_changed: "Status do orcamento alterado",
      reminder: "Lembrete de orcamento pendente",
    };

    const baseText = `${titleByEvent[event] || "Atualizacao de orcamento"}\n\n` +
      `Orcamento: ${order.title || numero}\n` +
      `Status: ${statusLabel}\n` +
      `Valor: ${valor}\n\n` +
      `Duvidas? Fale com ${companyName}.`;

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <h2>${titleByEvent[event] || "Atualizacao de orcamento"}</h2>
        <p>Ola, ${clienteName}!</p>
        <p>Segue o resumo do seu orcamento.</p>
        <ul>
          <li><strong>Orcamento:</strong> ${order.title || numero}</li>
          <li><strong>Status:</strong> ${statusLabel}</li>
          <li><strong>Valor:</strong> ${valor}</li>
        </ul>
        <p>${order.description || ""}</p>
        <p>Qualquer duvida, fale com <strong>${companyName}</strong>.</p>
      </div>
    `;

    const sendEmail = async () => {
      if (!clienteEmail) return;
      await sendSendGridEmail({
        to: clienteEmail,
        subject: subjectByEvent[event] || `Orcamento ${numero}`,
        html: emailHtml,
        text: baseText,
      });
      await supabase.from("message_outbox").insert({
        user_id: user.id,
        channel: "email",
        to_value: clienteEmail,
        template: event,
        payload: { orcamento_id, status: statusLabel },
        cliente_id: order.client_id,
        orcamento_id,
        status: "sent",
        provider: "sendgrid",
      });
    };

    const sendWhatsapp = async () => {
      if (!clientePhone) return;
      const from = Deno.env.get("TWILIO_WHATSAPP_FROM") ?? "";
      if (!from) throw new Error("TWILIO_WHATSAPP_FROM is not configured.");
      await sendTwilioMessage({
        to: `whatsapp:${clientePhone}`,
        from: `whatsapp:${from}`,
        body: baseText,
      });
      await supabase.from("message_outbox").insert({
        user_id: user.id,
        channel: "whatsapp",
        to_value: clientePhone,
        template: event,
        payload: { orcamento_id, status: statusLabel },
        cliente_id: order.client_id,
        orcamento_id,
        status: "sent",
        provider: "twilio",
      });
    };

    const sendSms = async () => {
      if (!clientePhone) return;
      const from = Deno.env.get("TWILIO_SMS_FROM") ?? "";
      if (!from) throw new Error("TWILIO_SMS_FROM is not configured.");
      await sendTwilioMessage({
        to: clientePhone,
        from,
        body: baseText,
      });
      await supabase.from("message_outbox").insert({
        user_id: user.id,
        channel: "sms",
        to_value: clientePhone,
        template: event,
        payload: { orcamento_id, status: statusLabel },
        cliente_id: order.client_id,
        orcamento_id,
        status: "sent",
        provider: "twilio",
      });
    };

    const defaultChannelsByEvent: Record<string, string[]> = {
      created: ["email", "whatsapp"],
      updated: ["email", "whatsapp"],
      sent: ["email", "whatsapp", "sms"],
      status_changed: ["email", "whatsapp", "sms"],
      reminder: ["whatsapp", "sms"],
    };

    const requestedChannels = Array.isArray(channels) && channels.length
      ? channels
      : (defaultChannelsByEvent[event] || ["email", "whatsapp"]);

    if (requestedChannels.includes("email")) {
      await sendEmail();
    }
    if (requestedChannels.includes("whatsapp")) {
      await sendWhatsapp();
    }
    if (requestedChannels.includes("sms")) {
      await sendSms();
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
