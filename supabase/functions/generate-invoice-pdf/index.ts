import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import jsPDF from 'https://esm.sh/jspdf@2.5.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { invoiceId } = await req.json();

    if (!invoiceId) {
      throw new Error('Invoice ID is required');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch invoice data with event details
    const { data: invoice, error: invoiceError } = await supabaseClient
      .from('invoices')
      .select(`
        *,
        event:management_events!event_id(
          code,
          event_type,
          client_name,
          client_email,
          primary_date
        )
      `)
      .eq('id', invoiceId)
      .single();

    if (invoiceError) {
      console.error('Error fetching invoice:', invoiceError);
      throw invoiceError;
    }

    // Fetch line items separately
    const { data: lineItems, error: lineItemsError } = await supabaseClient
      .from('management_event_line_items')
      .select('*')
      .eq('event_id', invoice.event_id)
      .order('sort_order');

    // Fetch payments separately
    const { data: payments, error: paymentsError } = await supabaseClient
      .from('invoice_payments')
      .select('*')
      .eq('invoice_id', invoiceId);

    // Combine data
    invoice.line_items = lineItems || [];
    invoice.payments = payments || [];

    if (invoiceError) throw invoiceError;

    console.log('Generating PDF for invoice:', invoice.number);

    // Generate PDF
    const pdfBytes = await createInvoicePDF(invoice);

    // Upload to storage
    const fileName = `invoice-${invoice.number.replace(/\//g, '-')}.pdf`;
    const { data: uploadData, error: uploadError } = await supabaseClient
      .storage
      .from('invoice-documents')
      .upload(fileName, pdfBytes, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabaseClient
      .storage
      .from('invoice-documents')
      .getPublicUrl(fileName);

    // Update invoice with PDF URL
    await supabaseClient
      .from('invoices')
      .update({ pdf_url: publicUrl })
      .eq('id', invoiceId);

    console.log('Invoice PDF generated successfully:', publicUrl);

    return new Response(
      JSON.stringify({ pdfUrl: publicUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating invoice PDF:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function createInvoicePDF(invoice: any): Promise<Uint8Array> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPos = margin;

  // Company branding
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('CROFT COMMON', margin, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('The Common Room', margin, yPos);
  yPos += 4;
  doc.text('123 Example Street, London, UK', margin, yPos);
  yPos += 10;

  // Invoice header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', pageWidth - margin, margin, { align: 'right' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Invoice No: ${invoice.number}`, pageWidth - margin, margin + 8, { align: 'right' });
  doc.text(`Date: ${new Date(invoice.created_at).toLocaleDateString('en-GB')}`, pageWidth - margin, margin + 13, { align: 'right' });
  doc.text(`Due: ${new Date(invoice.due_date).toLocaleDateString('en-GB')}`, pageWidth - margin, margin + 18, { align: 'right' });
  
  yPos = margin + 25;

  // Client details
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('BILL TO:', margin, yPos);
  yPos += 6;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.event?.client_name || 'Client', margin, yPos);
  yPos += 5;
  if (invoice.event?.client_email) {
    doc.text(invoice.event.client_email, margin, yPos);
    yPos += 5;
  }
  yPos += 5;

  // Event details
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('EVENT DETAILS:', margin, yPos);
  yPos += 6;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Event: ${invoice.event?.event_type || 'Event'}`, margin, yPos);
  yPos += 5;
  doc.text(`Code: ${invoice.event?.code || 'N/A'}`, margin, yPos);
  yPos += 5;
  if (invoice.event?.primary_date) {
    doc.text(`Date: ${new Date(invoice.event.primary_date).toLocaleDateString('en-GB')}`, margin, yPos);
    yPos += 5;
  }
  yPos += 10;

  // Line items table
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  
  // Table headers
  const col1 = margin;
  const col2 = margin + 80;
  const col3 = margin + 110;
  const col4 = pageWidth - margin - 30;
  
  doc.text('DESCRIPTION', col1, yPos);
  doc.text('QTY', col2, yPos);
  doc.text('PRICE', col3, yPos);
  doc.text('TOTAL', col4, yPos);
  yPos += 3;
  
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 6;

  // Line items
  doc.setFont('helvetica', 'normal');
  let subtotal = 0;

  if (invoice.line_items && invoice.line_items.length > 0) {
    invoice.line_items.forEach((item: any) => {
      const qty = item.qty || 1;
      const price = parseFloat(item.unit_price || 0);
      const total = qty * price;
      subtotal += total;

      // Check if we need a new page
      if (yPos > pageHeight - 40) {
        doc.addPage();
        yPos = margin;
      }

      doc.text(item.description || 'Item', col1, yPos, { maxWidth: 75 });
      doc.text(qty.toString(), col2, yPos);
      doc.text(`£${price.toFixed(2)}`, col3, yPos);
      doc.text(`£${total.toFixed(2)}`, col4, yPos);
      yPos += 7;
    });
  } else {
    // Use invoice total if no line items
    subtotal = parseFloat(invoice.total || 0);
    doc.text('Event services', col1, yPos);
    doc.text('1', col2, yPos);
    doc.text(`£${subtotal.toFixed(2)}`, col3, yPos);
    doc.text(`£${subtotal.toFixed(2)}`, col4, yPos);
    yPos += 7;
  }

  yPos += 5;
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;

  // Totals
  const totalsX = pageWidth - margin - 60;
  doc.setFont('helvetica', 'bold');
  doc.text('Subtotal:', totalsX, yPos);
  doc.text(`£${subtotal.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' });
  yPos += 6;

  const vatRate = 0.20; // 20% VAT
  const vatAmount = subtotal * vatRate;
  doc.setFont('helvetica', 'normal');
  doc.text('VAT (20%):', totalsX, yPos);
  doc.text(`£${vatAmount.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' });
  yPos += 8;

  const totalAmount = subtotal + vatAmount;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL:', totalsX, yPos);
  doc.text(`£${totalAmount.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' });
  yPos += 10;

  // Payment tracking
  if (invoice.payments && invoice.payments.length > 0) {
    const totalPaid = invoice.payments.reduce((sum: number, p: any) => sum + parseFloat(p.amount), 0);
    const balance = totalAmount - totalPaid;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Paid:', totalsX, yPos);
    doc.text(`£${totalPaid.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' });
    yPos += 6;

    doc.setFont('helvetica', 'bold');
    doc.text('Balance Due:', totalsX, yPos);
    doc.text(`£${balance.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' });
    yPos += 10;
  }

  // Payment instructions
  yPos += 5;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('PAYMENT INSTRUCTIONS', margin, yPos);
  yPos += 6;

  doc.setFont('helvetica', 'normal');
  doc.text('Please make payment via bank transfer or contact us for payment link.', margin, yPos);
  yPos += 5;
  doc.text('Payment terms: Due within 30 days of invoice date.', margin, yPos);

  // Footer
  const footerY = pageHeight - 20;
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text('Thank you for your business!', pageWidth / 2, footerY, { align: 'center' });
  doc.text('www.croftcommontest.com', pageWidth / 2, footerY + 4, { align: 'center' });

  return doc.output('arraybuffer');
}
