import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { calculateChecksum, generatePdf, generateSignedUrl, uploadPdfToStorage } from '../_shared/pdf.ts'
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
    const allowed = await rateLimit(req, user.id, 20, 60)
    if (!allowed) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const payload = await req.json()
    const orcamentoId = payload?.orcamento_id || payload?.orcamentoId

    if (!orcamentoId) {
      return new Response(
        JSON.stringify({ error: 'Missing orcamento_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch orcamento data
    const { data: orcamento, error: fetchError } = await supabase
      .from('orders')
      .select('*, clients(*), profiles(*)')
      .eq('id', orcamentoId)
      .single()

    if (fetchError || !orcamento) {
      throw new Error('Orcamento not found')
    }

    // Generate PDF
    const pdfBuffer = await generatePdf(orcamento)
    const checksum = await calculateChecksum(pdfBuffer)

    // Upload to storage
    const { path, size } = await uploadPdfToStorage(user.id, orcamentoId, pdfBuffer, supabase)

    // Record in database
    const { error: dbError } = await supabase
      .from('orcamento_pdfs')
      .insert({
        user_id: user.id,
        orcamento_id: orcamentoId,
        storage_path: path,
        file_size: size,
        generated_from_status: orcamento.status,
        checksum,
        generated_at: new Date().toISOString()
      })

    if (dbError) throw dbError

    const signedUrl = await generateSignedUrl(path, 60, supabase)

    return new Response(
      JSON.stringify({ pdf_url: signedUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
