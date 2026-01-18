
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { generatePdf } from '../_shared/pdf.ts'
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
    const allowed = await rateLimit(req, user.id, 20, 60) // Stricter limit for PDF generation
    if (!allowed) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { orcamentoId } = await req.json()

    // Fetch orcamento data
    const { data: orcamento, error: fetchError } = await supabase
      .from('orders')
      .select('*, clients(*), profiles(*)')
      .eq('id', orcamentoId)
      .single()

    if (fetchError || !orcamento) {
      throw new Error('Orçamento not found')
    }

    // Generate PDF
    const pdfBuffer = await generatePdf(orcamento)

    // Upload to storage
    const fileName = `${orcamentoId}_${Date.now()}.pdf`
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('orcamento-pdfs')
      .upload(`${user.id}/${fileName}`, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true
      })

    if (uploadError) throw uploadError

    // Record in database
    const { error: dbError } = await supabase
      .from('orcamento_pdfs')
      .insert({
        user_id: user.id,
        orcamento_id: orcamentoId,
        storage_path: uploadData.path,
        file_size: pdfBuffer.byteLength,
        generated_from_status: orcamento.status,
        checksum: 'sha256-placeholder', // In real app, calculate actual checksum
        generated_at: new Date().toISOString()
      })

    if (dbError) throw dbError

    // Get public URL
    const { data: { publicUrl } } = supabase
      .storage
      .from('orcamento-pdfs')
      .getPublicUrl(uploadData.path)

    return new Response(
      JSON.stringify({ url: publicUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
