import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { versionId, contentMd, summary } = await req.json();

    if (!versionId || !contentMd) {
      throw new Error('versionId and contentMd are required');
    }

    console.log(`Updating version ${versionId} with ${contentMd.length} chars of content`);

    // Update the doc version with extracted content and summary
    const { error: updateError } = await supabase
      .from('ck_doc_versions')
      .update({
        content_md: contentMd,
        summary: summary || contentMd.substring(0, 500),
      })
      .eq('id', versionId);

    if (updateError) throw updateError;

    console.log(`Successfully updated version ${versionId}`);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error updating document content:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
