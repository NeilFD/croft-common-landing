import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'
import jsPDF from 'https://esm.sh/jspdf@2.5.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  eventId: string;
}

// Brand colors matching Croft Common design
const BRAND_COLORS = {
  primary: [44, 95, 45],        // #2C5F2D - Dark green
  secondary: [151, 188, 98],    // #97BC62 - Light green
  accent: [248, 180, 0],        // #F8B400 - Gold
  text: [26, 26, 26],           // #1a1a1a - Dark text
  lightText: [102, 102, 102],   // #666666 - Light text
  border: [229, 231, 235],      // #e5e7eb - Light border
  white: [255, 255, 255],       // White
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { eventId }: RequestBody = await req.json();

    if (!eventId) {
      return new Response(
        JSON.stringify({ error: 'Event ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Generating BEO PDF for event: ${eventId}`);

    // Load logo image as base64
    let logoDataUrl = '';
    try {
      const logoResponse = await fetch('https://xccidvoxhpgcnwinnyin.supabase.co/storage/v1/object/public/brand/logo.png');
      if (logoResponse.ok) {
        const logoBuffer = await logoResponse.arrayBuffer();
        const logoBase64 = btoa(String.fromCharCode(...new Uint8Array(logoBuffer)));
        logoDataUrl = `data:image/png;base64,${logoBase64}`;
      }
    } catch (e) {
      console.log('Could not load logo, continuing without it:', e);
    }

    // Fetch event data
    const { data: eventData, error: eventError } = await supabase
      .from('management_events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (eventError || !eventData) {
      console.error('Error fetching event:', eventError);
      return new Response(
        JSON.stringify({ error: 'Event not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch BEO data in parallel
    const [menuRes, staffingRes, scheduleRes, layoutsRes, equipmentRes] = await Promise.all([
      supabase.from('event_menus').select('*').eq('event_id', eventId).order('course', { ascending: true }),
      supabase.from('event_staffing').select('*').eq('event_id', eventId).order('role_title', { ascending: true }),
      supabase.from('event_schedule').select('*').eq('event_id', eventId).order('scheduled_at', { ascending: true }),
      supabase.from('event_room_layouts').select('*').eq('event_id', eventId).order('space_name', { ascending: true }),
      supabase.from('event_equipment').select('*').eq('event_id', eventId).order('category', { ascending: true })
    ]);

    const menuData = menuRes.data || [];
    const staffingData = staffingRes.data || [];
    const scheduleData = scheduleRes.data || [];
    const layoutData = layoutsRes.data || [];
    const equipmentData = equipmentRes.data || [];

    // Initialize PDF document
    const doc = new jsPDF();
    let yPosition = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);

    // Helper function to add new page with header
    const addPageWithHeader = () => {
      doc.addPage();
      yPosition = margin;
      // Mini header on subsequent pages
      doc.setFontSize(10);
      doc.setTextColor(...BRAND_COLORS.lightText);
      doc.text('Croft Common - BEO', margin, yPosition);
      doc.text(`Event: ${eventData.code || eventData.id.substring(0, 8)}`, pageWidth - margin, yPosition, { align: 'right' });
      yPosition += 15;
      doc.setTextColor(...BRAND_COLORS.text);
    };

    // Helper function to check space and add page if needed
    const checkAndAddPage = (requiredSpace: number = 20) => {
      if (yPosition + requiredSpace > pageHeight - margin - 20) {
        addPageWithHeader();
        return true;
      }
      return false;
    };

    // HEADER WITH LOGO AND BRANDING
    if (logoDataUrl) {
      try {
        doc.addImage(logoDataUrl, 'PNG', margin, yPosition, 30, 30);
      } catch (e) {
        console.log('Could not add logo to PDF, continuing without it');
      }
    }
    
    // Company name next to logo (Oswald style - bold)
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...BRAND_COLORS.primary);
    doc.text('CROFT COMMON', margin + 35, yPosition + 12);
    
    // Subtitle
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...BRAND_COLORS.lightText);
    doc.text('Banquet Event Order', margin + 35, yPosition + 20);
    
    yPosition += 40;

    // Decorative line
    doc.setDrawColor(...BRAND_COLORS.secondary);
    doc.setLineWidth(1);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    // EVENT DETAILS SECTION (Work Sans style - regular)
    checkAndAddPage(60);
    
    doc.setFillColor(...BRAND_COLORS.primary);
    doc.rect(margin, yPosition, contentWidth, 8, 'F');
    doc.setTextColor(...BRAND_COLORS.white);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('EVENT DETAILS', margin + 3, yPosition + 5.5);
    yPosition += 14;
    doc.setTextColor(...BRAND_COLORS.text);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    // Two column layout for event details
    const col1X = margin;
    const col2X = margin + (contentWidth / 2);
    let detailY = yPosition;
    
    doc.setFont('helvetica', 'bold');
    doc.text('Event Code:', col1X, detailY);
    doc.setFont('helvetica', 'normal');
    doc.text(eventData.code || 'N/A', col1X + 30, detailY);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Primary Date:', col2X, detailY);
    doc.setFont('helvetica', 'normal');
    doc.text(new Date(eventData.primary_date).toLocaleDateString('en-GB'), col2X + 30, detailY);
    detailY += 6;
    
    doc.setFont('helvetica', 'bold');
    doc.text('Event Type:', col1X, detailY);
    doc.setFont('helvetica', 'normal');
    doc.text(eventData.event_type || 'N/A', col1X + 30, detailY);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Headcount:', col2X, detailY);
    doc.setFont('helvetica', 'normal');
    doc.text(String(eventData.headcount || 'TBC'), col2X + 30, detailY);
    detailY += 6;
    
    doc.setFont('helvetica', 'bold');
    doc.text('Client Name:', col1X, detailY);
    doc.setFont('helvetica', 'normal');
    doc.text(eventData.client_name || 'N/A', col1X + 30, detailY);
    
    if (eventData.client_email) {
      doc.setFont('helvetica', 'bold');
      doc.text('Client Email:', col2X, detailY);
      doc.setFont('helvetica', 'normal');
      doc.text(eventData.client_email, col2X + 30, detailY);
      detailY += 6;
    }
    
    yPosition = detailY + 10;

    // MENU SECTION
    if (menuData && menuData.length > 0) {
      checkAndAddPage(30);
      
      doc.setFillColor(...BRAND_COLORS.secondary);
      doc.rect(margin, yPosition, contentWidth, 8, 'F');
      doc.setTextColor(...BRAND_COLORS.white);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('MENU', margin + 3, yPosition + 5.5);
      yPosition += 14;
      doc.setTextColor(...BRAND_COLORS.text);
      
      doc.setFontSize(10);
      
      // Group by course
      const courses = new Set(menuData.map((item: any) => item.course));
      courses.forEach(course => {
        checkAndAddPage(20);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(...BRAND_COLORS.primary);
        doc.text(String(course).toUpperCase(), margin, yPosition);
        yPosition += 7;
        doc.setTextColor(...BRAND_COLORS.text);
        
        const courseItems = menuData.filter((item: any) => item.course === course);
        courseItems.forEach((item: any) => {
          checkAndAddPage(15);
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.text(`• ${item.item_name}`, margin + 5, yPosition);
          if (item.price) {
            doc.text(`£${item.price}`, pageWidth - margin - 20, yPosition);
          }
          yPosition += 5;
          
          if (item.description) {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.setTextColor(...BRAND_COLORS.lightText);
            const descLines = doc.splitTextToSize(item.description, contentWidth - 15);
            doc.text(descLines, margin + 10, yPosition);
            yPosition += (descLines.length * 4) + 1;
            doc.setTextColor(...BRAND_COLORS.text);
          }
          
          if (item.allergens && item.allergens.length > 0) {
            doc.setFontSize(8);
            doc.setTextColor(...BRAND_COLORS.accent);
            doc.text(`Allergens: ${item.allergens.join(', ')}`, margin + 10, yPosition);
            yPosition += 4;
            doc.setTextColor(...BRAND_COLORS.text);
          }
          yPosition += 3;
        });
        yPosition += 5;
      });
      yPosition += 5;
    }

    // SCHEDULE SECTION
    if (scheduleData && scheduleData.length > 0) {
      checkAndAddPage(30);
      
      doc.setFillColor(...BRAND_COLORS.secondary);
      doc.rect(margin, yPosition, contentWidth, 8, 'F');
      doc.setTextColor(...BRAND_COLORS.white);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('EVENT SCHEDULE', margin + 3, yPosition + 5.5);
      yPosition += 14;
      doc.setTextColor(...BRAND_COLORS.text);
      
      doc.setFontSize(10);
      
      scheduleData.forEach((item: any) => {
        checkAndAddPage(15);
        const time = new Date(item.scheduled_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...BRAND_COLORS.primary);
        doc.text(time, margin + 5, yPosition);
        
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...BRAND_COLORS.text);
        doc.text(item.time_label, margin + 25, yPosition);
        
        if (item.duration_minutes) {
          doc.setFontSize(9);
          doc.setTextColor(...BRAND_COLORS.lightText);
          doc.text(`(${item.duration_minutes} mins)`, pageWidth - margin - 25, yPosition);
          doc.setFontSize(10);
          doc.setTextColor(...BRAND_COLORS.text);
        }
        yPosition += 5;
        
        if (item.notes) {
          doc.setFontSize(9);
          doc.setTextColor(...BRAND_COLORS.lightText);
          const noteLines = doc.splitTextToSize(item.notes, contentWidth - 30);
          doc.text(noteLines, margin + 25, yPosition);
          yPosition += (noteLines.length * 4) + 1;
          doc.setTextColor(...BRAND_COLORS.text);
          doc.setFontSize(10);
        }
        
        if (item.responsible_role) {
          doc.setFontSize(8);
          doc.setTextColor(...BRAND_COLORS.accent);
          doc.text(`Responsible: ${item.responsible_role}`, margin + 25, yPosition);
          yPosition += 4;
          doc.setTextColor(...BRAND_COLORS.text);
          doc.setFontSize(10);
        }
        yPosition += 3;
      });
      yPosition += 5;
    }

    // STAFFING SECTION
    if (staffingData && staffingData.length > 0) {
      checkAndAddPage(30);
      
      doc.setFillColor(...BRAND_COLORS.secondary);
      doc.rect(margin, yPosition, contentWidth, 8, 'F');
      doc.setTextColor(...BRAND_COLORS.white);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('STAFFING REQUIREMENTS', margin + 3, yPosition + 5.5);
      yPosition += 14;
      doc.setTextColor(...BRAND_COLORS.text);
      
      doc.setFontSize(10);
      
      staffingData.forEach((staff: any) => {
        checkAndAddPage(15);
        doc.setFont('helvetica', 'bold');
        doc.text(`• ${staff.role_title}`, margin + 5, yPosition);
        doc.setFont('helvetica', 'normal');
        doc.text(`x${staff.quantity}`, pageWidth - margin - 20, yPosition);
        yPosition += 5;
        
        if (staff.shift_start && staff.shift_end) {
          doc.setFontSize(9);
          doc.setTextColor(...BRAND_COLORS.lightText);
          const startTime = new Date(staff.shift_start).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
          const endTime = new Date(staff.shift_end).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
          doc.text(`Shift: ${startTime} - ${endTime}`, margin + 10, yPosition);
          yPosition += 4;
          doc.setTextColor(...BRAND_COLORS.text);
          doc.setFontSize(10);
        }
        
        if (staff.responsibilities) {
          doc.setFontSize(9);
          doc.setTextColor(...BRAND_COLORS.lightText);
          const respLines = doc.splitTextToSize(staff.responsibilities, contentWidth - 15);
          doc.text(respLines, margin + 10, yPosition);
          yPosition += (respLines.length * 4) + 1;
          doc.setTextColor(...BRAND_COLORS.text);
          doc.setFontSize(10);
        }
        yPosition += 3;
      });
      yPosition += 5;
    }

    // ROOM LAYOUTS SECTION
    if (layoutData && layoutData.length > 0) {
      checkAndAddPage(30);
      
      doc.setFillColor(...BRAND_COLORS.secondary);
      doc.rect(margin, yPosition, contentWidth, 8, 'F');
      doc.setTextColor(...BRAND_COLORS.white);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('ROOM LAYOUTS', margin + 3, yPosition + 5.5);
      yPosition += 14;
      doc.setTextColor(...BRAND_COLORS.text);
      
      doc.setFontSize(10);
      
      layoutData.forEach((layout: any) => {
        checkAndAddPage(20);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...BRAND_COLORS.primary);
        doc.text(`• ${layout.space_name}`, margin + 5, yPosition);
        yPosition += 5;
        doc.setTextColor(...BRAND_COLORS.text);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Layout: ${layout.layout_type}`, margin + 10, yPosition);
        if (layout.capacity) {
          doc.text(`Capacity: ${layout.capacity}`, pageWidth - margin - 30, yPosition);
        }
        yPosition += 5;
        
        if (layout.setup_time || layout.breakdown_time) {
          doc.setFontSize(9);
          doc.setTextColor(...BRAND_COLORS.lightText);
          let timeText = '';
          if (layout.setup_time) {
            timeText += `Setup: ${new Date(layout.setup_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
          }
          if (layout.breakdown_time) {
            if (timeText) timeText += ' | ';
            timeText += `Breakdown: ${new Date(layout.breakdown_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
          }
          doc.text(timeText, margin + 10, yPosition);
          yPosition += 4;
          doc.setTextColor(...BRAND_COLORS.text);
          doc.setFontSize(10);
        }
        
        if (layout.setup_notes) {
          doc.setFontSize(9);
          doc.setTextColor(...BRAND_COLORS.lightText);
          const noteLines = doc.splitTextToSize(`Notes: ${layout.setup_notes}`, contentWidth - 15);
          doc.text(noteLines, margin + 10, yPosition);
          yPosition += (noteLines.length * 4) + 1;
          doc.setTextColor(...BRAND_COLORS.text);
          doc.setFontSize(10);
        }
        yPosition += 5;
      });
      yPosition += 5;
    }

    // EQUIPMENT SECTION
    if (equipmentData && equipmentData.length > 0) {
      checkAndAddPage(30);
      
      doc.setFillColor(...BRAND_COLORS.secondary);
      doc.rect(margin, yPosition, contentWidth, 8, 'F');
      doc.setTextColor(...BRAND_COLORS.white);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('EQUIPMENT', margin + 3, yPosition + 5.5);
      yPosition += 14;
      doc.setTextColor(...BRAND_COLORS.text);
      
      doc.setFontSize(10);
      
      // Group by category
      const categories = new Set(equipmentData.map((item: any) => item.category));
      categories.forEach(category => {
        checkAndAddPage(20);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(...BRAND_COLORS.primary);
        doc.text(String(category).toUpperCase(), margin, yPosition);
        yPosition += 7;
        doc.setTextColor(...BRAND_COLORS.text);
        
        const categoryItems = equipmentData.filter((item: any) => item.category === category);
        categoryItems.forEach((item: any) => {
          checkAndAddPage(15);
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.text(`• ${item.item_name}`, margin + 5, yPosition);
          doc.setFont('helvetica', 'normal');
          doc.text(`x${item.quantity}`, pageWidth - margin - 20, yPosition);
          yPosition += 5;
          
          if (item.specifications) {
            doc.setFontSize(9);
            doc.setTextColor(...BRAND_COLORS.lightText);
            const specLines = doc.splitTextToSize(item.specifications, contentWidth - 15);
            doc.text(specLines, margin + 10, yPosition);
            yPosition += (specLines.length * 4) + 1;
            doc.setTextColor(...BRAND_COLORS.text);
            doc.setFontSize(10);
          }
          
          if (item.supplier) {
            doc.setFontSize(8);
            doc.setTextColor(...BRAND_COLORS.accent);
            doc.text(`Supplier: ${item.supplier}`, margin + 10, yPosition);
            yPosition += 4;
            doc.setTextColor(...BRAND_COLORS.text);
            doc.setFontSize(10);
          }
          yPosition += 3;
        });
        yPosition += 5;
      });
      yPosition += 5;
    }

    // FOOTER ON ALL PAGES
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      const footerY = pageHeight - margin - 10;
      doc.setDrawColor(...BRAND_COLORS.border);
      doc.setLineWidth(0.5);
      doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
      doc.setFontSize(8);
      doc.setTextColor(...BRAND_COLORS.lightText);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated: ${new Date().toLocaleString('en-GB')}`, margin, footerY);
      doc.text('Croft Common', pageWidth - margin, footerY, { align: 'right' });
      doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, footerY, { align: 'center' });
    }

    // Generate PDF buffer
    const pdfBuffer = doc.output('arraybuffer');
    
    // Upload to Supabase storage
    const fileName = `beo-${eventData.code || eventId.substring(0, 8)}-v${Date.now()}.pdf`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('beo-documents')
      .upload(fileName, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (uploadError) {
      console.error('Error uploading PDF:', uploadError);
      return new Response(
        JSON.stringify({ error: 'Failed to upload PDF' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate signed URL (valid for 1 year) for secure access
    const { data: urlData, error: urlError } = await supabase.storage
      .from('beo-documents')
      .createSignedUrl(fileName, 31536000); // 1 year in seconds

    if (urlError) {
      console.error('Error generating signed URL:', urlError);
      return new Response(
        JSON.stringify({ error: 'Failed to generate signed URL' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const signedUrl = urlData.signedUrl;

    // Get next version number
    const { data: existingVersions } = await supabase
      .from('event_beo_versions')
      .select('version_no')
      .eq('event_id', eventId)
      .order('version_no', { ascending: false })
      .limit(1);

    const nextVersion = (existingVersions && existingVersions.length > 0) 
      ? existingVersions[0].version_no + 1 
      : 1;

    // Save BEO version record
    const { data: versionData, error: versionError } = await supabase
      .from('event_beo_versions')
      .insert({
        event_id: eventId,
        version_no: nextVersion,
        pdf_url: signedUrl,
        generated_by: null
      })
      .select()
      .single();

    if (versionError) {
      console.error('Error saving BEO version:', versionError);
      return new Response(
        JSON.stringify({ error: 'Failed to save BEO version' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Successfully generated BEO PDF version ${nextVersion} for event ${eventId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        version: versionData,
        pdfUrl: signedUrl
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-beo-pdf function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
