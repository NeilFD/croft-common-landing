import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

Deno.serve(async (req) => {
  console.log('🔗 Proposal redirect request:', req.method, req.url);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const proposalCode = url.pathname.split('/').pop();

    if (!proposalCode) {
      return new Response('Proposal code required', {
        status: 400,
        headers: corsHeaders,
      });
    }

    console.log('Looking up proposal:', proposalCode);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find the latest PDF for this proposal code
    const { data: eventData, error: eventError } = await supabase
      .from('management_events')
      .select('id')
      .eq('code', proposalCode)
      .single();

    if (eventError || !eventData) {
      console.log('Event not found for code:', proposalCode);
      return new Response('Proposal not found', {
        status: 404,
        headers: corsHeaders,
      });
    }

    // Get the latest PDF for this event
    const { data: pdfData, error: pdfError } = await supabase
      .from('proposal_pdfs')
      .select('public_url')
      .eq('event_id', eventData.id)
      .order('generated_at', { ascending: false })
      .limit(1)
      .single();

    if (pdfError || !pdfData) {
      console.log('PDF not found for event:', eventData.id);
      return new Response('PDF not found', {
        status: 404,
        headers: corsHeaders,
      });
    }

    console.log('Redirecting to:', pdfData.public_url);

    // Redirect to the PDF URL
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': pdfData.public_url,
      },
    });

  } catch (error) {
    console.error('❌ Redirect error:', error);
    return new Response('Internal server error', {
      status: 500,
      headers: corsHeaders,
    });
  }
});