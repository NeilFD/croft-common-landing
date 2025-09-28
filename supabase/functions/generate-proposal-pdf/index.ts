import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GeneratePDFRequest {
  eventId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { eventId }: GeneratePDFRequest = await req.json();

    if (!eventId) {
      return new Response(
        JSON.stringify({ error: 'Event ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Generating PDF for event:', eventId);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get event details from management_events (no nested relations to avoid errors)
    const { data: eventData, error: eventError } = await supabase
      .from('management_events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (eventError || !eventData) {
      console.error('Event fetch error:', eventError);
      return new Response(
        JSON.stringify({ error: 'Event not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Event data retrieved:', eventData.code || eventId);

    // Get line items from management_event_line_items
    const { data: lineItems } = await supabase
      .from('management_event_line_items')
      .select('*')
      .eq('event_id', eventId)
      .order('sort_order');

    console.log('Line items retrieved:', lineItems?.length || 0, 'items');

    // Generate PDF content
    const pdfContent = generatePDFHTML(eventData, lineItems || []);
    
    // Convert HTML to PDF using browser automation
    const pdfBuffer = await htmlToPDF(pdfContent);
    
    // Ensure proposals bucket exists and is public
    const { error: bucketError } = await supabase.storage.createBucket('proposals', { public: true });
    if (bucketError && !bucketError.message.includes('already exists')) {
      console.warn('Bucket creation warning:', bucketError);
    }

    // Store PDF in Supabase Storage
    const fileName = `proposal-${eventData.code || eventId}-${Date.now()}.pdf`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('proposals')
      .upload(fileName, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return new Response(
        JSON.stringify({ error: 'Failed to save PDF' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get public URL
    const { data: publicUrl } = supabase.storage
      .from('proposals')
      .getPublicUrl(fileName);

    // Store PDF metadata
    await supabase
      .from('proposal_pdfs')
      .insert({
        event_id: eventId,
        file_path: fileName,
        public_url: publicUrl.publicUrl,
        generated_at: new Date().toISOString()
      });

    // Add audit trail
    await supabase.rpc('log_audit_entry', {
      p_entity_id: eventId,
      p_entity: 'management_events',
      p_action: 'PDF_GENERATED',
      p_actor_id: null,
      p_diff: { file_name: fileName, pdf_url: publicUrl.publicUrl }
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        pdfUrl: publicUrl.publicUrl,
        fileName: fileName
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating PDF:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

function generatePDFHTML(eventData: any, lineItems: any[]): string {
  const currentDate = new Date().toLocaleDateString('en-GB');
  const eventDate = new Date(eventData.primary_date).toLocaleDateString('en-GB');
  
  // Calculate totals
  const serviceChargePct = eventData.service_charge_pct || 0;
  let netSubtotal = 0;
  let vatTotal = 0;

  const itemsHTML = lineItems.map(item => {
    // unit_price is VAT-inclusive (gross)
    const lineGross = (item.qty || 1) * (item.unit_price || 0) * (item.per_person ? (eventData.headcount || 1) : 1);
    const lineNet = lineGross / (1 + ((item.tax_rate_pct || 20) / 100)); // Net = Gross / (1 + VAT rate)
    const lineVat = lineGross - lineNet; // VAT = Gross - Net
    
    netSubtotal += lineNet;
    vatTotal += lineVat;

    return `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${item.description}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.qty || 1}${item.per_person ? ` × ${eventData.headcount}` : ''}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">£${(item.unit_price || 0).toFixed(2)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">£${lineGross.toFixed(2)}</td>
      </tr>
    `;
  }).join('');

  const serviceChargeAmount = netSubtotal * (serviceChargePct / 100);
  const grandTotal = netSubtotal + vatTotal + serviceChargeAmount;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Proposal - ${eventData.code || eventData.id}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #1f2937; }
        .header { text-align: center; margin-bottom: 40px; }
        .logo { font-size: 24px; font-weight: bold; color: #1f2937; }
        .section { margin-bottom: 30px; }
        .title { font-size: 18px; font-weight: bold; margin-bottom: 10px; color: #374151; }
        .details { display: flex; justify-content: space-between; margin-bottom: 20px; }
        .details-column { flex: 1; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th { background-color: #f9fafb; padding: 12px 8px; text-align: left; font-weight: 600; }
        .totals-table { margin-top: 20px; }
        .totals-table td { padding: 8px; border: none; }
        .grand-total { font-weight: bold; font-size: 16px; color: #1f2937; }
        .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #6b7280; }
        .status-badge { display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 600; }
        .status-draft { background-color: #fef3c7; color: #92400e; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">CROFT COMMON</div>
        <p>Event Proposal</p>
      </div>

      <div class="section">
        <div class="details">
          <div class="details-column">
            <div class="title">Proposal Details</div>
            <p><strong>Proposal Reference:</strong> ${eventData.code || eventData.id}</p>
            <p><strong>Date of Proposal:</strong> ${currentDate}</p>
            <p><strong>Status:</strong> <span class="status-badge status-draft">${eventData.status || 'Draft'}</span></p>
          </div>
          <div class="details-column">
            <div class="title">Client Information</div>
            <p><strong>Name:</strong> ${eventData.contact_name || 'N/A'}</p>
            <p><strong>Email:</strong> ${eventData.contact_email || 'N/A'}</p>
            <p><strong>Phone:</strong> ${eventData.contact_phone || 'N/A'}</p>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="title">Event Details</div>
        <div class="details">
          <div class="details-column">
            <p><strong>Event Date:</strong> ${eventDate}</p>
            <p><strong>Event Type:</strong> ${eventData.event_type || 'N/A'}</p>
            <p><strong>Headcount:</strong> ${eventData.headcount || 'N/A'} guests</p>
          </div>
          <div class="details-column">
            <p><strong>Venue:</strong> TBC</p>
            <p><strong>Capacity:</strong> TBC</p>
            <p><strong>Budget Range:</strong> £${eventData.budget_low || 0} - £${eventData.budget_high || 0}</p>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="title">Proposal Breakdown</div>
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th style="text-align: center;">Quantity</th>
              <th style="text-align: right;">Unit Price</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHTML}
          </tbody>
        </table>

        <table class="totals-table" style="width: 300px; margin-left: auto;">
          <tr>
            <td><strong>Net Subtotal:</strong></td>
            <td style="text-align: right;"><strong>£${netSubtotal.toFixed(2)}</strong></td>
          </tr>
          <tr>
            <td>VAT (20%):</td>
            <td style="text-align: right;">£${vatTotal.toFixed(2)}</td>
          </tr>
          ${serviceChargePct > 0 ? `
          <tr>
            <td>Service Charge (${serviceChargePct}%):</td>
            <td style="text-align: right;">£${serviceChargeAmount.toFixed(2)}</td>
          </tr>
          ` : ''}
          <tr class="grand-total">
            <td><strong>Grand Total:</strong></td>
            <td style="text-align: right;"><strong>£${grandTotal.toFixed(2)}</strong></td>
          </tr>
        </table>
      </div>

      <div class="footer">
        <p><strong>Croft Common</strong></p>
        <p>hello@thehive-hospitality.com | www.croftcommontest.com</p>
        <p>This proposal is valid for 30 days from the date of issue.</p>
      </div>
    </body>
    </html>
  `;
}

async function htmlToPDF(html: string): Promise<Uint8Array> {
  // Import pdf-lib for PDF generation
  const { PDFDocument, rgb, StandardFonts } = await import('https://cdn.skypack.dev/pdf-lib@1.17.1');
  
  console.log('Generating PDF from HTML content');
  
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4 size
  
  // Get fonts
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  // Extract key content from HTML for PDF
  const lines = html.split('\n').map(line => line.trim()).filter(line => line);
  
  let yPosition = 800;
  const leftMargin = 50;
  
  // Simple HTML to text conversion for PDF
  for (const line of lines) {
    if (yPosition < 50) break; // Don't go below bottom margin
    
    if (line.includes('CROFT COMMON')) {
      page.drawText('CROFT COMMON', {
        x: leftMargin,
        y: yPosition,
        size: 24,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      yPosition -= 40;
    } else if (line.includes('Event Proposal')) {
      page.drawText('Event Proposal', {
        x: leftMargin,
        y: yPosition,
        size: 16,
        font: font,
        color: rgb(0, 0, 0),
      });
      yPosition -= 30;
    } else if (line.includes('<strong>') || line.includes('<b>')) {
      // Extract text from bold tags
      const text = line.replace(/<[^>]*>/g, '').replace(/&[^;]*;/g, ' ');
      if (text.trim()) {
        page.drawText(text.trim(), {
          x: leftMargin,
          y: yPosition,
          size: 12,
          font: boldFont,
          color: rgb(0, 0, 0),
        });
        yPosition -= 20;
      }
    } else if (line.includes('<p>') || line.includes('<td>')) {
      // Extract text from paragraph or table cell tags
      const text = line.replace(/<[^>]*>/g, '').replace(/&[^;]*;/g, ' ');
      if (text.trim() && !text.includes('style=')) {
        page.drawText(text.trim(), {
          x: leftMargin,
          y: yPosition,
          size: 10,
          font: font,
          color: rgb(0, 0, 0),
        });
        yPosition -= 15;
      }
    }
  }
  
  // Add footer
  page.drawText('Croft Common | hello@thehive-hospitality.com | www.croftcommontest.com', {
    x: leftMargin,
    y: 30,
    size: 8,
    font: font,
    color: rgb(0.4, 0.4, 0.4),
  });
  
  const pdfBytes = await pdfDoc.save();
  console.log('PDF generated successfully, size:', pdfBytes.length, 'bytes');
  
  return pdfBytes;
}

serve(handler);