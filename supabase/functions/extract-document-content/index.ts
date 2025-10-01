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
    // Try robust text extraction using pdfjs-dist (Deno-compatible via esm.sh)
    const arrayBuffer = await fileData.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    try {
      const pdfjsLib: any = await import('https://esm.sh/pdfjs-dist@5.4.149/build/pdf.mjs');
      const loadingTask = pdfjsLib.getDocument({ data: bytes });
      const pdf = await loadingTask.promise;

      let allText = '';
      const maxPages = Math.min(pdf.numPages ?? 0, 500); // Increased cap for larger docs
      console.log(`📄 Extracting ${maxPages} pages from PDF...`);
      
      for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = (textContent.items || [])
          .map((it: any) => (typeof it.str === 'string' ? it.str : (it.text ?? '')))
          .join(' ');
        allText += pageText + '\n';
      }

      let cleaned = allText
        .replace(/[\u0000-\u001F\u007F]/g, ' ') // control chars
        .replace(/\s+/g, ' ')
        .replace(/\s*\n\s*/g, '\n')
        .trim();

      console.log(`✅ Extracted ${cleaned.length} characters from PDF`);

      if (cleaned.length >= 100) return cleaned;
      // Fall through to basic decoding if too short (likely scanned PDF)
    } catch (pdfjsErr) {
      console.error('pdfjs-dist extraction failed, falling back:', pdfjsErr);
    }

    // Basic fallback: decode bytes and keep readable characters
    const decoder = new TextDecoder('utf-8');
    let text = decoder.decode(bytes);
    text = text.replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/\s+/g, ' ').trim();

    if (text.length < 100) {
      return `PDF content available but may require OCR processing. File: ${storagePath.split('/').pop()}`;
    }

    return text;
  } catch (error) {
    console.error('PDF extraction error:', error);
    return `PDF uploaded: ${storagePath.split('/').pop()}. Text extraction pending.`;
  }
}

async function extractDocxContent(fileData: Blob): Promise<string> {
  try {
    console.log('📄 Extracting DOCX content using JSZip...');
    // Import JSZip for DOCX extraction
    const JSZip = (await import('https://esm.sh/jszip@3.10.1')).default;
    
    const arrayBuffer = await fileData.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);
    
    // DOCX files contain the main document in word/document.xml
    const documentXml = await zip.file('word/document.xml')?.async('string');
    
    if (!documentXml) {
      console.error('No word/document.xml found in DOCX');
      return `DOCX document uploaded but could not extract content.`;
    }
    
    // Extract text from XML - handle paragraphs, lists, tables
    // Remove all XML tags but preserve structure with newlines
    let text = documentXml
      .replace(/<w:p\b[^>]*>/g, '\n') // Paragraph breaks
      .replace(/<w:br[^>]*>/g, '\n') // Line breaks
      .replace(/<w:tab[^>]*>/g, '\t') // Tabs
      .replace(/<w:t\b[^>]*>([^<]*)<\/w:t>/g, '$1') // Extract text nodes
      .replace(/<[^>]+>/g, '') // Remove all other XML tags
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/\n\s*\n\s*\n/g, '\n\n') // Normalize multiple newlines
      .trim();
    
    console.log(`✅ Extracted ${text.length} characters from DOCX`);
    
    if (text.length < 50) {
      return `DOCX document uploaded but content appears empty.`;
    }
    
    return text;
  } catch (error) {
    console.error('DOCX extraction error:', error);
    return `DOCX document uploaded. Error during extraction: ${error.message}`;
  }
}
