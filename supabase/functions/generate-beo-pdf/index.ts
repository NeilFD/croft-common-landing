import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'
import { jsPDF } from 'https://esm.sh/jspdf@3.0.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  eventId: string;
}

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

    // Generate PDF
    const pdfData = await createBEOPDF(eventData, menuData, staffingData, scheduleData, layoutData, equipmentData);

    // Upload to storage
    const fileName = `beo-${eventData.code || eventData.id}-${Date.now()}.pdf`;
    const filePath = `beos/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('beo-documents')
      .upload(filePath, pdfData, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw uploadError;
    }

    // Create signed URL (valid for 1 year)
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('beo-documents')
      .createSignedUrl(filePath, 60 * 60 * 24 * 365);

    if (signedUrlError) {
      console.error('Signed URL error:', signedUrlError);
      throw signedUrlError;
    }

    const signedUrl = signedUrlData.signedUrl;

    // Get current version count
    const { data: existingVersions } = await supabase
      .from('event_beo_versions')
      .select('version_number')
      .eq('event_id', eventId)
      .order('version_number', { ascending: false })
      .limit(1);

    const nextVersion = (existingVersions && existingVersions.length > 0) 
      ? existingVersions[0].version_number + 1 
      : 1;

    // Save version record
    const { data: versionData, error: versionError } = await supabase
      .from('event_beo_versions')
      .insert({
        event_id: eventId,
        version_number: nextVersion,
        pdf_url: signedUrl,
        generated_by: null,
        notes: 'Auto-generated BEO'
      })
      .select()
      .single();

    if (versionError) {
      console.error('Version save error:', versionError);
      throw versionError;
    }

    console.log(`Successfully generated BEO PDF version ${nextVersion} for event ${eventId}`);

    return new Response(
      JSON.stringify({
        success: true,
        version: versionData,
        url: signedUrl
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('BEO PDF generation error:', error);
    return new Response(
      JSON.stringify({ error: 'BEO PDF generation failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function createBEOPDF(
  eventData: any,
  menuData: any[],
  staffingData: any[],
  scheduleData: any[],
  layoutData: any[],
  equipmentData: any[]
): Promise<Uint8Array> {
  
  // Helper functions
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

  const loadTTFFont = async (label: string, url: string) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status} for ${label}`);
      const fontData = await response.arrayBuffer();
      const base64Font = arrayBufferToBase64(fontData);
      return base64Font;
    } catch (e) {
      console.warn(`Failed to load font ${label}:`, e);
      return null;
    }
  };

  // Create document
  const doc = new jsPDF('p', 'mm', 'a4');

  // Load branded fonts
  try {
    const [
      oswaldRegular,
      workSansRegular,
      workSansBold,
    ] = await Promise.all([
      loadTTFFont('Oswald-Regular', 'https://raw.githubusercontent.com/jongrover/all-google-fonts-ttf-only/master/fonts/Oswald-Regular.ttf'),
      loadTTFFont('WorkSans-Regular', 'https://raw.githubusercontent.com/jongrover/all-google-fonts-ttf-only/master/fonts/WorkSans-Regular.ttf'),
      loadTTFFont('WorkSans-Bold', 'https://raw.githubusercontent.com/jongrover/all-google-fonts-ttf-only/master/fonts/WorkSans-Bold.ttf'),
    ]);

    if (oswaldRegular) {
      doc.addFileToVFS('Oswald-Regular.ttf', oswaldRegular);
      doc.addFont('Oswald-Regular.ttf', 'Oswald', 'normal');
      doc.addFont('Oswald-Regular.ttf', 'Oswald', 'bold');
    }
    if (workSansRegular) {
      doc.addFileToVFS('WorkSans-Regular.ttf', workSansRegular);
      doc.addFont('WorkSans-Regular.ttf', 'WorkSans', 'normal');
    }
    if (workSansBold) {
      doc.addFileToVFS('WorkSans-Bold.ttf', workSansBold);
      doc.addFont('WorkSans-Bold.ttf', 'WorkSans', 'bold');
    }

    console.log('✅ Custom TTF fonts loaded');
  } catch (e) {
    console.warn('❌ Font loading failed, using system fonts:', e);
  }

  // Set default font
  try {
    doc.setFont('WorkSans', 'normal');
  } catch {
    doc.setFont('helvetica', 'normal');
  }

  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 18;
  const headerHeight = 34;
  const footerHeight = 18;

  const currentDate = new Date().toLocaleDateString('en-GB');
  const beoRef = eventData.code || String(eventData.id || '').slice(0, 8);

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

    // Right-aligned BEO meta
    doc.setFontSize(20);
    doc.text('BANQUET EVENT ORDER', pageWidth - margin, headerY + 4, { align: 'right' });
    try {
      doc.setFont('WorkSans', 'normal');
    } catch {
      doc.setFont('helvetica', 'normal');
    }
    doc.setFontSize(9);
    doc.text(`Event Code: ${beoRef}`, pageWidth - margin, headerY + 10, { align: 'right' });
    doc.text(`Date: ${currentDate}`, pageWidth - margin, headerY + 15, { align: 'right' });
    doc.text(`Event Date: ${new Date(eventData.primary_date).toLocaleDateString('en-GB')}`, pageWidth - margin, headerY + 20, { align: 'right' });

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

  // Draw first page
  drawHeaderFooter(1);

  let y = margin + headerHeight + 8;
  const maxY = pageHeight - footerHeight - 8;
  const contentWidth = pageWidth - (margin * 2);

  const checkAndAddPage = (requiredSpace: number = 20) => {
    if (y + requiredSpace > maxY) {
      doc.addPage();
      const pageNum = doc.getNumberOfPages();
      drawHeaderFooter(pageNum);
      y = margin + headerHeight + 8;
      return true;
    }
    return false;
  };

  // EVENT DETAILS SECTION
  try {
    doc.setFont('Oswald', 'bold');
  } catch {
    doc.setFont('helvetica', 'bold');
  }
  doc.setFontSize(12);
  doc.setTextColor(44, 95, 45);
  doc.text('EVENT DETAILS', margin, y);
  y += 2;
  doc.setDrawColor(44, 95, 45);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  try {
    doc.setFont('WorkSans', 'normal');
  } catch {
    doc.setFont('helvetica', 'normal');
  }
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);

  // Two-column layout
  const col1X = margin;
  const col2X = margin + (contentWidth / 2);

  try {
    doc.setFont('WorkSans', 'bold');
  } catch {
    doc.setFont('helvetica', 'bold');
  }
  doc.text('Event Code:', col1X, y);
  try {
    doc.setFont('WorkSans', 'normal');
  } catch {
    doc.setFont('helvetica', 'normal');
  }
  doc.text(eventData.code || 'N/A', col1X + 30, y);

  try {
    doc.setFont('WorkSans', 'bold');
  } catch {
    doc.setFont('helvetica', 'bold');
  }
  doc.text('Primary Date:', col2X, y);
  try {
    doc.setFont('WorkSans', 'normal');
  } catch {
    doc.setFont('helvetica', 'normal');
  }
  doc.text(new Date(eventData.primary_date).toLocaleDateString('en-GB'), col2X + 30, y);
  y += 6;

  try {
    doc.setFont('WorkSans', 'bold');
  } catch {
    doc.setFont('helvetica', 'bold');
  }
  doc.text('Event Type:', col1X, y);
  try {
    doc.setFont('WorkSans', 'normal');
  } catch {
    doc.setFont('helvetica', 'normal');
  }
  doc.text(eventData.event_type || 'N/A', col1X + 30, y);

  try {
    doc.setFont('WorkSans', 'bold');
  } catch {
    doc.setFont('helvetica', 'bold');
  }
  doc.text('Headcount:', col2X, y);
  try {
    doc.setFont('WorkSans', 'normal');
  } catch {
    doc.setFont('helvetica', 'normal');
  }
  doc.text(String(eventData.headcount || 'TBC'), col2X + 30, y);
  y += 6;

  try {
    doc.setFont('WorkSans', 'bold');
  } catch {
    doc.setFont('helvetica', 'bold');
  }
  doc.text('Client Name:', col1X, y);
  try {
    doc.setFont('WorkSans', 'normal');
  } catch {
    doc.setFont('helvetica', 'normal');
  }
  doc.text(eventData.client_name || 'N/A', col1X + 30, y);

  if (eventData.client_email) {
    try {
      doc.setFont('WorkSans', 'bold');
    } catch {
      doc.setFont('helvetica', 'bold');
    }
    doc.text('Client Email:', col2X, y);
    try {
      doc.setFont('WorkSans', 'normal');
    } catch {
      doc.setFont('helvetica', 'normal');
    }
    const emailLines = doc.splitTextToSize(eventData.client_email, 60);
    doc.text(emailLines, col2X + 30, y);
    y += emailLines.length * 6;
  } else {
    y += 6;
  }

  y += 8;

  // MENU SECTION
  if (menuData && menuData.length > 0) {
    checkAndAddPage(30);
    
    try {
      doc.setFont('Oswald', 'bold');
    } catch {
      doc.setFont('helvetica', 'bold');
    }
    doc.setFontSize(12);
    doc.setTextColor(44, 95, 45);
    doc.text('MENU', margin, y);
    y += 2;
    doc.setDrawColor(44, 95, 45);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    doc.setTextColor(0, 0, 0);

    const courses = Array.from(new Set(menuData.map((item: any) => item.course)));
    
    for (const course of courses) {
      checkAndAddPage(20);
      
      try {
        doc.setFont('WorkSans', 'bold');
      } catch {
        doc.setFont('helvetica', 'bold');
      }
      doc.setFontSize(10);
      doc.text(String(course).toUpperCase(), margin, y);
      y += 6;

      const courseItems = menuData.filter((item: any) => item.course === course);
      
      for (const item of courseItems) {
        checkAndAddPage(15);
        
        try {
          doc.setFont('WorkSans', 'bold');
        } catch {
          doc.setFont('helvetica', 'bold');
        }
        doc.setFontSize(9);
        doc.text(item.item_name, margin + 3, y);
        
        if (item.price) {
          try {
            doc.setFont('WorkSans', 'normal');
          } catch {
            doc.setFont('helvetica', 'normal');
          }
          doc.text(`£${Number(item.price).toFixed(2)}`, pageWidth - margin, y, { align: 'right' });
        }
        y += 5;

        if (item.description) {
          try {
            doc.setFont('WorkSans', 'normal');
          } catch {
            doc.setFont('helvetica', 'normal');
          }
          doc.setFontSize(8);
          doc.setTextColor(102, 102, 102);
          const descLines = doc.splitTextToSize(item.description, contentWidth - 10);
          doc.text(descLines, margin + 6, y);
          y += descLines.length * 4;
          doc.setTextColor(0, 0, 0);
        }

        if (item.allergens && item.allergens.length > 0) {
          doc.setFontSize(8);
          doc.setTextColor(248, 180, 0);
          doc.text(`Allergens: ${item.allergens.join(', ')}`, margin + 6, y);
          y += 4;
          doc.setTextColor(0, 0, 0);
        }
        
        y += 2;
      }
      
      y += 4;
    }
    
    y += 4;
  }

  // SCHEDULE SECTION
  if (scheduleData && scheduleData.length > 0) {
    checkAndAddPage(30);
    
    try {
      doc.setFont('Oswald', 'bold');
    } catch {
      doc.setFont('helvetica', 'bold');
    }
    doc.setFontSize(12);
    doc.setTextColor(44, 95, 45);
    doc.text('EVENT SCHEDULE', margin, y);
    y += 2;
    doc.setDrawColor(44, 95, 45);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    doc.setTextColor(0, 0, 0);

    for (const item of scheduleData) {
      checkAndAddPage(15);
      
      const time = new Date(item.scheduled_at).toLocaleTimeString('en-GB', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });

      try {
        doc.setFont('WorkSans', 'bold');
      } catch {
        doc.setFont('helvetica', 'bold');
      }
      doc.setFontSize(9);
      doc.text(time, margin, y);

      try {
        doc.setFont('WorkSans', 'normal');
      } catch {
        doc.setFont('helvetica', 'normal');
      }
      doc.text(item.time_label, margin + 20, y);

      if (item.duration_minutes) {
        doc.setFontSize(8);
        doc.setTextColor(102, 102, 102);
        doc.text(`(${item.duration_minutes} mins)`, pageWidth - margin, y, { align: 'right' });
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(9);
      }
      y += 5;

      if (item.notes) {
        doc.setFontSize(8);
        doc.setTextColor(102, 102, 102);
        const noteLines = doc.splitTextToSize(item.notes, contentWidth - 25);
        doc.text(noteLines, margin + 20, y);
        y += noteLines.length * 4;
        doc.setTextColor(0, 0, 0);
      }

      if (item.responsible_role) {
        doc.setFontSize(8);
        doc.setTextColor(44, 95, 45);
        doc.text(`Responsible: ${item.responsible_role}`, margin + 20, y);
        y += 4;
        doc.setTextColor(0, 0, 0);
      }

      y += 2;
    }
    
    y += 4;
  }

  // STAFFING SECTION
  if (staffingData && staffingData.length > 0) {
    checkAndAddPage(30);
    
    try {
      doc.setFont('Oswald', 'bold');
    } catch {
      doc.setFont('helvetica', 'bold');
    }
    doc.setFontSize(12);
    doc.setTextColor(44, 95, 45);
    doc.text('STAFFING REQUIREMENTS', margin, y);
    y += 2;
    doc.setDrawColor(44, 95, 45);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    doc.setTextColor(0, 0, 0);

    for (const staff of staffingData) {
      checkAndAddPage(15);
      
      try {
        doc.setFont('WorkSans', 'bold');
      } catch {
        doc.setFont('helvetica', 'bold');
      }
      doc.setFontSize(9);
      doc.text(staff.role_title, margin + 3, y);
      doc.text(`x${staff.quantity}`, pageWidth - margin, y, { align: 'right' });
      y += 5;

      if (staff.shift_start && staff.shift_end) {
        try {
          doc.setFont('WorkSans', 'normal');
        } catch {
          doc.setFont('helvetica', 'normal');
        }
        doc.setFontSize(8);
        doc.setTextColor(102, 102, 102);
        const startTime = new Date(staff.shift_start).toLocaleTimeString('en-GB', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
        const endTime = new Date(staff.shift_end).toLocaleTimeString('en-GB', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
        doc.text(`Shift: ${startTime} - ${endTime}`, margin + 6, y);
        y += 4;
        doc.setTextColor(0, 0, 0);
      }

      if (staff.responsibilities) {
        doc.setFontSize(8);
        doc.setTextColor(102, 102, 102);
        const respLines = doc.splitTextToSize(staff.responsibilities, contentWidth - 12);
        doc.text(respLines, margin + 6, y);
        y += respLines.length * 4;
        doc.setTextColor(0, 0, 0);
      }

      y += 2;
    }
    
    y += 4;
  }

  // ROOM LAYOUTS SECTION
  if (layoutData && layoutData.length > 0) {
    checkAndAddPage(30);
    
    try {
      doc.setFont('Oswald', 'bold');
    } catch {
      doc.setFont('helvetica', 'bold');
    }
    doc.setFontSize(12);
    doc.setTextColor(44, 95, 45);
    doc.text('ROOM LAYOUTS', margin, y);
    y += 2;
    doc.setDrawColor(44, 95, 45);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    doc.setTextColor(0, 0, 0);

    for (const layout of layoutData) {
      checkAndAddPage(20);
      
      try {
        doc.setFont('WorkSans', 'bold');
      } catch {
        doc.setFont('helvetica', 'bold');
      }
      doc.setFontSize(10);
      doc.text(layout.space_name, margin, y);
      y += 6;

      try {
        doc.setFont('WorkSans', 'normal');
      } catch {
        doc.setFont('helvetica', 'normal');
      }
      doc.setFontSize(9);
      doc.text(`Layout: ${layout.layout_type}`, margin + 3, y);
      
      if (layout.capacity) {
        doc.text(`Capacity: ${layout.capacity}`, pageWidth - margin, y, { align: 'right' });
      }
      y += 5;

      if (layout.setup_time || layout.breakdown_time) {
        doc.setFontSize(8);
        doc.setTextColor(102, 102, 102);
        let timeText = '';
        if (layout.setup_time) {
          const setupTime = new Date(layout.setup_time).toLocaleTimeString('en-GB', { 
            hour: '2-digit', 
            minute: '2-digit' 
          });
          timeText += `Setup: ${setupTime}`;
        }
        if (layout.breakdown_time) {
          if (timeText) timeText += '  |  ';
          const breakdownTime = new Date(layout.breakdown_time).toLocaleTimeString('en-GB', { 
            hour: '2-digit', 
            minute: '2-digit' 
          });
          timeText += `Breakdown: ${breakdownTime}`;
        }
        doc.text(timeText, margin + 6, y);
        y += 4;
        doc.setTextColor(0, 0, 0);
      }

      if (layout.setup_notes) {
        doc.setFontSize(8);
        doc.setTextColor(102, 102, 102);
        const noteLines = doc.splitTextToSize(`Notes: ${layout.setup_notes}`, contentWidth - 12);
        doc.text(noteLines, margin + 6, y);
        y += noteLines.length * 4;
        doc.setTextColor(0, 0, 0);
      }

      y += 4;
    }
    
    y += 4;
  }

  // EQUIPMENT SECTION
  if (equipmentData && equipmentData.length > 0) {
    checkAndAddPage(30);
    
    try {
      doc.setFont('Oswald', 'bold');
    } catch {
      doc.setFont('helvetica', 'bold');
    }
    doc.setFontSize(12);
    doc.setTextColor(44, 95, 45);
    doc.text('EQUIPMENT', margin, y);
    y += 2;
    doc.setDrawColor(44, 95, 45);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    doc.setTextColor(0, 0, 0);

    const categories = Array.from(new Set(equipmentData.map((item: any) => item.category)));
    
    for (const category of categories) {
      checkAndAddPage(20);
      
      try {
        doc.setFont('WorkSans', 'bold');
      } catch {
        doc.setFont('helvetica', 'bold');
      }
      doc.setFontSize(10);
      doc.text(String(category).toUpperCase(), margin, y);
      y += 6;

      const categoryItems = equipmentData.filter((item: any) => item.category === category);
      
      for (const item of categoryItems) {
        checkAndAddPage(15);
        
        try {
          doc.setFont('WorkSans', 'bold');
        } catch {
          doc.setFont('helvetica', 'bold');
        }
        doc.setFontSize(9);
        doc.text(item.item_name, margin + 3, y);
        
        try {
          doc.setFont('WorkSans', 'normal');
        } catch {
          doc.setFont('helvetica', 'normal');
        }
        doc.text(`x${item.quantity}`, pageWidth - margin, y, { align: 'right' });
        y += 5;

        if (item.specifications) {
          doc.setFontSize(8);
          doc.setTextColor(102, 102, 102);
          const specLines = doc.splitTextToSize(item.specifications, contentWidth - 10);
          doc.text(specLines, margin + 6, y);
          y += specLines.length * 4;
          doc.setTextColor(0, 0, 0);
        }

        y += 2;
      }
      
      y += 4;
    }
    
    y += 4;
  }

  // Generate PDF as Uint8Array
  const pdfArrayBuffer = doc.output('arraybuffer');
  return new Uint8Array(pdfArrayBuffer);
}
