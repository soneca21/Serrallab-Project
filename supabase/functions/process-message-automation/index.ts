
import { corsHeaders } from "../_shared/cors.ts";
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { retryFailedMessage } from "./retry-logic.ts";
import { fallbackChannel } from "./fallback-logic.ts";
import { handleStatusChange } from "./status-change-logic.ts";
import { handleTimeElapsed } from "./time-elapsed-logic.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = new SupabaseClient(supabaseUrl, supabaseServiceKey);
    const { rule, trigger_type, user_id, orcamento_id, old_status, new_status, outbox_id } = await req.json();

    let createdIds: string[] = [];

    if (trigger_type === "message_failed") {
      const id = await retryFailedMessage(supabase, outbox_id, rule, user_id);
      if (id) createdIds.push(id);
    } else if (trigger_type === "fallback_channel") {
      const id = await fallbackChannel(supabase, outbox_id, rule, user_id);
      if (id) createdIds.push(id);
    } else if (trigger_type === "status_change") {
      createdIds = await handleStatusChange(supabase, orcamento_id, old_status, new_status, rule, user_id);
    } else if (trigger_type === "time_elapsed") {
      createdIds = await handleTimeElapsed(supabase, rule, user_id);
    }

    return new Response(
      JSON.stringify({ success: true, created_message_ids: createdIds }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error processing automation:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
