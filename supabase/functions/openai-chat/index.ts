import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { rateLimit } from "../middleware-rate-limit/index.ts";

const SETTINGS_ID = "00000000-0000-0000-0000-000000000001";
const DEFAULT_SYSTEM_PROMPT =
  "Voce e um assistente para orcamentos. Gere um titulo curto, descricao clara e itens com material_id valido. Retorne apenas JSON valido.";

const jsonResponse = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const safeNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const startedAt = Date.now();
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const authHeader = req.headers.get("Authorization") || "";
  if (!authHeader) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const { data: authData, error: authError } = await supabase.auth.getUser(
    authHeader.replace("Bearer ", "")
  );
  const user = authData?.user;
  if (authError || !user) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const allowed = await rateLimit(req, user.id, 8, 60);
  if (!allowed) {
    return jsonResponse({ error: "Rate limit exceeded" }, 429);
  }

  const openAiKey = Deno.env.get("OPENAI_API_KEY") ?? "";
  if (!openAiKey) {
    return jsonResponse({ error: "Missing OPENAI_API_KEY" }, 500);
  }

  let payload: { prompt?: string; materialsContext?: string };
  try {
    payload = await req.json();
  } catch (_error) {
    return jsonResponse({ error: "Invalid JSON payload" }, 400);
  }

  const prompt = (payload?.prompt || "").trim();
  if (!prompt) {
    return jsonResponse({ error: "Missing prompt" }, 400);
  }

  const { data: settingsRow } = await supabase
    .from("ai_quote_agent_settings")
    .select("*")
    .eq("id", SETTINGS_ID)
    .maybeSingle();

  const settings = settingsRow || {
    enabled: true,
    model: "gpt-4o-mini",
    temperature: 0.6,
    max_tokens: 700,
    item_limit: 20,
    system_prompt: DEFAULT_SYSTEM_PROMPT,
  };

  if (!settings.enabled) {
    return jsonResponse({ error: "AI agent disabled" }, 403);
  }

  const model = settings.model || "gpt-4o-mini";
  const temperature = Number(settings.temperature ?? 0.6);
  const maxTokens = Number(settings.max_tokens ?? 700);
  const itemLimit = Number(settings.item_limit ?? 20);
  const systemPrompt = settings.system_prompt || DEFAULT_SYSTEM_PROMPT;

  const materialsBlock = payload.materialsContext
    ? `Materiais disponiveis:\n${payload.materialsContext}`
    : "Materiais disponiveis: nenhum fornecido.";

  const systemContent = [
    systemPrompt,
    "Retorne apenas JSON valido.",
    "Formato esperado:",
    '{ "title": "...", "description": "...", "labor_cost": 0, "painting_cost": 0, "transport_cost": 0, "other_costs": 0, "items": [ { "material_id": "...", "name": "...", "unit": "un", "quantity": 1 } ] }',
    `Limite de itens: ${itemLimit}.`,
  ].join("\n");

  let responseData: any = null;
  let errorMessage = "";

  try {
    const openAiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openAiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature,
        max_tokens: maxTokens,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemContent },
          {
            role: "user",
            content: `Projeto: ${prompt}\n${materialsBlock}`,
          },
        ],
      }),
    });

    if (!openAiResponse.ok) {
      const errorText = await openAiResponse.text();
      errorMessage = errorText || "OpenAI request failed";
      return jsonResponse({ error: errorMessage }, 500);
    }

    responseData = await openAiResponse.json();
    const raw = responseData?.choices?.[0]?.message?.content ?? "";
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (_error) {
      const match = raw.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : null;
    }

    if (!parsed) {
      errorMessage = "Invalid AI response";
      return jsonResponse({ error: errorMessage }, 500);
    }

    const items = Array.isArray(parsed.items) ? parsed.items : [];
    const normalizedItems = items
      .map((item: any) => ({
        material_id: item.material_id || item.id || "",
        name: item.name || "",
        unit: item.unit || "un",
        quantity: Math.max(1, safeNumber(item.quantity) || 1),
      }))
      .filter((item: any) => item.material_id || item.name)
      .slice(0, itemLimit);

    const result = {
      title: parsed.title || "Orcamento",
      description: parsed.description || "",
      labor_cost: safeNumber(parsed.labor_cost),
      painting_cost: safeNumber(parsed.painting_cost),
      transport_cost: safeNumber(parsed.transport_cost),
      other_costs: safeNumber(parsed.other_costs),
      items: normalizedItems,
    };

    return jsonResponse(result);
  } catch (error) {
    errorMessage = error?.message || "Unhandled error";
    return jsonResponse({ error: errorMessage }, 500);
  } finally {
    const elapsed = Date.now() - startedAt;
    const usage = responseData?.usage || {};
    const status = errorMessage ? "error" : "success";
    const promptExcerpt = prompt.slice(0, 200);
    await supabase.from("ai_quote_agent_logs").insert({
      user_id: user.id,
      status,
      model,
      response_ms: elapsed,
      prompt_tokens: usage.prompt_tokens || null,
      completion_tokens: usage.completion_tokens || null,
      total_tokens: usage.total_tokens || null,
      prompt_excerpt: promptExcerpt,
      error_message: errorMessage || null,
    });
  }
});
