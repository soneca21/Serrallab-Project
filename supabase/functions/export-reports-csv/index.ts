
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { rateLimit } from '../middleware-rate-limit/index.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')!
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Rate limiting
    const allowed = await rateLimit(req, user.id, 5, 60) // Very strict limit for exports
    if (!allowed) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { type, dateRange } = await req.json()

    // Fetch data based on type
    let data = []
    if (type === 'financial') {
      const { data: result } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', dateRange.start)
        .lte('created_at', dateRange.end)
      data = result || []
    } else if (type === 'clients') {
      const { data: result } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
      data = result || []
    }

    // Convert to CSV
    const headers = data.length > 0 ? Object.keys(data[0]).join(',') : ''
    const rows = data.map(row => Object.values(row).map(val => `"${val}"`).join(',')).join('\n')
    const csv = `${headers}\n${rows}`

    return new Response(
      csv,
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="report-${type}-${new Date().toISOString()}.csv"`
        } 
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
