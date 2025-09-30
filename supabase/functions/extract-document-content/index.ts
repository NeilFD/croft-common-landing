import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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

    const { storagePath, docId, versionId } = await req.json();

    console.log('📄 Extracting content for:', { storagePath, docId, versionId });

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('common-knowledge')
      .download(storagePath);

    if (downloadError) {
      console.error('Download error:', downloadError);
      throw new Error(`Failed to download file: ${downloadError.message}`);
    }

    // Get file extension
    const fileExt = storagePath.split('.').pop()?.toLowerCase();
    let extractedText = '';
    let summary = '';

    // Extract content based on file type
    if (fileExt === 'pdf') {
      extractedText = await extractPdfContent(fileData, storagePath, supabaseUrl, supabaseServiceKey);
    } else if (fileExt === 'docx' || fileExt === 'doc') {
      extractedText = await extractDocxContent(fileData);
    } else if (fileExt === 'txt' || fileExt === 'md') {
      extractedText = await fileData.text();
    } else {
      extractedText = `File uploaded: ${storagePath.split('/').pop()}`;
    }

    // Generate summary (first 500 characters)
    summary = extractedText.substring(0, 500).trim();
    if (extractedText.length > 500) {
      summary += '...';
    }

    console.log('✅ Extracted content length:', extractedText.length);

    // Update document version with extracted content
    const { error: updateError } = await supabase
      .from('ck_doc_versions')
      .update({
        content_md: extractedText,
        summary: summary || 'No content available',
      })
      .eq('id', versionId);

    if (updateError) {
      console.error('Update error:', updateError);
      throw new Error(`Failed to update version: ${updateError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        contentLength: extractedText.length,
        summary: summary.substring(0, 100),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in extract-document-content:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function extractPdfContent(fileData: Blob, storagePath: string, supabaseUrl: string, supabaseServiceKey: string): Promise<string> {
  try {
    // Get public URL or signed URL for the PDF
    const filePath = storagePath;
    
    // Use an external PDF text extraction API (pdf.co or similar)
    // For now, we'll use a simple text extraction approach
    const arrayBuffer = await fileData.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    
    // Convert to text by looking for text content in PDF
    // This is a basic extraction - for production, use a proper PDF library
    const decoder = new TextDecoder('utf-8');
    let text = decoder.decode(bytes);
    
    // Extract readable text from PDF (basic approach)
    // Remove binary data and keep only readable text
    text = text.replace(/[^\x20-\x7E\n\r\t]/g, ' ');
    text = text.replace(/\s+/g, ' ').trim();
    
    // If we got very little text, it might be an image-based PDF
    if (text.length < 100) {
      return `PDF content available but requires OCR processing. File: ${storagePath.split('/').pop()}`;
    }
    
    return text;
  } catch (error) {
    console.error('PDF extraction error:', error);
    return `PDF uploaded: ${storagePath.split('/').pop()}. Text extraction pending.`;
  }
}

async function extractDocxContent(fileData: Blob): Promise<string> {
  try {
    // For DOCX, we'd need a proper library
    // For now, return placeholder
    return `DOCX document uploaded. Text extraction pending.`;
  } catch (error) {
    console.error('DOCX extraction error:', error);
    return `DOCX document uploaded. Text extraction pending.`;
  }
}
