import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { eventId, beoVersionId } = await req.json();

    if (!eventId) {
      throw new Error('Event ID is required');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Generating proposal from BEO for event:', eventId);

    // Fetch event details
    const { data: event, error: eventError } = await supabase
      .from('management_events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      throw new Error('Event not found');
    }

    console.log('Event found:', event.code);

    // Fetch BEO data
    const [menusResult, scheduleResult, layoutsResult, equipmentResult] = await Promise.all([
      supabase.from('event_menus').select('*').eq('event_id', eventId).order('course'),
      supabase.from('event_schedule').select('*').eq('event_id', eventId).order('scheduled_at'),
      supabase.from('event_room_layouts').select('*').eq('event_id', eventId),
      supabase.from('event_equipment').select('*').eq('event_id', eventId).order('category')
    ]);

    if (menusResult.error) throw menusResult.error;
    if (scheduleResult.error) throw scheduleResult.error;
    if (layoutsResult.error) throw layoutsResult.error;
    if (equipmentResult.error) throw equipmentResult.error;

    const menus = menusResult.data || [];
    const schedule = scheduleResult.data || [];
    const layouts = layoutsResult.data || [];
    const equipment = equipmentResult.data || [];

    console.log('BEO data fetched:', { menus: menus.length, schedule: schedule.length, layouts: layouts.length, equipment: equipment.length });

    // Group menus by course
    const menusByCourse: Record<string, any[]> = {};
    menus.forEach(menu => {
      if (!menusByCourse[menu.course]) {
        menusByCourse[menu.course] = [];
      }
      menusByCourse[menu.course].push(menu);
    });

    // Build proposal content snapshot
    const contentSnapshot = {
      eventOverview: {
        eventName: event.title || event.code,
        eventDate: event.date,
        headcount: event.headcount || 1,
        clientName: event.client_name || '',
        contactEmail: event.client_email || ''
      },
      setup: {
        spaces: layouts.map(layout => ({
          space_name: layout.space_name,
          layout_type: layout.layout_type,
          capacity: layout.capacity,
          setup_notes: layout.setup_notes,
          setup_time: layout.setup_time,
          breakdown_time: layout.breakdown_time
        }))
      },
      menu: {
        courses: Object.entries(menusByCourse).map(([course, items]) => ({
          course,
          items: items.map(item => ({
            item_name: item.item_name,
            description: item.description,
            allergens: item.allergens
          }))
        }))
      },
      timeline: {
        schedule: schedule.map(s => ({
          time_label: s.time_label,
          scheduled_at: s.scheduled_at,
          duration_minutes: s.duration_minutes,
          notes: s.notes
        }))
      },
      equipment: equipment.map(e => ({
        category: e.category,
        item_name: e.item_name,
        quantity: e.quantity,
        specifications: e.specifications
      }))
    };

    // Generate line items for pricing
    const lineItems = [];
    let sortOrder = 0;

    // Add room hire
    if (layouts.length > 0) {
      layouts.forEach(layout => {
        lineItems.push({
          event_id: eventId,
          type: 'room',
          description: `${layout.space_name} - ${layout.layout_type}`,
          qty: 1,
          unit_price: 600.00, // Default room price (VAT inclusive)
          per_person: false,
          sort_order: sortOrder++
        });
      });
    } else {
      // Default room item if no layouts specified
      lineItems.push({
        event_id: eventId,
        type: 'room',
        description: 'Event Space Hire',
        qty: 1,
        unit_price: 600.00,
        per_person: false,
        sort_order: sortOrder++
      });
    }

    // Add menu items with pricing (if available)
    Object.entries(menusByCourse).forEach(([course, items]) => {
      items.forEach(item => {
        if (item.price && item.price > 0) {
          lineItems.push({
            event_id: eventId,
            type: 'menu',
            description: `${course} - ${item.item_name}`,
            qty: 1,
            unit_price: item.price,
            per_person: true,
            sort_order: sortOrder++
          });
        }
      });
    });

    // Add equipment with hire costs
    equipment.forEach(eq => {
      if (eq.hire_cost && eq.hire_cost > 0) {
        lineItems.push({
          event_id: eventId,
          type: 'addon',
          description: `${eq.category} - ${eq.item_name}`,
          qty: eq.quantity,
          unit_price: eq.hire_cost,
          per_person: false,
          sort_order: sortOrder++
        });
      }
    });

    console.log('Generated line items:', lineItems.length);

    // Get next version number
    const { data: existingVersions } = await supabase
      .from('proposal_versions')
      .select('version_no')
      .eq('event_id', eventId)
      .order('version_no', { ascending: false })
      .limit(1);

    const nextVersionNo = existingVersions && existingVersions.length > 0 
      ? existingVersions[0].version_no + 1 
      : 1;

    // Mark previous versions as superseded
    if (nextVersionNo > 1) {
      await supabase
        .from('proposal_versions')
        .update({ status: 'superseded' })
        .eq('event_id', eventId)
        .neq('status', 'approved');
    }

    // Create new proposal version
    const { data: proposalVersion, error: versionError } = await supabase
      .from('proposal_versions')
      .insert({
        event_id: eventId,
        version_no: nextVersionNo,
        beo_version_id: beoVersionId,
        content_snapshot: contentSnapshot,
        status: 'draft',
        generated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (versionError) {
      console.error('Error creating proposal version:', versionError);
      throw versionError;
    }

    console.log('Proposal version created:', proposalVersion.id);

    // Update or insert line items
    // First delete existing line items for this event
    await supabase
      .from('management_event_line_items')
      .delete()
      .eq('event_id', eventId);

    // Insert new line items
    if (lineItems.length > 0) {
      const { error: lineItemsError } = await supabase
        .from('management_event_line_items')
        .insert(lineItems);

      if (lineItemsError) {
        console.error('Error inserting line items:', lineItemsError);
        throw lineItemsError;
      }
    }

    console.log('Line items updated successfully');

    // Update event with current proposal version
    await supabase
      .from('management_events')
      .update({ current_proposal_version_id: proposalVersion.id })
      .eq('id', eventId);

    return new Response(
      JSON.stringify({
        success: true,
        proposalVersionId: proposalVersion.id,
        versionNo: nextVersionNo,
        lineItemsCount: lineItems.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('Error generating proposal from BEO:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
