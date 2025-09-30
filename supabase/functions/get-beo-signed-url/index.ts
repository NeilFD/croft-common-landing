import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  fileName?: string;
  pdfUrl?: string; // optional legacy URL to parse the file name from
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { fileName, pdfUrl }: RequestBody = await req.json()

    let targetFile = fileName

    if (!targetFile && pdfUrl) {
      // Accept legacy public URL like
      // https://.../storage/v1/object/public/beo-documents/<FILE>
      const marker = '/beo-documents/'
      const idx = pdfUrl.indexOf(marker)
      if (idx !== -1) {
        targetFile = pdfUrl.substring(idx + marker.length)
      }
    }

    if (!targetFile) {
      return new Response(
        JSON.stringify({ error: 'fileName is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data, error } = await supabase.storage
      .from('beo-documents')
      .createSignedUrl(targetFile, 60 * 60) // 1 hour

    if (error) {
      console.error('Error creating signed URL:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to create signed URL' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ signedUrl: data.signedUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (e: any) {
    console.error('get-beo-signed-url error:', e)
    return new Response(
      JSON.stringify({ error: e.message || 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
