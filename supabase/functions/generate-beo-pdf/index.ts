import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'
import jsPDF from 'https://esm.sh/jspdf@2.5.1'

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
      supabase.from('event_staffing').select('*').eq('event_id', eventId).order('role', { ascending: true }),
      supabase.from('event_schedule').select('*').eq('event_id', eventId).order('scheduled_at', { ascending: true }),
      supabase.from('event_room_layouts').select('*').eq('event_id', eventId).order('space_name', { ascending: true }),
      supabase.from('event_equipment').select('*').eq('event_id', eventId).order('category', { ascending: true })
    ]);

    // Generate PDF
    const doc = new jsPDF();
    let yPosition = 20;

    // Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('BANQUET EVENT ORDER', 20, yPosition);
    yPosition += 15;

    // Event details
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Event: ${eventData.event_type}`, 20, yPosition);
    yPosition += 8;
    doc.text(`Client: ${eventData.client_name || 'N/A'}`, 20, yPosition);
    yPosition += 8;
    doc.text(`Date: ${new Date(eventData.primary_date).toLocaleDateString('en-GB')}`, 20, yPosition);
    yPosition += 8;
    doc.text(`Guests: ${eventData.headcount || 'N/A'}`, 20, yPosition);
    yPosition += 15;

    // Menu section
    if (menuRes.data && menuRes.data.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('MENU', 20, yPosition);
      yPosition += 10;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      const menusByCourse = menuRes.data.reduce((acc: any, menu: any) => {
        if (!acc[menu.course]) acc[menu.course] = [];
        acc[menu.course].push(menu);
        return acc;
      }, {});

      Object.entries(menusByCourse).forEach(([course, items]) => {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
        
        doc.setFont('helvetica', 'bold');
        doc.text(course.toUpperCase(), 20, yPosition);
        yPosition += 6;
        
        doc.setFont('helvetica', 'normal');
        (items as any[]).forEach((item) => {
          const itemText = `${item.item_name}${item.price ? ` - £${item.price}` : ''}`;
          doc.text(`• ${itemText}`, 25, yPosition);
          yPosition += 5;
          
          if (item.description) {
            const description = doc.splitTextToSize(item.description, 160);
            description.forEach((line: string) => {
              doc.text(`  ${line}`, 27, yPosition);
              yPosition += 4;
            });
          }
          
          if (item.allergens && item.allergens.length > 0) {
            doc.text(`  Allergens: ${item.allergens.join(', ')}`, 27, yPosition);
            yPosition += 4;
          }
          yPosition += 2;
        });
        yPosition += 5;
      });
    }

    // Schedule section
    if (scheduleRes.data && scheduleRes.data.length > 0) {
      if (yPosition > 220) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('SCHEDULE', 20, yPosition);
      yPosition += 10;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      scheduleRes.data.forEach((schedule: any) => {
        const time = new Date(schedule.scheduled_at).toLocaleTimeString('en-GB', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
        doc.text(`${time} - ${schedule.time_label}`, 20, yPosition);
        if (schedule.responsible_role) {
          doc.text(`(${schedule.responsible_role})`, 120, yPosition);
        }
        yPosition += 6;
        
        if (schedule.notes) {
          const notes = doc.splitTextToSize(schedule.notes, 160);
          notes.forEach((line: string) => {
            doc.text(`  ${line}`, 25, yPosition);
            yPosition += 4;
          });
          yPosition += 2;
        }
      });
      yPosition += 10;
    }

    // Staffing section
    if (staffingRes.data && staffingRes.data.length > 0) {
      if (yPosition > 220) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('STAFFING', 20, yPosition);
      yPosition += 10;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      staffingRes.data.forEach((staff: any) => {
        let staffText = `${staff.role}: ${staff.qty} person${staff.qty > 1 ? 's' : ''}`;
        if (staff.shift_start && staff.shift_end) {
          staffText += ` (${staff.shift_start} - ${staff.shift_end})`;
        }
        doc.text(staffText, 20, yPosition);
        yPosition += 6;
      });
      yPosition += 10;
    }

    // Room layouts section
    if (layoutsRes.data && layoutsRes.data.length > 0) {
      if (yPosition > 220) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('ROOM LAYOUTS', 20, yPosition);
      yPosition += 10;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      layoutsRes.data.forEach((layout: any) => {
        doc.text(`${layout.space_name}: ${layout.layout_type}`, 20, yPosition);
        if (layout.capacity) {
          doc.text(`Capacity: ${layout.capacity}`, 120, yPosition);
        }
        yPosition += 6;
        
        if (layout.setup_notes) {
          const notes = doc.splitTextToSize(layout.setup_notes, 160);
          notes.forEach((line: string) => {
            doc.text(`  ${line}`, 25, yPosition);
            yPosition += 4;
          });
          yPosition += 2;
        }
      });
      yPosition += 10;
    }

    // Equipment section
    if (equipmentRes.data && equipmentRes.data.length > 0) {
      if (yPosition > 220) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('EQUIPMENT', 20, yPosition);
      yPosition += 10;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      const equipmentByCategory = equipmentRes.data.reduce((acc: any, eq: any) => {
        if (!acc[eq.category]) acc[eq.category] = [];
        acc[eq.category].push(eq);
        return acc;
      }, {});

      Object.entries(equipmentByCategory).forEach(([category, items]) => {
        doc.setFont('helvetica', 'bold');
        doc.text(category.toUpperCase(), 20, yPosition);
        yPosition += 6;
        
        doc.setFont('helvetica', 'normal');
        (items as any[]).forEach((item) => {
          doc.text(`• ${item.item_name} (Qty: ${item.quantity})`, 25, yPosition);
          yPosition += 5;
          
          if (item.specifications) {
            const specs = doc.splitTextToSize(item.specifications, 160);
            specs.forEach((line: string) => {
              doc.text(`  ${line}`, 27, yPosition);
              yPosition += 4;
            });
          }
          yPosition += 2;
        });
        yPosition += 5;
      });
    }

    // Generate PDF buffer
    const pdfBuffer = doc.output('arraybuffer');
    
    // Upload to Supabase storage
    const fileName = `beo-${eventData.code}-${new Date().toISOString().split('T')[0]}.pdf`;
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

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('beo-documents')
      .getPublicUrl(fileName);

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
        pdf_url: urlData.publicUrl,
        generated_by: req.headers.get('authorization')?.split(' ')[1] ? 
          (await supabase.auth.getUser(req.headers.get('authorization')?.split(' ')[1] || '')).data.user?.id : 
          null,
        notes: `Automatically generated BEO v${nextVersion}`
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
        pdfUrl: urlData.publicUrl
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-beo-pdf function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});