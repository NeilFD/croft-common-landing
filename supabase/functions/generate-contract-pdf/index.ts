import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { jsPDF } from 'https://esm.sh/jspdf@2.5.1';

// Content sanitization utilities
const sanitizeContentText = (content: string): string => {
  if (!content || typeof content !== 'string') {
    return '';
  }

  return content
    // Convert <br> and <br/> tags to line breaks
    .replace(/<br\s*\/?>/gi, '\n')
    // Convert <p> tags to line breaks (with double break for paragraphs)
    .replace(/<\/p>\s*<p[^>]*>/gi, '\n\n')
    .replace(/<\/?p[^>]*>/gi, '\n')
    // Remove all other HTML tags
    .replace(/<[^>]*>/g, '')
    // Convert HTML entities
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    // Clean ASCII art characters that cause PDF encoding issues
    .replace(/═+/g, '======')
    .replace(/─+/g, '------')
    .replace(/[█▓▒░]/g, '')
    // Clean up excess whitespace
    .replace(/\n\s*\n\s*\n/g, '\n\n') // Max 2 consecutive line breaks
    .replace(/^\s+|\s+$/g, '') // Trim start and end
    .replace(/[ \t]+/g, ' '); // Normalize spaces
};

// Format contract content for PDF - similar to preview logic
const formatContractContent = (content: string) => {
  const cleanContent = sanitizeContentText(content);
  const lines = cleanContent.split('\n');
  
  return lines.map(line => {
    const trimmed = line.trim();
    
    if (!trimmed) {
      return { type: 'empty', content: '', fontSize: 8, fontStyle: 'normal' };
    }
    
    // Major section dividers (with equals)
    if (trimmed.includes('======')) {
      return { 
        type: 'major-divider', 
        content: trimmed.replace(/=+/g, '').trim() || 'SECTION', 
        fontSize: 12, 
        fontStyle: 'bold' 
      };
    }
    
    // Minor section dividers (with dashes)  
    if (trimmed.includes('------')) {
      return { 
        type: 'minor-divider', 
        content: trimmed.replace(/-+/g, '').trim() || '', 
        fontSize: 10, 
        fontStyle: 'bold' 
      };
    }
    
    // Numbered sections (1., 2., etc.)
    if (trimmed.match(/^\d+\./)) {
      return { 
        type: 'numbered-section', 
        content: trimmed, 
        fontSize: 9, 
        fontStyle: 'bold' 
      };
    }
    
    // Labels ending with colon
    if (trimmed.endsWith(':') && trimmed.length < 50) {
      return { 
        type: 'label', 
        content: trimmed, 
        fontSize: 9, 
        fontStyle: 'bold' 
      };
    }
    
    // Regular body text
    return { 
      type: 'body', 
      content: trimmed, 
      fontSize: 8, 
      fontStyle: 'normal' 
    };
  });
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

Deno.serve(async (req) => {
  console.log('📄 Contract PDF Generation request received:', req.method);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { eventId } = await req.json();
    console.log('Generating contract PDF for event:', eventId);

    // Fetch event data
    const { data: eventData, error: eventError } = await supabase
      .from('management_events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (eventError || !eventData) {
      console.error('Event fetch error:', eventError);
      return new Response(JSON.stringify({ error: 'Event not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch contract data
    const { data: contractData, error: contractError } = await supabase
      .from('contracts')
      .select('*')
      .eq('event_id', eventId)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (contractError || !contractData) {
      console.error('Contract fetch error:', contractError);
      return new Response(JSON.stringify({ error: 'Contract not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch line items for totals calculation
    const { data: lineItems, error: lineItemsError } = await supabase
      .from('management_event_line_items')
      .select('*')
      .eq('event_id', eventId)
      .order('sort_order');

    if (lineItemsError) {
      console.error('Line items fetch error:', lineItemsError);
      return new Response(JSON.stringify({ error: 'Failed to fetch line items' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Contract data retrieved, generating PDF...');

    // Generate PDF
    const pdfData = await createContractPDF(eventData, contractData, lineItems || []);

    // Generate filename and upload to storage
    const fileName = `contract-${eventData.code || eventData.id}-${Date.now()}.pdf`;
    const filePath = `contracts/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('contracts')
      .upload(filePath, pdfData, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw uploadError;
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('contracts')
      .getPublicUrl(filePath);

    const publicUrl = publicUrlData.publicUrl;

    // Update contract with PDF URL
    const { error: updateError } = await supabase
      .from('contracts')
      .update({ pdf_url: publicUrl })
      .eq('id', contractData.id);

    if (updateError) {
      console.error('Contract PDF URL update error:', updateError);
    }

    // Log audit entry
    try {
      await supabase.rpc('log_audit_entry', {
        p_entity_id: eventId,
        p_entity: 'contracts',
        p_action: 'pdf_generated',
        p_actor_id: null,
        p_diff: { contract_id: contractData.id, file_path: filePath, public_url: publicUrl }
      });
    } catch (auditError) {
      console.warn('Audit log failed:', auditError);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      url: publicUrl,
      contractRef: eventData.code || eventData.id 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Contract PDF generation error:', error);
    return new Response(JSON.stringify({ error: 'Contract PDF generation failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function createContractPDF(eventData: any, contractData: any, lineItems: any[]): Promise<Uint8Array> {
  // Helpers
  const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  };

  const fetchImageDataUrl = async (url: string) => {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to fetch image: ${url}`);
      const contentType = res.headers.get('content-type') || 'image/png';
      const ab = await res.arrayBuffer();
      const b64 = arrayBufferToBase64(ab);
      return `data:${contentType};base64,${b64}`;
    } catch (e) {
      console.warn('Failed to load image:', url, e);
      return null;
    }
  };

  // Load custom fonts
  const loadGoogleFont = async (fontName: string, fontUrl: string) => {
    try {
      const response = await fetch(fontUrl);
      const fontData = await response.arrayBuffer();
      const base64Font = arrayBufferToBase64(fontData);
      return base64Font;
    } catch (e) {
      console.warn(`Failed to load font ${fontName}:`, e);
      return null;
    }
  };

  // Create document
  const doc = new jsPDF('p', 'mm', 'a4');
  
  // Load branded fonts
  try {
    const oswaldRegular = await loadGoogleFont('Oswald-Regular', 'https://fonts.gstatic.com/s/oswald/v53/TK3_WkUHHAIjg75cFRf3bXL8LICs1_FvsUZiZQ.woff2');
    const oswaldBold = await loadGoogleFont('Oswald-Bold', 'https://fonts.gstatic.com/s/oswald/v53/TK3_WkUHHAIjg75cFRf3bXL8LICs18NvsUZiZQ.woff2');
    const workSansRegular = await loadGoogleFont('WorkSans-Regular', 'https://fonts.gstatic.com/s/worksans/v19/QGY_z_wNahGAdqQ43RhVcIgYvQA.woff2');
    const workSansBold = await loadGoogleFont('WorkSans-Bold', 'https://fonts.gstatic.com/s/worksans/v19/QGY9z_wNahGAdqQ43Rh_ebrnlwyYfEPxPoGU3w.woff2');
    
    if (oswaldRegular) {
      doc.addFileToVFS('Oswald-Regular.ttf', oswaldRegular);
      doc.addFont('Oswald-Regular.ttf', 'Oswald', 'normal');
    }
    if (oswaldBold) {
      doc.addFileToVFS('Oswald-Bold.ttf', oswaldBold);
      doc.addFont('Oswald-Bold.ttf', 'Oswald', 'bold');
    }
    if (workSansRegular) {
      doc.addFileToVFS('WorkSans-Regular.ttf', workSansRegular);
      doc.addFont('WorkSans-Regular.ttf', 'WorkSans', 'normal');
    }
    if (workSansBold) {
      doc.addFileToVFS('WorkSans-Bold.ttf', workSansBold);
      doc.addFont('WorkSans-Bold.ttf', 'WorkSans', 'bold');
    }
    
    console.log('✅ Custom fonts loaded successfully');
  } catch (e) {
    console.warn('❌ Font loading failed, using system fonts:', e);
  }
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 18;
  const headerHeight = 34;
  const footerHeight = 18;

  const currentDate = new Date().toLocaleDateString('en-GB');
  const contractRef = eventData.code || String(eventData.id || '').slice(0, 8);

  // Load logo
  let logoDataUrl: string | null = null;
  try {
    logoDataUrl = await fetchImageDataUrl('https://www.croftcommontest.com/brand/logo.png');
    console.log('✅ Logo loaded successfully');
  } catch (e) {
    console.warn('❌ Logo loading failed:', e);
  }

  const drawHeaderFooter = (pageNumber: number) => {
    // Header
    const headerY = 12;
    if (logoDataUrl) {
      try {
        doc.addImage(logoDataUrl, 'PNG', margin, headerY, 18, 18);
      } catch (_) {}
    }
    
    doc.setTextColor(0, 0, 0);
    try {
      doc.setFont('Oswald', 'bold');
    } catch {
      doc.setFont('helvetica', 'bold');
    }
    doc.setFontSize(18);
    doc.text('CROFT COMMON', margin + (logoDataUrl ? 22 : 0), headerY + 8);

    // Right-aligned contract meta
    doc.setFontSize(20);
    doc.text('CONTRACT', pageWidth - margin, headerY + 4, { align: 'right' });
    try {
      doc.setFont('WorkSans', 'normal');
    } catch {
      doc.setFont('helvetica', 'normal');
    }
    doc.setFontSize(9);
    doc.text(`Contract Ref: ${contractRef}`, pageWidth - margin, headerY + 10, { align: 'right' });
    doc.text(`Date: ${currentDate}`, pageWidth - margin, headerY + 15, { align: 'right' });
    doc.text(`Version: ${contractData.version}`, pageWidth - margin, headerY + 20, { align: 'right' });

    // Divider
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.6);
    doc.line(margin, headerY + headerHeight - 6, pageWidth - margin, headerY + headerHeight - 6);

    // Footer
    const footY = pageHeight - footerHeight + 3;
    doc.setLineWidth(0.4);
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, footY - 4, pageWidth - margin, footY - 4);

    try {
      doc.setFont('Oswald', 'bold');
    } catch {
      doc.setFont('helvetica', 'bold');
    }
    doc.setFontSize(10);
    doc.text('CROFT COMMON', pageWidth / 2, footY, { align: 'center' });

    try {
      doc.setFont('WorkSans', 'normal');
    } catch {
      doc.setFont('helvetica', 'normal');
    }
    doc.setFontSize(8);
    doc.text('Unit 1-3, Croft Court, 48 Croft Street, London, SE8 4EX', pageWidth / 2, footY + 5, { align: 'center' });
    doc.text('hello@thehive-hospitality.com • 020 7946 0958', pageWidth / 2, footY + 9, { align: 'center' });

    doc.text(`Page ${pageNumber}`, pageWidth - margin, footY + 9, { align: 'right' });
  };

  // Calculate totals for display
  let totalNet = 0;
  let totalVat = 0;
  let totalGross = 0;
  const headcount = eventData.headcount || 1;

  for (const item of lineItems) {
    const qty = Number(item.qty || 1);
    const unit = Number(item.unit_price || 0);
    const multiplier = item.per_person ? headcount : 1;
    const gross = qty * unit * multiplier;
    const net = gross / 1.2; // assuming 20% VAT included
    const vat = gross - net;

    totalNet += net;
    totalVat += vat;
    totalGross += gross;
  }

  const serviceCharge = totalGross * (Number(eventData.service_charge_pct || 0) / 100);
  const finalTotal = totalGross + serviceCharge;

  // Draw first page with header/footer
  drawHeaderFooter(1);

  // Split contract content into pages using improved formatting
  let y = margin + headerHeight + 8;
  const maxY = pageHeight - footerHeight - 60; // Leave space for signatures

  const formattedContent = formatContractContent(contractData.content);
  
  for (const contentBlock of formattedContent) {
    // Check if we need a new page
    if (y > maxY) {
      doc.addPage();
      const pageNum = doc.getNumberOfPages();
      drawHeaderFooter(pageNum);
      y = margin + headerHeight + 8;
    }

    // Skip empty lines but add small spacing
    if (contentBlock.type === 'empty') {
      y += 2;
      continue;
    }

    // Set font based on content type
    try {
      switch (contentBlock.type) {
        case 'major-divider':
          doc.setFont('Oswald', 'bold');
          break;
        case 'minor-divider':
        case 'numbered-section':
        case 'label':
          doc.setFont('WorkSans', 'bold');
          break;
        default:
          doc.setFont('WorkSans', 'normal');
      }
    } catch {
      // Fallback to helvetica if custom fonts fail
      if (contentBlock.fontStyle === 'bold') {
        doc.setFont('helvetica', 'bold');
      } else {
        doc.setFont('helvetica', 'normal');
      }
    }
    
    doc.setFontSize(contentBlock.fontSize);

    // Add extra spacing for major sections
    if (contentBlock.type === 'major-divider') {
      y += 6;
    } else if (contentBlock.type === 'minor-divider') {
      y += 4;
    }

    // Split long lines and render
    const splitLines = doc.splitTextToSize(contentBlock.content, pageWidth - margin * 2);
    const lineHeight = contentBlock.fontSize * 0.5 + 1;
    
    for (const splitLine of splitLines) {
      if (y > maxY) {
        doc.addPage();
        const pageNum = doc.getNumberOfPages();
        drawHeaderFooter(pageNum);
        y = margin + headerHeight + 8;
      }
      
      doc.text(splitLine, margin, y);
      y += lineHeight;
    }
    
    // Add extra spacing after sections
    if (contentBlock.type === 'major-divider') {
      y += 3;
    } else if (contentBlock.type === 'minor-divider' || contentBlock.type === 'numbered-section') {
      y += 2;
    }
  }

  // Add signature section
  if (y > maxY - 40) {
    doc.addPage();
    const pageNum = doc.getNumberOfPages();
    drawHeaderFooter(pageNum);
    y = margin + headerHeight + 8;
  }

  y += 10; // Extra space before signatures

  // Signature section header
  try {
    doc.setFont('Oswald', 'bold');
  } catch {
    doc.setFont('helvetica', 'bold');
  }
  doc.setFontSize(12);
  doc.text('SIGNATURES', pageWidth / 2, y, { align: 'center' });
  y += 10;

  // Draw signature boxes side by side
  const boxWidth = (pageWidth - margin * 2 - 10) / 2; // 10mm gap between boxes
  const boxHeight = 25;
  const signatureY = y;

  // Croft Common signature box
  try {
    doc.setFont('WorkSans', 'bold');
  } catch {
    doc.setFont('helvetica', 'bold');
  }
  doc.setFontSize(9);
  doc.text('CROFT COMMON', margin, y);
  y += 5;
  
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.rect(margin, y, boxWidth, boxHeight);
  
  // Add Croft Common signature if available
  if (contractData.staff_signature_data?.signature) {
    try {
      const staffSigData = await fetchImageDataUrl(contractData.staff_signature_data.signature);
      if (staffSigData) {
        doc.addImage(staffSigData, 'PNG', margin + 2, y + 2, boxWidth - 4, boxHeight - 4);
      }
    } catch (e) {
      console.warn('Failed to load staff signature:', e);
    }
  }

  // Client signature box
  try {
    doc.setFont('WorkSans', 'bold');
  } catch {
    doc.setFont('helvetica', 'bold');
  }
  doc.setFontSize(9);
  doc.text('CLIENT', margin + boxWidth + 10, signatureY);
  
  doc.rect(margin + boxWidth + 10, signatureY + 5, boxWidth, boxHeight);
  
  // Add client signature if available
  if (contractData.client_signature_data?.signature) {
    try {
      const clientSigData = await fetchImageDataUrl(contractData.client_signature_data.signature);
      if (clientSigData) {
        doc.addImage(clientSigData, 'PNG', margin + boxWidth + 12, signatureY + 7, boxWidth - 4, boxHeight - 4);
      }
    } catch (e) {
      console.warn('Failed to load client signature:', e);
    }
  }

  // Signature dates
  y = signatureY + boxHeight + 8;
  try {
    doc.setFont('WorkSans', 'normal');
  } catch {
    doc.setFont('helvetica', 'normal');
  }
  doc.setFontSize(8);
  
  if (contractData.staff_signed_at) {
    const staffDate = new Date(contractData.staff_signed_at).toLocaleDateString('en-GB');
    doc.text(`Date: ${staffDate}`, margin, y);
  } else {
    doc.text('Date: ________________', margin, y);
  }
  
  if (contractData.client_signed_at) {
    const clientDate = new Date(contractData.client_signed_at).toLocaleDateString('en-GB');
    doc.text(`Date: ${clientDate}`, margin + boxWidth + 10, y);
  } else {
    doc.text('Date: ________________', margin + boxWidth + 10, y);
  }

  const ab = doc.output('arraybuffer');
  return new Uint8Array(ab);
}