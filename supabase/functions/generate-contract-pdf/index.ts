import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { jsPDF } from 'https://esm.sh/jspdf@2.5.1';

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

  // Create document
  const doc = new jsPDF('p', 'mm', 'a4');
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
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('CROFT COMMON', margin + (logoDataUrl ? 22 : 0), headerY + 8);

    // Right-aligned contract meta
    doc.setFontSize(20);
    doc.text('CONTRACT', pageWidth - margin, headerY + 4, { align: 'right' });
    doc.setFont('helvetica', 'normal');
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

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('CROFT COMMON', pageWidth / 2, footY, { align: 'center' });

    doc.setFont('helvetica', 'normal');
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

  // Split contract content into pages
  let y = margin + headerHeight + 8;
  const maxY = pageHeight - footerHeight - 10;
  const lineHeight = 4;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  const lines = contractData.content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check if we need a new page
    if (y > maxY) {
      doc.addPage();
      const pageNum = doc.getNumberOfPages();
      drawHeaderFooter(pageNum);
      y = margin + headerHeight + 8;
    }

    // Handle different line types
    if (line.includes('═══')) {
      // Bold section dividers
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
    } else if (line.includes('───')) {
      // Section headers
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
    } else if (line.trim().match(/^\d+\./)) {
      // Terms section numbers
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
    } else {
      // Regular content
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
    }

    // Split long lines
    const splitLines = doc.splitTextToSize(line || ' ', pageWidth - margin * 2);
    
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
  }

  const ab = doc.output('arraybuffer');
  return new Uint8Array(ab);
}