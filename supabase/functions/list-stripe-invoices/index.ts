import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { corsHeaders } from "../_shared/cors.ts"

const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY") ?? ""

const stripeRequest = async (path: string, params: URLSearchParams) => {
  const response = await fetch(`https://api.stripe.com/v1/${path}?${params.toString()}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`,
    },
  })

  const data = await response.json()
  if (!response.ok) {
    const message = data?.error?.message || "Erro ao comunicar com o Stripe"
    throw new Error(message)
  }
  return data
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    if (!stripeSecretKey) {
      return new Response(
        JSON.stringify({ error: "Stripe nao configurado" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    )

    const authHeader = req.headers.get("Authorization") ?? ""
    const token = authHeader.replace("Bearer ", "")
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .maybeSingle()

    if (profileError || !profile?.stripe_customer_id) {
      return new Response(
        JSON.stringify({ error: "Cliente Stripe nao encontrado" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const params = new URLSearchParams({
      customer: profile.stripe_customer_id,
      limit: "10",
    })

    const invoices = await stripeRequest("invoices", params)

    return new Response(
      JSON.stringify({ invoices: invoices.data || [] }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || "Erro inesperado" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
