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

    const { docSlug } = await req.json();

    if (!docSlug) {
      throw new Error('docSlug is required');
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
    const mime = (docData.ck_files as any)?.[0]?.mime;

    if (!storagePath || mime !== 'application/pdf') {
      throw new Error('No PDF file found for this document');
    }

    console.log(`Downloading file from storage: ${storagePath}`);

    // Download the file
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('common-knowledge')
      .download(storagePath);

    if (downloadError || !fileData) {
      throw new Error(`Failed to download file: ${downloadError?.message}`);
    }

    console.log(`File downloaded, size: ${fileData.size} bytes`);

    // Simple text extraction from PDF
    const arrayBuffer = await fileData.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    
    // Try basic UTF-8 decoding and filter readable text
    const decoder = new TextDecoder('utf-8', { fatal: false });
    let rawText = decoder.decode(bytes);
    
    // Extract text between common PDF markers
    const textMatches = rawText.match(/\(([^)]{10,})\)/g);
    let extractedText = '';
    
    if (textMatches) {
      extractedText = textMatches
        .map(m => m.slice(1, -1))
        .join(' ')
        .replace(/\\n/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }
    
    // Fallback: just clean the raw text
    if (!extractedText || extractedText.length < 100) {
      extractedText = rawText
        .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }

    console.log(`Extracted ${extractedText.length} characters`);

    if (extractedText.length < 100) {
      throw new Error('Extracted text too short - PDF may be scanned or encrypted');
    }

    // Update the version with extracted content
    const { error: updateError } = await supabase
      .from('ck_doc_versions')
      .update({
        content_md: extractedText,
        summary: extractedText.substring(0, 500),
      })
      .eq('id', docData.version_current_id);

    if (updateError) throw updateError;

    console.log(`Successfully updated version ${docData.version_current_id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        extractedLength: extractedText.length,
        preview: extractedText.substring(0, 200) 
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
