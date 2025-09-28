import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

Deno.serve(async (req) => {
  console.log('📄 proposal-latest request:', req.method, req.url);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    let code: string | null = null;

    if (req.method === 'GET') {
      code = url.searchParams.get('code');
    } else if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}));
      code = body.code ?? null;
    }

    if (!code) {
      return new Response(JSON.stringify({ error: 'Proposal code required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Looking up latest PDF for proposal code:', code);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find event by code
    const { data: eventData, error: eventError } = await supabase
      .from('management_events')
      .select('id, code')
      .eq('code', code)
      .single();

    if (eventError || !eventData) {
      console.log('Event not found for code:', code, eventError);
      return new Response(JSON.stringify({ error: 'Proposal not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get the latest PDF for this event
    const { data: pdfData, error: pdfError } = await supabase
      .from('proposal_pdfs')
      .select('public_url, generated_at')
      .eq('event_id', eventData.id)
      .order('generated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (pdfError || !pdfData) {
      console.log('PDF not found for event:', eventData.id, pdfError);
      return new Response(JSON.stringify({ error: 'PDF not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payload = {
      public_url: pdfData.public_url,
      generated_at: pdfData.generated_at,
      event_id: eventData.id,
      code: eventData.code,
    };

    console.log('✅ Returning latest PDF JSON for code', code);

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('❌ proposal-latest error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});