import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { jsPDF } from 'https://esm.sh/jspdf@2.5.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

Deno.serve(async (req) => {
  console.log('📄 PDF Generation request received:', req.method);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { eventId } = await req.json();
    console.log('Generating PDF for event:', eventId);

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

    console.log('Event data retrieved:', eventData.code);

    // Fetch line items
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

    console.log('Line items retrieved:', lineItems?.length, 'items');

    // Generate PDF using jsPDF
    console.log('Creating PDF with jsPDF');
    const pdfData = await createProposalPDF(eventData, lineItems || []);
    console.log('PDF generated successfully, size:', pdfData.length, 'bytes');

    // Generate filename and upload to storage
    const fileName = `proposal-${eventData.code || eventData.id}-${Date.now()}.pdf`;
    const filePath = `proposals/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('proposals')
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
      .from('proposals')
      .getPublicUrl(filePath);

    const publicUrl = publicUrlData.publicUrl;

    // Save PDF metadata
    const { error: saveError } = await supabase
      .from('proposal_pdfs')
      .insert({
        event_id: eventId,
        file_path: filePath,
        public_url: publicUrl,
        generated_at: new Date().toISOString(),
      });

    if (saveError) {
      console.error('PDF metadata save error:', saveError);
    }

    // Log audit entry
    try {
      await supabase.rpc('log_audit_entry', {
        p_entity_id: eventId,
        p_entity: 'event',
        p_action: 'pdf_generated',
        p_actor_id: null,
        p_diff: { file_path: filePath, public_url: publicUrl }
      });
    } catch (auditError) {
      console.warn('Audit log failed:', auditError);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      url: publicUrl,
      proposalCode: eventData.code || eventData.id 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ PDF generation error:', error);
    return new Response(JSON.stringify({ error: 'PDF generation failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function createProposalPDF(eventData: any, lineItems: any[]): Promise<Uint8Array> {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;
  
  let yPos = margin;
  const currentDate = new Date().toLocaleDateString('en-GB');
  const eventDate = eventData.primary_date ? new Date(eventData.primary_date).toLocaleDateString('en-GB') : '28/09/2025';
  
  // Calculate totals (same logic as frontend)
  const serviceChargePct = eventData.service_charge_pct || 0;
  let netSubtotal = 0;
  let vatTotal = 0;

  lineItems.forEach(item => {
    const lineGross = (item.qty || 1) * (item.unit_price || 0) * (item.per_person ? (eventData.headcount || 1) : 1);
    const lineNet = lineGross / 1.2; // VAT-inclusive to net
    const lineVat = lineGross - lineNet;
    
    if (item.type === 'discount') {
      netSubtotal -= lineNet;
      vatTotal -= lineVat;
    } else {
      netSubtotal += lineNet;
      vatTotal += lineVat;
    }
  });

  const serviceChargeAmount = netSubtotal * (serviceChargePct / 100);
  const grandTotal = netSubtotal + vatTotal + serviceChargeAmount;

  // Header Section
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('CROFT COMMON', margin, yPos);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Private Events & Corporate Hire', margin, yPos + 8);
  
  // Proposal info (top right)
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('PROPOSAL', pageWidth - margin - 50, yPos, { align: 'right' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Proposal Ref: ${eventData.code || '2025002'}`, pageWidth - margin - 50, yPos + 10, { align: 'right' });
  doc.text(`Date: ${currentDate}`, pageWidth - margin - 50, yPos + 16, { align: 'right' });
  doc.text(`Version: v1`, pageWidth - margin - 50, yPos + 22, { align: 'right' });
  
  // Header line
  yPos += 35;
  doc.setLineWidth(2);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 15;
  
  // Client and Event Details (two columns)
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('CLIENT DETAILS', margin, yPos);
  doc.text('EVENT DETAILS', pageWidth / 2 + 10, yPos);
  
  // Underline section headers
  doc.setLineWidth(1);
  doc.line(margin, yPos + 2, margin + 60, yPos + 2);
  doc.line(pageWidth / 2 + 10, yPos + 2, pageWidth / 2 + 70, yPos + 2);
  
  yPos += 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  // Client details (left column)
  doc.setFont('helvetica', 'bold');
  doc.text('Name: ', margin, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(eventData.client_name || 'Michael Brown', margin + 20, yPos);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Email: ', margin, yPos + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(eventData.client_email || 'michael.brown@techcorp.com', margin + 20, yPos + 6);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Phone: ', margin, yPos + 12);
  doc.setFont('helvetica', 'normal');
  doc.text(eventData.client_phone || '07987 654321', margin + 20, yPos + 12);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Company: ', margin, yPos + 18);
  doc.setFont('helvetica', 'normal');
  doc.text(eventData.client_name || 'TechCorp Ltd', margin + 20, yPos + 18);
  
  // Event details (right column)
  doc.setFont('helvetica', 'bold');
  doc.text('Event Date: ', pageWidth / 2 + 10, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(eventDate, pageWidth / 2 + 35, yPos);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Event Type: ', pageWidth / 2 + 10, yPos + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(eventData.event_type || 'Presentation', pageWidth / 2 + 35, yPos + 6);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Headcount: ', pageWidth / 2 + 10, yPos + 12);
  doc.setFont('helvetica', 'normal');
  doc.text(`${eventData.headcount || 1} guests`, pageWidth / 2 + 35, yPos + 12);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Space: ', pageWidth / 2 + 10, yPos + 18);
  doc.setFont('helvetica', 'normal');
  doc.text('TBC', pageWidth / 2 + 35, yPos + 18);
  
  yPos += 35;
  
  // Venue Details Section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('VENUE DETAILS', margin, yPos);
  doc.setLineWidth(1);
  doc.line(margin, yPos + 2, margin + 60, yPos + 2);
  
  yPos += 10;
  
  // Venue box
  doc.setFillColor(249, 250, 251);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 20, 'F');
  doc.setDrawColor(209, 213, 219);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 20);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Space: ', margin + 5, yPos + 6);
  doc.setFont('helvetica', 'normal');
  doc.text('TBC', margin + 20, yPos + 6);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Capacity: ', margin + 5, yPos + 12);
  doc.setFont('helvetica', 'normal');
  doc.text('TBC', margin + 25, yPos + 12);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Setup: ', margin + 5, yPos + 18);
  doc.setFont('helvetica', 'normal');
  doc.text('Theatre style with presentation equipment', margin + 20, yPos + 18);
  
  yPos += 35;
  
  // Proposal Breakdown Section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('PROPOSAL BREAKDOWN', margin, yPos);
  doc.setLineWidth(1);
  doc.line(margin, yPos + 2, margin + 80, yPos + 2);
  
  yPos += 15;
  
  // Line items
  lineItems.forEach((item, index) => {
    const lineGross = (item.qty || 1) * (item.unit_price || 0) * (item.per_person ? (eventData.headcount || 1) : 1);
    const lineNet = lineGross / 1.2;
    const lineVat = lineGross - lineNet;
    
    doc.setFontSize(10);
    
    // Type badge
    doc.setFillColor(107, 114, 128); // Default gray
    if (item.type === 'room') doc.setFillColor(37, 99, 235); // Blue
    if (item.type === 'menu') doc.setFillColor(5, 150, 105); // Green
    if (item.type === 'addon') doc.setFillColor(59, 130, 246); // Light blue
    if (item.type === 'discount') doc.setFillColor(220, 38, 38); // Red
    
    doc.roundedRect(margin, yPos - 4, 25, 6, 1, 1, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text(item.type.toUpperCase(), margin + 12.5, yPos, { align: 'center' });
    
    // Description
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.text(item.description, margin + 30, yPos);
    
    // Quantity details
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    const qtyText = `Qty: ${item.qty} × £${(item.unit_price || 0).toFixed(2)}${item.per_person ? ` × ${eventData.headcount} people` : ''}`;
    doc.text(qtyText, margin + 30, yPos + 4);
    
    // Amounts (right side)
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`£${lineGross.toFixed(2)}`, pageWidth - margin - 30, yPos, { align: 'right' });
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128);
    doc.text(`Net: £${lineNet.toFixed(2)}`, pageWidth - margin - 30, yPos + 4, { align: 'right' });
    doc.text(`VAT: £${lineVat.toFixed(2)}`, pageWidth - margin - 30, yPos + 8, { align: 'right' });
    
    // Line separator
    yPos += 15;
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 5;
    
    doc.setTextColor(0, 0, 0);
  });
  
  yPos += 10;
  
  // Totals Section
  doc.setLineWidth(2);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 15;
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  
  // Net Subtotal
  doc.text('Net Subtotal:', margin, yPos);
  doc.setFont('helvetica', 'bold');
  doc.text(`£${netSubtotal.toFixed(2)}`, pageWidth - margin - 30, yPos, { align: 'right' });
  yPos += 8;
  
  // VAT
  doc.setFont('helvetica', 'normal');
  doc.text('VAT (20%):', margin, yPos);
  doc.setFont('helvetica', 'bold');
  doc.text(`£${vatTotal.toFixed(2)}`, pageWidth - margin - 30, yPos, { align: 'right' });
  yPos += 8;
  
  // Service Charge (if applicable)
  if (serviceChargePct > 0) {
    doc.setFont('helvetica', 'normal');
    doc.text(`Service Charge (${serviceChargePct}%):`, margin, yPos);
    doc.setFont('helvetica', 'bold');
    doc.text(`£${serviceChargeAmount.toFixed(2)}`, pageWidth - margin - 30, yPos, { align: 'right' });
    yPos += 8;
  }
  
  // Grand Total
  yPos += 5;
  doc.setLineWidth(1);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('GRAND TOTAL:', margin, yPos);
  doc.text(`£${grandTotal.toFixed(2)}`, pageWidth - margin - 30, yPos, { align: 'right' });
  
  yPos += 25;
  
  // Footer
  doc.setLineWidth(1);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('CROFT COMMON', pageWidth / 2, yPos, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  yPos += 8;
  doc.text('Unit 1-3, Croft Court, 48 Croft Street, London, SE8 4EX', pageWidth / 2, yPos, { align: 'center' });
  yPos += 6;
  doc.text('Email: hello@thehive-hospitality.com | Phone: 020 7946 0958', pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;
  doc.setFontSize(8);
  doc.text('This proposal is valid for 30 days from the date of issue. Terms and conditions apply.', pageWidth / 2, yPos, { align: 'center' });
  
  return doc.output('arraybuffer');
}