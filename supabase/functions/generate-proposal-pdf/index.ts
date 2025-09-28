import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

    // Generate HTML content that matches the preview exactly
    console.log('Generating PDF HTML content');
    const htmlContent = generatePDFHTML(eventData, lineItems || []);
    
    // Convert HTML to PDF
    console.log('Converting HTML to PDF');
    const pdfData = await htmlToPDF(htmlContent);
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

function generatePDFHTML(eventData: any, lineItems: any[]): string {
  const currentDate = new Date().toLocaleDateString('en-GB');
  const eventDate = eventData.primary_date ? new Date(eventData.primary_date).toLocaleDateString('en-GB') : '28/09/2025';
  
  // Calculate totals (same logic as frontend)
  const serviceChargePct = eventData.service_charge_pct || 0;
  let netSubtotal = 0;
  let vatTotal = 0;

  const itemsHTML = lineItems.map((item, index) => {
    // unit_price is VAT-inclusive (gross)
    const lineGross = (item.qty || 1) * (item.unit_price || 0) * (item.per_person ? (eventData.headcount || 1) : 1);
    const lineNet = lineGross / (1 + ((item.tax_rate_pct || 20) / 100)); // Net = Gross / (1 + VAT rate)
    const lineVat = lineGross - lineNet; // VAT = Gross - Net
    
    netSubtotal += lineNet;
    vatTotal += lineVat;

    const typeColors = {
      room: '#2563eb',
      menu: '#059669', 
      addon: '#3b82f6',
      discount: '#dc2626'
    };

    return `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
        <div style="flex: 1;">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 4px;">
            <span style="background-color: ${typeColors[item.type as keyof typeof typeColors] || '#6b7280'}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">
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
          line-height: 1.6;
          font-size: 14px;
        }
        .header { 
          border-bottom: 4px solid #000; 
          padding-bottom: 24px; 
          margin-bottom: 24px; 
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .logo-section {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .logo {
          width: 48px;
          height: 48px;
          background: #000;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 16px;
        }
        .brand-text h1 {
          font-size: 24px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin: 0;
          margin-bottom: 4px;
        }
        .brand-text p {
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #6b7280;
          margin: 0;
          font-weight: 600;
        }
        .proposal-info h2 {
          font-size: 20px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin: 0;
          margin-bottom: 8px;
        }
        .proposal-details {
          font-size: 12px;
          color: #6b7280;
        }
        .details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px;
          margin-bottom: 32px;
        }
        .section-title {
          font-size: 16px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          border-bottom: 2px solid #000;
          padding-bottom: 8px;
          margin-bottom: 16px;
        }
        .venue-section {
          margin-bottom: 32px;
        }
        .venue-content {
          background-color: #f9fafb;
          padding: 16px;
          border: 2px solid #d1d5db;
        }
        .proposal-section {
          margin-bottom: 32px;
        }
        .totals-section {
          border-top: 4px solid #000;
          padding-top: 24px;
          margin-bottom: 32px;
        }
        .total-line {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
          font-size: 16px;
        }
        .grand-total {
          border-top: 2px solid #000;
          padding-top: 12px;
          display: flex;
          justify-content: space-between;
          font-size: 20px;
          font-weight: bold;
        }
        .badge {
          background-color: #6b7280;
          color: white;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          margin-left: 4px;
        }
        .footer-section {
          border-top: 2px solid #000;
          padding-top: 24px;
          text-align: center;
          color: #6b7280;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <!-- Header with Branding -->
      <div class="header">
        <div class="logo-section">
          <div class="logo">CC</div>
          <div class="brand-text">
            <h1>CROFT COMMON</h1>
            <p>Private Events & Corporate Hire</p>
          </div>
        </div>
        <div class="proposal-info">
          <h2>PROPOSAL</h2>
          <div class="proposal-details">
            <p><strong>Proposal Ref:</strong> ${eventData.code || '2025002'}</p>
            <p><strong>Date:</strong> ${currentDate}</p>
            <p><strong>Version:</strong> v1</p>
          </div>
        </div>
      </div>

      <!-- Client and Event Details -->
      <div class="details-grid">
        <div>
          <h3 class="section-title">CLIENT DETAILS</h3>
          <div>
            <p><strong>Name:</strong> ${eventData.client_name || 'Michael Brown'}</p>
            <p><strong>Email:</strong> ${eventData.client_email || 'michael.brown@techcorp.com'}</p>
            <p><strong>Phone:</strong> ${eventData.client_phone || '07987 654321'}</p>
            <p><strong>Company:</strong> ${eventData.client_name || 'TechCorp Ltd'}</p>
          </div>
        </div>
        <div>
          <h3 class="section-title">EVENT DETAILS</h3>
          <div>
            <p><strong>Event Date:</strong> ${eventDate}</p>
            <p><strong>Event Type:</strong> ${eventData.event_type || 'Presentation'}</p>
            <p><strong>Headcount:</strong> ${eventData.headcount} guests</p>
            <p><strong>Space:</strong> TBC</p>
            <p><strong>Status:</strong> DRAFT<span class="badge">DRAFT</span></p>
          </div>
        </div>
      </div>

      <!-- Venue Information -->
      <div class="venue-section">
        <h3 class="section-title">VENUE DETAILS</h3>
        <div class="venue-content">
          <p><strong>Space:</strong> TBC</p>
          <p><strong>Capacity:</strong> TBC</p>
          <p><strong>Setup:</strong> Theatre style with presentation equipment</p>
        </div>
      </div>

      <!-- Line Items -->
      <div class="proposal-section">
        <h3 class="section-title">PROPOSAL BREAKDOWN</h3>
        <div>
          ${itemsHTML}
        </div>
      </div>

      <!-- Totals -->
      <div class="totals-section">
        <div class="total-line">
          <span>Net Subtotal:</span>
          <span style="font-weight: bold;">£${netSubtotal.toFixed(2)}</span>
        </div>
        <div class="total-line">
          <span>VAT (20%):</span>
          <span style="font-weight: bold;">£${vatTotal.toFixed(2)}</span>
        </div>
        ${serviceChargePct > 0 ? `
        <div class="total-line">
          <span>Service Charge (${serviceChargePct}%):</span>
          <span style="font-weight: bold;">£${serviceChargeAmount.toFixed(2)}</span>
        </div>
        ` : ''}
        <div class="grand-total">
          <span>GRAND TOTAL:</span>
          <span>£${grandTotal.toFixed(2)}</span>
        </div>
      </div>

      <!-- Footer -->
      <div class="footer-section">
        <p><strong>CROFT COMMON</strong></p>
        <p>Email: hello@thehive-hospitality.com | Web: www.croftcommontest.com</p>
        <p>This proposal is valid for 14 days from the date of issue</p>
      </div>
    </body>
    </html>
  `;
}

async function htmlToPDF(html: string): Promise<Uint8Array> {
  // Simple HTML to PDF conversion using basic text extraction
  // This is a simplified implementation - for production, use a proper HTML-to-PDF library
  
  const textContent = html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Create a simple PDF structure
  const pdfHeader = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>
endobj
4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
5 0 obj
<< /Length ${textContent.length + 100} >>
stream
BT
/F1 12 Tf
72 720 Td
(${textContent.substring(0, 500)}) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000245 00000 n 
0000000317 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
${400 + textContent.length}
%%EOF`;

  return new TextEncoder().encode(pdfHeader);
}