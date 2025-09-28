import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { jsPDF } from 'https://esm.sh/jspdf@2.5.1';
import autoTable from 'https://esm.sh/jspdf-autotable@5.0.2';
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

    // Before generating PDF, derive venue from first booking -> spaces
    let venue_space_name: string | null = null;
    let venue_capacity_text: string | null = null;
    console.log('🔍 Looking up venue details for event:', eventId);
    try {
      const { data: booking } = await supabase
        .from('bookings')
        .select('space_id, start_ts')
        .eq('event_id', eventId)
        .order('start_ts', { ascending: true })
        .limit(1)
        .single();
      console.log('📅 Found booking with space_id:', booking?.space_id);
      if (booking?.space_id) {
        const { data: space } = await supabase
          .from('spaces')
          .select('name, capacity_seated, capacity_standing')
          .eq('id', booking.space_id)
          .single();
        console.log('🏢 Found space data:', space);
        if (space) {
          venue_space_name = space.name;
          const seated = space.capacity_seated || 0;
          const standing = space.capacity_standing || 0;
          venue_capacity_text = seated || standing ? `${seated} seated, ${standing} standing` : null;
          console.log('✅ Venue derived:', venue_space_name, venue_capacity_text);
        }
      }
    } catch (e) {
      console.warn('❌ Venue lookup failed:', e);
    }

    // Pass derived venue details down
    const pdfData = await createProposalPDF({ ...eventData, venue_space_name, venue_capacity_text }, lineItems || []);

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
  // Helpers
  const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  };

  const fetchBase64 = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch asset: ${url}`);
    const ab = await res.arrayBuffer();
    return arrayBufferToBase64(ab);
  };

  const fetchImageDataUrl = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch image: ${url}`);
    const contentType = res.headers.get('content-type') || 'image/png';
    const ab = await res.arrayBuffer();
    const b64 = arrayBufferToBase64(ab);
    return `data:${contentType};base64,${b64}`;
  };

  // Create document
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 18;
  const headerHeight = 34;
  const footerHeight = 18;

  const currentDate = new Date().toLocaleDateString('en-GB');
  const eventDate = eventData.primary_date
    ? new Date(eventData.primary_date).toLocaleDateString('en-GB')
    : currentDate;
  const proposalRef = eventData.code || String(eventData.id || '').slice(0, 8);
  const headcount = eventData.headcount || 1;
  const serviceChargePct = Number(eventData.service_charge_pct || 0);

  // Load brand fonts and logo
  let customFontsLoaded = false;
  let headerFont = 'helvetica';
  let bodyFont = 'helvetica';
  let logoDataUrl: string | null = null;

  try {
    // Load fonts and logo in parallel
    const [workSansB64, oswaldB64, logoData] = await Promise.all([
      fetchBase64('https://raw.githubusercontent.com/google/fonts/main/ofl/worksans/WorkSans%5Bwght%5D.ttf'),
      fetchBase64('https://raw.githubusercontent.com/google/fonts/main/ofl/oswald/Oswald%5Bwght%5D.ttf'),
      fetchImageDataUrl('https://www.croftcommontest.com/brand/logo.png'),
    ]);

    // Add fonts to PDF
    doc.addFileToVFS('WorkSans.ttf', workSansB64);
    doc.addFont('WorkSans.ttf', 'WorkSans', 'normal');
    doc.addFont('WorkSans.ttf', 'WorkSans', 'bold');

    doc.addFileToVFS('Oswald.ttf', oswaldB64);
    doc.addFont('Oswald.ttf', 'Oswald', 'normal');
    doc.addFont('Oswald.ttf', 'Oswald', 'bold');

    customFontsLoaded = true;
    headerFont = 'Oswald';
    bodyFont = 'WorkSans';
    logoDataUrl = logoData;
    console.log('✅ Fonts and logo loaded successfully');
  } catch (e) {
    console.warn('❌ Font/logo loading failed, falling back to system fonts:', e);
    customFontsLoaded = false;
    headerFont = 'helvetica';
    bodyFont = 'helvetica';
    logoDataUrl = null;
  }


  const drawHeaderFooter = (pageNumber: number) => {
    // Header (repeated)
    const headerY = 12;
    if (logoDataUrl) {
      try {
        doc.addImage(logoDataUrl, 'PNG', margin, headerY, 18, 18);
      } catch (_) {}
    }
    doc.setTextColor(0, 0, 0);
    doc.setFont(headerFont, 'bold');
    doc.setFontSize(18);
    doc.text('CROFT COMMON', margin + (logoDataUrl ? 22 : 0), headerY + 8);

    // Right-aligned proposal meta
    doc.setFontSize(20);
    doc.text('PROPOSAL', pageWidth - margin, headerY + 4, { align: 'right' });
    doc.setFont(headerFont, 'normal');
    doc.setFontSize(9);
    doc.text(`Proposal Ref: ${proposalRef}`, pageWidth - margin, headerY + 10, { align: 'right' });
    doc.text(`Date: ${currentDate}`, pageWidth - margin, headerY + 15, { align: 'right' });
    doc.text(`Version: v1`, pageWidth - margin, headerY + 20, { align: 'right' });

    // Divider
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.6);
    doc.line(margin, headerY + headerHeight - 6, pageWidth - margin, headerY + headerHeight - 6);

    // Footer (repeated)
    const footY = pageHeight - footerHeight + 3;
    doc.setLineWidth(0.4);
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, footY - 4, pageWidth - margin, footY - 4);

    doc.setFont(headerFont, 'bold');
    doc.setFontSize(10);
    doc.text('CROFT COMMON', pageWidth / 2, footY, { align: 'center' });

    doc.setFont(bodyFont, 'normal');
    doc.setFontSize(8);
    doc.text('Unit 1-3, Croft Court, 48 Croft Street, London, SE8 4EX', pageWidth / 2, footY + 5, { align: 'center' });
    doc.text('hello@thehive-hospitality.com • 020 7946 0958', pageWidth / 2, footY + 9, { align: 'center' });

    doc.text(`Page ${pageNumber}`, pageWidth - margin, footY + 9, { align: 'right' });
  };

  // Page 1 static header/footer via autoTable hook later, but we draw details ourselves
  // CLIENT + EVENT DETAILS
  let y = margin + headerHeight + 4;
  doc.setFont(headerFont, 'bold');
  doc.setFontSize(12);
  doc.text('CLIENT DETAILS', margin, y);
  doc.text('EVENT DETAILS', pageWidth / 2 + 6, y);
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(margin, y + 1.5, margin + 60, y + 1.5);
  doc.line(pageWidth / 2 + 6, y + 1.5, pageWidth - margin, y + 1.5);

  y += 8;
  doc.setFont(bodyFont, 'normal');
  doc.setFontSize(9);

  // Left column (client)
  const leftX = margin;
  doc.setFont(bodyFont, 'normal');
  doc.text('Name:', leftX, y);
  doc.text(String(eventData.client_name || 'Client'), leftX + 22, y);
  y += 5;
  doc.text('Email:', leftX, y);
  doc.text(String(eventData.client_email || eventData.contact_email || '—'), leftX + 22, y);
  y += 5;
  doc.text('Phone:', leftX, y);
  doc.text(String(eventData.client_phone || '—'), leftX + 22, y);

  // Right column (event)
  let rightY = margin + headerHeight + 12;
  const rightX = pageWidth / 2 + 6;
  doc.text('Event Date:', rightX, rightY);
  doc.text(eventDate, rightX + 28, rightY);
  rightY += 5;
  doc.text('Event Type:', rightX, rightY);
  doc.text(String(eventData.event_type || '—'), rightX + 28, rightY);
  rightY += 5;
  doc.text('Headcount:', rightX, rightY);
  doc.text(`${headcount} guests`, rightX + 28, rightY);
  rightY += 5;
  if (serviceChargePct > 0) {
    doc.text('Service charge:', rightX, rightY);
    doc.text(`${serviceChargePct}%`, rightX + 28, rightY);
    rightY += 5;
  }

  // VENUE DETAILS box - using proper space data from booking lookup
  y = Math.max(y, rightY) + 8;
  doc.setFont(headerFont, 'bold');
  doc.setFontSize(12);
  doc.text('VENUE DETAILS', margin, y);
  doc.setLineWidth(0.5);
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y + 1.5, margin + 60, y + 1.5);
  y += 6;

  doc.setFillColor(248, 249, 251);
  doc.setDrawColor(220, 223, 228);
  doc.rect(margin, y, pageWidth - margin * 2, 18, 'FD');

  doc.setFont(bodyFont, 'normal');
  doc.setFontSize(9);
  doc.text('Space:', margin + 4, y + 6);
  // Use the venue lookup data or fallback to eventData
  const spaceName = eventData.venue_space_name || eventData.spaces?.name || eventData.venue_name || 'Croft Common';
  console.log('📍 Venue space name:', spaceName);
  doc.text(String(spaceName), margin + 22, y + 6);
  doc.text('Capacity:', margin + 4, y + 12);
  // Use the capacity text from venue lookup or calculate from spaces data
  const capacity = eventData.venue_capacity_text || 
    (eventData.spaces?.capacity_seated 
      ? `${eventData.spaces.capacity_seated} seated, ${eventData.spaces.capacity_standing || 0} standing`
      : `${headcount} guests`);
  console.log('👥 Venue capacity:', capacity);
  doc.text(String(capacity), margin + 22, y + 12);

  // Totals calculation (net, VAT, service, gross)
  let netSubtotal = 0;
  let vatTotal = 0;
  const rows: any[] = [];
  for (const item of lineItems) {
    const qty = Number(item.qty || 1);
    const unit = Number(item.unit_price || 0);
    const multiplier = item.per_person ? headcount : 1;
    const gross = qty * unit * multiplier;
    const net = gross / 1.2; // assuming 20% VAT included
    const vat = gross - net;
    if ((item.type || '').toLowerCase() === 'discount') {
      netSubtotal -= net;
      vatTotal -= vat;
    } else {
      netSubtotal += net;
      vatTotal += vat;
    }

    const qtyLabel = `${qty} × £${unit.toFixed(2)}${item.per_person ? ` × ${headcount}` : ''}`;
    rows.push([
      String((item.type || '').toUpperCase()),
      String(item.description || ''),
      qtyLabel,
      `£${net.toFixed(2)}`,
      `£${vat.toFixed(2)}`,
      `£${gross.toFixed(2)}`,
    ]);
  }
  const serviceChargeAmount = netSubtotal * (serviceChargePct / 100);
  const grandTotal = netSubtotal + vatTotal + serviceChargeAmount;

  // Items table with automatic pagination and repeated header/footer
  const tableStartY = Math.max(y + 24, margin + headerHeight + 10);
  autoTable(doc as any, {
    head: [[
      'TYPE',
      'DESCRIPTION',
      'QTY × PRICE',
      'NET',
      'VAT',
      'LINE TOTAL',
    ]],
    body: rows,
    startY: tableStartY,
    margin: { left: margin, right: margin, top: headerHeight + 6, bottom: footerHeight + 6 },
    styles: { font: bodyFont, fontSize: 9, cellPadding: 2.5, lineColor: [229, 231, 235], lineWidth: 0.2, valign: 'middle' },
    headStyles: { fillColor: [26, 26, 26], textColor: [255, 255, 255], font: headerFont, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [250, 250, 250] },
    columnStyles: {
      0: { cellWidth: 26 }, // Type
      1: { cellWidth: 'auto' }, // Description (flex)
      2: { cellWidth: 36 }, // Qty × Price
      3: { cellWidth: 22, halign: 'right' }, // Net
      4: { cellWidth: 22, halign: 'right' }, // VAT
      5: { cellWidth: 28, halign: 'right' }, // Total
    },
    didDrawPage: (data: any) => {
      drawHeaderFooter(data.pageNumber);
    },
    rowPageBreak: 'auto',
    theme: 'grid',
  });

  let finalY = (doc as any).lastAutoTable?.finalY || tableStartY;

  // Totals block - ensure visible on last page (avoid overlapping footer)
  const needed = serviceChargePct > 0 ? 40 : 32;
  if (finalY + needed > pageHeight - footerHeight - 8) {
    doc.addPage();
    drawHeaderFooter(doc.getNumberOfPages());
    finalY = margin + headerHeight + 8;
  }

  // Divider
  doc.setDrawColor(26, 26, 26);
  doc.setLineWidth(0.6);
  doc.line(margin, finalY + 4, pageWidth - margin, finalY + 4);
  let ty = finalY + 12;
  doc.setFont(bodyFont, 'normal');
  doc.setFontSize(10);

  // Net Subtotal
  doc.text('Net Subtotal:', pageWidth - margin - 60, ty);
  doc.setFont(bodyFont, 'bold');
  doc.text(`£${netSubtotal.toFixed(2)}`, pageWidth - margin, ty, { align: 'right' });
  ty += 6;

  // VAT
  doc.setFont(bodyFont, 'normal');
  doc.text('VAT (20%):', pageWidth - margin - 60, ty);
  doc.setFont(bodyFont, 'bold');
  doc.text(`£${vatTotal.toFixed(2)}`, pageWidth - margin, ty, { align: 'right' });
  ty += 6;

  // Service Charge
  if (serviceChargePct > 0) {
    doc.setFont(bodyFont, 'normal');
    doc.text(`Service Charge (${serviceChargePct}%):`, pageWidth - margin - 60, ty);
    doc.setFont(bodyFont, 'bold');
    doc.text(`£${serviceChargeAmount.toFixed(2)}`, pageWidth - margin, ty, { align: 'right' });
    ty += 6;
  }

  // Grand Total
  ty += 4;
  doc.setLineWidth(0.4);
  doc.setDrawColor(220, 220, 220);
  doc.line(pageWidth - margin - 60, ty, pageWidth - margin, ty);
  ty += 8;
  doc.setFont(headerFont, 'bold');
  doc.setFontSize(13);
  doc.text('GRAND TOTAL:', pageWidth - margin - 60, ty);
  doc.text(`£${grandTotal.toFixed(2)}`, pageWidth - margin, ty, { align: 'right' });

  // Terms note (above footer)
  let noteY = ty + 10;
  if (noteY > pageHeight - footerHeight - 8) {
    doc.addPage();
    drawHeaderFooter(doc.getNumberOfPages());
    noteY = margin + headerHeight + 8;
  }
  doc.setFont(bodyFont, 'normal');
  doc.setFontSize(8);
  doc.text('This proposal is valid for 30 days from the date of issue. Prices include VAT unless stated.', margin, noteY);

  const ab = doc.output('arraybuffer');
  return new Uint8Array(ab);
}