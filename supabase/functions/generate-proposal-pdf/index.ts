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
  
  // Calculate totals (same logic as frontend)
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

    const typeColors = {
      room: '#2563eb', // blue
      menu: '#059669', // emerald
      addon: '#3b82f6', // blue
      discount: '#dc2626' // red
    };

    return `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
        <div style="flex: 1;">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 4px;">
            <span style="background-color: ${typeColors[item.type as keyof typeof typeColors] || '#6b7280'}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; text-transform: uppercase;">
              ${item.type.toUpperCase()}
            </span>
            <span style="font-weight: 500; font-size: 16px;">${item.description}</span>
          </div>
          <div style="font-size: 12px; color: #6b7280; margin-left: 64px;">
            Qty: ${item.qty} × £${(item.unit_price || 0).toFixed(2)}${item.per_person ? ` × ${eventData.headcount} people` : ''}
          </div>
        </div>
        <div style="text-align: right; min-width: 120px;">
          <div style="font-weight: bold; font-size: 18px;">£${lineGross.toFixed(2)}</div>
          <div style="font-size: 10px; color: #6b7280;">Net: £${lineNet.toFixed(2)}</div>
          <div style="font-size: 10px; color: #6b7280;">VAT: £${lineVat.toFixed(2)}</div>
        </div>
      </div>
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
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; 
          margin: 0; 
          padding: 24px; 
          color: #000; 
          background: white;
          line-height: 1.4;
        }
        .header { 
          border-bottom: 4px solid #000; 
          padding-bottom: 24px; 
          margin-bottom: 24px; 
        }
        .header-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }
        .brand-section {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .logo-placeholder {
          width: 48px;
          height: 48px;
          background-color: #000;
          border-radius: 4px;
        }
        .brand-text h1 {
          font-size: 32px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin: 0;
        }
        .brand-text p {
          font-size: 16px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #6b7280;
          margin: 4px 0 0 0;
        }
        .proposal-info {
          text-align: right;
        }
        .proposal-info h2 {
          font-size: 24px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin: 0 0 8px 0;
        }
        .proposal-meta {
          font-size: 12px;
          color: #6b7280;
        }
        .details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px;
          margin-bottom: 32px;
        }
        .details-section h3 {
          font-size: 16px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          border-bottom: 2px solid #000;
          padding-bottom: 8px;
          margin: 0 0 16px 0;
        }
        .details-content {
          font-size: 12px;
        }
        .details-content p {
          margin: 8px 0;
        }
        .venue-section {
          margin-bottom: 32px;
        }
        .venue-content {
          background-color: #f9fafb;
          padding: 16px;
          border: 2px solid #d1d5db;
        }
        .breakdown-section {
          margin-bottom: 32px;
        }
        .totals-section {
          border-top: 4px solid #000;
          padding-top: 24px;
          margin-bottom: 32px;
        }
        .totals-row {
          display: flex;
          justify-content: space-between;
          font-size: 16px;
          margin: 12px 0;
        }
        .grand-total {
          border-top: 2px solid #000;
          padding-top: 12px;
          font-size: 20px;
          font-weight: bold;
        }
        .footer {
          border-top: 2px solid #d1d5db;
          padding-top: 24px;
          margin-top: 32px;
          text-align: center;
          font-size: 12px;
          color: #6b7280;
        }
        .footer p {
          margin: 8px 0;
        }
        .footer .company-name {
          font-weight: bold;
          color: #000;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="header-top">
          <div class="brand-section">
            <div class="logo-placeholder"></div>
            <div class="brand-text">
              <h1>CROFT COMMON</h1>
              <p>Private Events & Corporate Hire</p>
            </div>
          </div>
          <div class="proposal-info">
            <h2>PROPOSAL</h2>
            <div class="proposal-meta">
              <p><strong>Proposal Ref:</strong> ${eventData.code || eventData.id}</p>
              <p><strong>Date:</strong> ${currentDate}</p>
              <p><strong>Version:</strong> v1</p>
            </div>
          </div>
        </div>
      </div>

      <div class="details-grid">
        <div class="details-section">
          <h3>CLIENT DETAILS</h3>
          <div class="details-content">
            <p><strong>Name:</strong> ${eventData.client_name || 'N/A'}</p>
            <p><strong>Email:</strong> ${eventData.client_email || 'N/A'}</p>
            <p><strong>Phone:</strong> ${eventData.client_phone || 'N/A'}</p>
            <p><strong>Company:</strong> ${eventData.client_name || 'N/A'}</p>
          </div>
        </div>
        <div class="details-section">
          <h3>EVENT DETAILS</h3>
          <div class="details-content">
            <p><strong>Event Date:</strong> ${eventDate}</p>
            <p><strong>Event Type:</strong> ${eventData.event_type || 'N/A'}</p>
            <p><strong>Headcount:</strong> ${eventData.headcount || 'N/A'} guests</p>
            <p><strong>Space:</strong> TBC</p>
            <p><strong>Status:</strong> DRAFT</p>
          </div>
        </div>
      </div>

      <div class="venue-section">
        <h3 style="font-size: 16px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; border-bottom: 2px solid #000; padding-bottom: 8px; margin: 0 0 16px 0;">VENUE DETAILS</h3>
        <div class="venue-content">
          <p><strong>Space:</strong> TBC</p>
          <p><strong>Capacity:</strong> TBC</p>
          <p><strong>Setup:</strong> Theatre style with presentation equipment</p>
        </div>
      </div>

      <div class="breakdown-section">
        <h3 style="font-size: 16px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; border-bottom: 2px solid #000; padding-bottom: 8px; margin: 0 0 16px 0;">PROPOSAL BREAKDOWN</h3>
        <div>
          ${itemsHTML}
        </div>
      </div>

      <div class="totals-section">
        <div class="totals-row">
          <span>Net Subtotal:</span>
          <span style="font-weight: bold;">£${netSubtotal.toFixed(2)}</span>
        </div>
        <div class="totals-row">
          <span>VAT (20%):</span>
          <span style="font-weight: bold;">£${vatTotal.toFixed(2)}</span>
        </div>
        ${serviceChargePct > 0 ? `
        <div class="totals-row">
          <span>Service Charge (${serviceChargePct}%):</span>
          <span style="font-weight: bold;">£${serviceChargeAmount.toFixed(2)}</span>
        </div>
        ` : ''}
        <div class="totals-row grand-total">
          <span>GRAND TOTAL:</span>
          <span>£${grandTotal.toFixed(2)}</span>
        </div>
      </div>

      <div class="footer">
        <p class="company-name">CROFT COMMON</p>
        <p>Unit 1-3, Croft Court, 48 Croft Street, London, SE8 4EX</p>
        <p>Email: hello@thehive-hospitality.com | Phone: 020 7946 0958</p>
        <p style="margin-top: 16px; font-size: 10px;">
          This proposal is valid for 30 days from the date of issue. Terms and conditions apply.
        </p>
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