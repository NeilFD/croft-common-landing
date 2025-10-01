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

    const { docSlug, batchAll } = await req.json();

    // Batch mode: re-extract all documents with empty/placeholder content
    if (batchAll) {
      console.log('🔄 Batch re-extraction mode: processing all documents with placeholder content...');
      
      const { data: docsToProcess, error: fetchError } = await supabase
        .from('ck_docs')
        .select(`
          id,
          slug,
          version_current_id,
          ck_files (
            id,
            storage_path,
            mime
          )
        `)
        .not('version_current_id', 'is', null);
      
      if (fetchError) throw fetchError;
      
      console.log(`Found ${docsToProcess?.length || 0} documents to check`);
      
      let processed = 0;
      let errors = 0;
      
      for (const doc of docsToProcess || []) {
        try {
          const file = (doc.ck_files as any)?.[0];
          if (!file?.storage_path) continue;
          
          // Check if content needs re-extraction
          const { data: version } = await supabase
            .from('ck_doc_versions')
            .select('content_md')
            .eq('id', doc.version_current_id)
            .single();
          
          if (!version?.content_md || 
              version.content_md.includes('Text extraction pending') ||
              version.content_md.includes('uploaded but') ||
              version.content_md.length < 100) {
            
            console.log(`Re-extracting ${doc.slug}...`);
            
            // Call extract-document-content edge function
            const extractResponse = await fetch(`${supabaseUrl}/functions/v1/extract-document-content`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${supabaseServiceKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                storagePath: file.storage_path,
                docId: doc.id,
                versionId: doc.version_current_id,
              }),
            });
            
            if (extractResponse.ok) {
              processed++;
              console.log(`✅ Processed ${doc.slug}`);
            } else {
              errors++;
              console.error(`❌ Failed to process ${doc.slug}`);
            }
          }
        } catch (err) {
          errors++;
          console.error(`Error processing ${doc.slug}:`, err);
        }
      }
      
      return new Response(
        JSON.stringify({ 
          success: true,
          processed,
          errors,
          message: `Batch re-extraction complete: ${processed} processed, ${errors} errors`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Single document mode
    if (!docSlug) {
      throw new Error('docSlug is required for single document re-extraction');
    }

    console.log(`Re-extracting document: ${docSlug}`);

    // Get document and file info
    const { data: docData, error: docError } = await supabase
      .from('ck_docs')
      .select(`
        id,
        version_current_id,
        ck_files (
          storage_path,
          mime
        )
      `)
      .eq('slug', docSlug)
      .single();

    if (docError || !docData) {
      throw new Error(`Document not found: ${docSlug}`);
    }

    const storagePath = (docData.ck_files as any)?.[0]?.storage_path;
    const versionId = docData.version_current_id;

    if (!storagePath) {
      throw new Error('No file found for this document');
    }

    console.log(`Calling extract-document-content for ${docSlug}...`);

    // Call the extract-document-content edge function directly
    const extractResponse = await fetch(`${supabaseUrl}/functions/v1/extract-document-content`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        storagePath,
        docId: docData.id,
        versionId,
      }),
    });

    if (!extractResponse.ok) {
      const errorText = await extractResponse.text();
      throw new Error(`Extraction failed: ${errorText}`);
    }

    const result = await extractResponse.json();
    
    console.log(`✅ Successfully re-extracted ${docSlug}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        extractedLength: result.contentLength,
        preview: result.summary
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Re-extraction error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
