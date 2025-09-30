import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch real data from database based on user's role
    const realData = await fetchRealData(supabase, context?.user?.role);

    // Build comprehensive system prompt with REAL data
    const systemPrompt = buildSystemPrompt(context, realData);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI gateway error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Management AI Assistant error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function fetchRealData(supabase: any, userRole: string) {
  try {
    // Fetch events with correct column names
    const { data: events, error: eventsError } = await supabase
      .from('management_events')
      .select('id, code, event_type, primary_date, status, headcount, client_name, notes, budget')
      .order('primary_date', { ascending: true })
      .limit(50);
    
    if (eventsError) console.error("Events fetch error:", eventsError);

    // Fetch spaces (removed venue_type column - doesn't exist in schema)
    const { data: spaces, error: spacesError } = await supabase
      .from('spaces')
      .select('id, name, description, capacity_seated, capacity_standing, display_order, is_active')
      .order('display_order', { ascending: true })
      .order('name')
      .limit(50);
    
    if (spacesError) console.error("Spaces fetch error:", spacesError);

    // Fetch leads (gracefully handle if table doesn't exist)
    const { data: leads, error: leadsError } = await supabase
      .from('management_leads')
      .select('id, client_name, status, contact_date, estimated_value')
      .order('contact_date', { ascending: false })
      .limit(30);
    
    if (leadsError && leadsError.code !== 'PGRST205') console.error("Leads fetch error:", leadsError);
    if (leadsError?.code === 'PGRST205') console.log("Leads table not yet created");

    // Fetch bookings
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id, title, start_ts, end_ts, status, space_id, event_id')
      .order('start_ts', { ascending: true })
      .limit(100);
    
    if (bookingsError) console.error("Bookings fetch error:", bookingsError);

    // Fetch event schedules
    const { data: eventSchedules, error: schedulesError } = await supabase
      .from('event_schedule')
      .select('event_id, time_label, scheduled_at, duration_minutes, responsible_role, notes')
      .order('scheduled_at')
      .limit(100);
    
    if (schedulesError) console.error("Event schedules fetch error:", schedulesError);

    // Fetch event menus
    const { data: eventMenus, error: menusError } = await supabase
      .from('event_menus')
      .select('event_id, course, item_name, description, allergens, price, notes')
      .limit(200);
    
    if (menusError) console.error("Event menus fetch error:", menusError);

    // Fetch event staffing
    const { data: eventStaffing, error: staffingError } = await supabase
      .from('event_staffing')
      .select('event_id, role, qty, shift_start, shift_end, hourly_rate, notes')
      .limit(100);
    
    if (staffingError) console.error("Event staffing fetch error:", staffingError);

    // Fetch event equipment
    const { data: eventEquipment, error: equipmentError } = await supabase
      .from('event_equipment')
      .select('event_id, category, item_name, quantity, specifications, supplier, hire_cost, delivery_time, collection_time, setup_instructions, contact_details')
      .limit(150);
    
    if (equipmentError) console.error("Event equipment fetch error:", equipmentError);

    // Fetch room layouts
    const { data: roomLayouts, error: layoutsError } = await supabase
      .from('event_room_layouts')
      .select('event_id, space_name, layout_type, capacity, setup_time, breakdown_time, setup_notes, special_requirements')
      .limit(100);
    
    if (layoutsError) console.error("Room layouts fetch error:", layoutsError);

    // Fetch financial line items
  const { data: lineItems, error: lineItemsError } = await supabase
      .from('management_event_line_items')
      .select('event_id, type, description, qty, unit_price, per_person, tax_rate_pct, sort_order')
      .order('event_id', { ascending: true })
      .order('sort_order', { ascending: true })
      .limit(300);
    
    if (lineItemsError) console.error("Line items fetch error:", lineItemsError);

    // Fetch BEO versions
    const { data: beoVersions, error: beoError } = await supabase
      .from('event_beo_versions')
      .select('event_id, version_no, generated_at, generated_by, pdf_url, notes, is_final')
      .order('generated_at', { ascending: false })
      .limit(100);
    
    if (beoError) console.error("BEO versions fetch error:", beoError);

    // Fetch contracts
    const { data: contracts, error: contractsError } = await supabase
      .from('contracts')
      .select('event_id, version, content, pdf_url, signature_status, is_signed, client_signed_at, staff_signed_at, is_immutable, created_at')
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (contractsError) console.error("Contracts fetch error:", contractsError);

    // Fetch audit logs (admin/finance only)
    let auditLogs = [];
    if (userRole === 'admin' || userRole === 'finance') {
      const { data: logs, error: auditError } = await supabase
        .from('audit_log')
        .select('entity, entity_id, action, actor_id, diff, created_at')
        .order('created_at', { ascending: false })
        .limit(200);
      
      if (auditError) console.error("Audit logs fetch error:", auditError);
      auditLogs = logs || [];
    }

    // Fetch conflicts
    const { data: conflicts, error: conflictsError } = await supabase
      .from('conflicts')
      .select('booking_id_1, booking_id_2, conflict_type, severity, status, conflict_details, created_at, resolved_at, resolved_by')
      .eq('status', 'active')
      .limit(50);
    
    if (conflictsError) console.error("Conflicts fetch error:", conflictsError);

    // Organize data by event for intelligent contextualization
    const enrichedEvents = (events || []).map((event: any) => {
      const eventId = event.id;
      const schedule = (eventSchedules || []).filter((s: any) => s.event_id === eventId);
      const menus = (eventMenus || []).filter((m: any) => m.event_id === eventId);
      const staffing = (eventStaffing || []).filter((s: any) => s.event_id === eventId);
      const equipment = (eventEquipment || []).filter((e: any) => e.event_id === eventId);
      const layouts = (roomLayouts || []).filter((l: any) => l.event_id === eventId);
      const items = (lineItems || []).filter((li: any) => li.event_id === eventId);
      const beos = (beoVersions || []).filter((b: any) => b.event_id === eventId);
      const eventContracts = (contracts || []).filter((c: any) => c.event_id === eventId);
      const history = auditLogs.filter((a: any) => a.entity_id === eventId && a.entity === 'event');
      
      return {
        ...event,
        details: {
          hasSchedule: schedule.length > 0,
          hasMenus: menus.length > 0,
          hasStaffing: staffing.length > 0,
          hasEquipment: equipment.length > 0,
          hasLayouts: layouts.length > 0,
          hasFinancials: items.length > 0,
          hasBEOs: beos.length > 0,
          hasContracts: eventContracts.length > 0,
          hasHistory: history.length > 0,
        },
        schedule,
        menus,
        staffing,
        equipment,
        layouts,
        lineItems: items,
        beos,
        contracts: eventContracts,
        auditHistory: history,
      };
    });

    return {
      enrichedEvents,
      spaces: spaces || [],
      leads: leads || [],
      bookings: bookings || [],
      conflicts: conflicts || [],
      errors: {
        events: eventsError?.message,
        spaces: spacesError?.message,
        leads: leadsError?.message,
        bookings: bookingsError?.message
      }
    };
  } catch (error) {
    console.error("Error fetching real data:", error);
    return {
      enrichedEvents: [],
      spaces: [],
      leads: [],
      bookings: [],
      conflicts: [],
      errors: { general: "Failed to fetch data" }
    };
  }
}

/**
 * Parse contract content to extract financial data
 */
function parseContractFinancials(contractContent: string): any {
  if (!contractContent) return null;

  try {
    const text = contractContent.replace(/\r/g, '');
    const financials: any = {
      lineItems: [],
      subtotal: 0,
      vatRate: 0,
      vatAmount: 0,
      serviceChargeRate: 0,
      serviceChargeAmount: 0,
      total: 0
    };

    // Patterns for line items (handle both "qty × £unit" and "£unit × qty", allow x or ×, optional "people", optional bullets)
    const itemPatterns = [
      /^\s*[•\-\u2022]?\s*(.+?)\s*-\s*(\d+)\s*(?:people\s*)?[x×]\s*£([\d,]+\.?\d*)\s*=\s*£([\d,]+\.?\d*)/gim,
      /^\s*[•\-\u2022]?\s*(.+?)\s*-\s*£([\d,]+\.?\d*)\s*[x×]\s*(\d+)\s*=\s*£([\d,]+\.?\d*)/gim,
    ];

    for (const pattern of itemPatterns) {
      let m: RegExpExecArray | null;
      while ((m = pattern.exec(text)) !== null) {
        // Normalise capture groups to: description, unitPrice, qty, total
        let description = (m[1] || '').trim();
        let unitPrice: string, qty: string, total: string;
        if (pattern === itemPatterns[0]) {
          qty = m[2];
          unitPrice = m[3];
          total = m[4];
        } else {
          unitPrice = m[2];
          qty = m[3];
          total = m[4];
        }
        financials.lineItems.push({
          description,
          unitPrice: parseFloat(unitPrice.replace(/,/g, '')),
          qty: parseInt(qty),
          total: parseFloat(total.replace(/,/g, '')),
        });
      }
    }

    // Financial summary with robust variants
    const subtotalMatch = text.match(/Subtotal(?:\s*\([^)]+\))?\s*:\s*£([\d,]+\.?\d*)/i);
    if (subtotalMatch) {
      financials.subtotal = parseFloat(subtotalMatch[1].replace(/,/g, ''));
    }

    const vatMatch = text.match(/VAT\s*\((\d+)%\)\s*:\s*£([\d,]+\.?\d*)/i);
    if (vatMatch) {
      financials.vatRate = parseFloat(vatMatch[1]);
      financials.vatAmount = parseFloat(vatMatch[2].replace(/,/g, ''));
    }

    const serviceMatch = text.match(/Service\s*Charge\s*\((\d+)%\)\s*:\s*£([\d,]+\.?\d*)/i);
    if (serviceMatch) {
      financials.serviceChargeRate = parseFloat(serviceMatch[1]);
      financials.serviceChargeAmount = parseFloat(serviceMatch[2].replace(/,/g, ''));
    }

    const totalMatch = text.match(/(TOTAL AMOUNT DUE|Total Amount Due|Total due|Total Due|Total)\s*:\s*£([\d,]+\.?\d*)/i);
    if (totalMatch) {
      financials.total = parseFloat(totalMatch[2].replace(/,/g, ''));
    }

    // Derive missing pieces if possible
    if (financials.subtotal === 0 && financials.lineItems.length > 0) {
      financials.subtotal = financials.lineItems.reduce((s: number, it: any) => s + (it.total || ((it.unitPrice || 0) * (it.qty || 1))), 0);
    }
    if (financials.total === 0 && financials.subtotal > 0) {
      financials.total = financials.subtotal + (financials.vatAmount || 0) + (financials.serviceChargeAmount || 0);
    }

    if (financials.lineItems.length > 0 || financials.total > 0) {
      console.log(`✓ Contract financials parsed: ${financials.lineItems.length} items, total £${financials.total.toFixed(2)}`);
      return financials;
    }

    return null;
  } catch (error) {
    console.error('Failed to parse contract financials:', error);
    return null;
  }
}

function buildSystemPrompt(context: any, realData: any): string {
  const { user, page, currentDate } = context;
  
  return `You're Cleo, Croft Common's AI assistant - here to help the management team work smarter and faster.

**CRITICAL RULES - READ FIRST:**
- You MUST ONLY use data provided in the "ACTUAL DATABASE DATA" section below
- NEVER make up, invent, or hallucinate information
- If data isn't available, say: "I don't have access to that info right now. Want me to help with something else?"
- Always reference real data when answering (e.g., "Looking at your ${realData.enrichedEvents?.length || 0} events...")
- Do NOT use markdown formatting with asterisks - write in plain text

**Your Personality:**
- Your name is Cleo
- Be warm, friendly, and conversational (like a helpful colleague)
- Be efficient - get to the point without being robotic
- Use contractions (there's, you've, let's) and natural language
- Address ${user?.firstName || 'users'} by first name
- Be proactive - offer next steps when helpful

**Current Context:**
- User: ${user?.firstName || ''} ${user?.lastName || ''} (${user?.role})
- Page: ${page?.route || 'Dashboard'}
- Today: ${currentDate || new Date().toISOString()}

**Permissions:**
${getRolePermissions(user?.role)}

**ACTUAL DATABASE DATA:**

EVENTS (${realData.enrichedEvents?.length || 0} total):
${realData.enrichedEvents?.length > 0 ? realData.enrichedEvents.map((e: any) => {
  const details = [];
  if (e.details.hasSchedule) details.push(`${e.schedule.length} schedule items`);
  if (e.details.hasMenus) details.push(`${e.menus.length} menu items`);
  if (e.details.hasStaffing) details.push(`${e.staffing.length} staff roles`);
  if (e.details.hasEquipment) details.push(`${e.equipment.length} equipment items`);
  if (e.details.hasLayouts) details.push(`${e.layouts.length} room layouts`);
  if (e.details.hasFinancials) details.push(`${e.lineItems.length} line items`);
  if (e.details.hasBEOs) details.push(`${e.beos.length} BEO versions`);
  if (e.details.hasContracts) details.push(`${e.contracts.length} contracts`);
  
  let eventSummary = `EVENT: ${e.event_type} (${e.code}) on ${e.primary_date}
  Status: ${e.status} | Attendees: ${e.headcount || 'TBC'} | Client: ${e.client_name || 'N/A'}${e.budget ? ` | Budget: £${e.budget}` : ''}`;
  
  if (details.length > 0) {
    eventSummary += `\n  Details available: ${details.join(', ')}`;
  }
  
  // Add schedule preview if available
  if (e.schedule.length > 0) {
    eventSummary += `\n  Key Times: ${e.schedule.slice(0, 3).map((s: any) => 
      `${s.time_label} at ${new Date(s.scheduled_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
    ).join(', ')}${e.schedule.length > 3 ? '...' : ''}`;
  }
  
  // Add layout preview if available
  if (e.layouts.length > 0) {
    eventSummary += `\n  Layouts: ${e.layouts.map((l: any) => `${l.space_name} (${l.layout_type}, ${l.capacity} capacity)`).join(', ')}`;
  }
  
  // BEO (Banquet Event Order) Details - Enhanced display
  if (e.beos.length > 0) {
    const latestBeo = e.beos[0]; // Most recent BEO
    eventSummary += `\n  📋 BEO: Version ${latestBeo.version_no}${latestBeo.is_final ? ' (FINAL)' : ' (DRAFT)'}`;
    eventSummary += `\n     Generated: ${new Date(latestBeo.generated_at).toLocaleString('en-GB')}`;
    if (latestBeo.pdf_url) {
      eventSummary += `\n     PDF Available: ${latestBeo.pdf_url}`;
    }
    if (latestBeo.notes) {
      eventSummary += `\n     Notes: ${latestBeo.notes}`;
    }
  }
  
  // Menu items detail (IMPORTANT: This is actual food/drink items, NOT financial line items)
  if (e.menus.length > 0) {
    eventSummary += `\n  🍽️ ACTUAL MENU - FOOD & DRINK ITEMS (${e.menus.length} dishes):`;
    e.menus.forEach((m: any) => {
      eventSummary += `\n     • ${m.course}: ${m.item_name}`;
      if (m.description) eventSummary += ` - ${m.description}`;
      if (m.price) eventSummary += ` [£${m.price}]`;
      if (m.allergens && m.allergens.length > 0) eventSummary += ` | ⚠️ Allergens: ${m.allergens.join(', ')}`;
    });
    eventSummary += `\n  ────────────────`;
  }
  
  // Staffing detail (for BEO queries)
  if (e.staffing.length > 0) {
    eventSummary += `\n  👥 STAFFING (${e.staffing.length} roles):`;
    e.staffing.forEach((s: any) => {
      const shift = s.shift_start && s.shift_end 
        ? `${new Date(s.shift_start).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} - ${new Date(s.shift_end).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
        : 'TBC';
      eventSummary += `\n     ${s.role} x${s.qty}${s.hourly_rate ? ` @ £${s.hourly_rate}/hr` : ''} | ${shift}`;
      if (s.notes) eventSummary += ` | ${s.notes}`;
    });
  }
  
  // Equipment detail (for BEO queries)
  if (e.equipment.length > 0) {
    eventSummary += `\n  🔧 EQUIPMENT (${e.equipment.length} items):`;
    e.equipment.slice(0, 5).forEach((eq: any) => {
      eventSummary += `\n     ${eq.category}: ${eq.item_name} x${eq.quantity}${eq.hire_cost ? ` - £${eq.hire_cost}` : ''}`;
      if (eq.supplier) eventSummary += ` (${eq.supplier})`;
    });
    if (e.equipment.length > 5) eventSummary += `\n     ...and ${e.equipment.length - 5} more items`;
  }
  
  // FINANCIALS - with fallback logic
  let financialSource = null;
  let financialData = null;
  
  // Priority 1: Use event line items if available
  if (e.lineItems.length > 0) {
    financialSource = 'proposal_items';
    const headcount = e.headcount || 0;
    
    // Calculate subtotal (before taxes and service)
    const subtotal = e.lineItems.reduce((sum: number, item: any) => {
      const multiplier = item.per_person ? headcount : 1;
      const itemTotal = (item.unit_price || 0) * (item.qty || 1) * multiplier;
      return sum + itemTotal;
    }, 0);
    
    // Calculate Service Charge (10%) - VAT is typically included in unit prices
    const serviceChargeRate = 0.10;
    const serviceCharge = subtotal * serviceChargeRate;
    const totalWithService = subtotal + serviceCharge;
    
    eventSummary += `\n  💰 FINANCIALS (Source: Proposal line items):`;
    e.lineItems.forEach((item: any) => {
      const multiplier = item.per_person ? headcount : 1;
      const itemTotal = (item.unit_price || 0) * (item.qty || 1) * multiplier;
      if (item.per_person) {
        eventSummary += `\n    - ${item.type}: ${item.description} | £${item.unit_price} per person x ${item.qty} x ${headcount} guests = £${itemTotal.toFixed(2)}`;
      } else {
        eventSummary += `\n    - ${item.type}: ${item.description} | £${item.unit_price} x ${item.qty} = £${itemTotal.toFixed(2)}`;
      }
    });
    eventSummary += `\n    ────────────────`;
    eventSummary += `\n    Subtotal: £${subtotal.toFixed(2)}`;
    eventSummary += `\n    Service Charge (10%): £${serviceCharge.toFixed(2)}`;
    eventSummary += `\n    ════════════════`;
    eventSummary += `\n    TOTAL (inc. VAT & Service): £${totalWithService.toFixed(2)}`;
    eventSummary += `\n    (VAT included in prices above)`;
  }
  // Priority 2: Parse contract if no line items
  else if (e.contracts.length > 0 && e.contracts[0].content) {
    const parsedFinancials = parseContractFinancials(e.contracts[0].content);
    if (parsedFinancials && parsedFinancials.total > 0) {
      financialSource = 'contract_summary';
      eventSummary += `\n  💰 FINANCIALS (Source: Signed contract | Total: £${parsedFinancials.total.toFixed(2)}):`;
      
      if (parsedFinancials.lineItems.length > 0) {
        parsedFinancials.lineItems.forEach((item: any) => {
          eventSummary += `\n    - ${item.description} | £${item.unitPrice.toFixed(2)} x ${item.qty} = £${item.total.toFixed(2)}`;
        });
      }
      
      // Add VAT and service charge breakdown
      if (parsedFinancials.subtotal > 0) {
        eventSummary += `\n    Subtotal: £${parsedFinancials.subtotal.toFixed(2)}`;
      }
      if (parsedFinancials.vatAmount > 0) {
        eventSummary += `\n    VAT (${parsedFinancials.vatRate}%): £${parsedFinancials.vatAmount.toFixed(2)}`;
      }
      if (parsedFinancials.serviceChargeAmount > 0) {
        eventSummary += `\n    Service charge (${parsedFinancials.serviceChargeRate}%): £${parsedFinancials.serviceChargeAmount.toFixed(2)}`;
      }
    }
  }
  
  // CONTRACT STATUS
  if (e.contracts.length > 0) {
    const latestContract = e.contracts[0];
    eventSummary += `\n  📋 CONTRACT v${latestContract.version} - ${latestContract.signature_status}${latestContract.is_signed ? ' ✓ SIGNED' : ' ⏳ Pending'}`;
    if (latestContract.is_signed && latestContract.client_signed_at) {
      eventSummary += ` (Signed: ${new Date(latestContract.client_signed_at).toLocaleDateString('en-GB')})`;
    }
  }
  
  return eventSummary;
}).join('\n\n') : 'No events scheduled yet'}

SPACES (${realData.spaces?.length || 0} total):
${realData.spaces?.length > 0 ? realData.spaces.map((s: any) => 
  `- ${s.name} — Seated: ${s.capacity_seated ?? 'TBC'}, Standing: ${s.capacity_standing ?? 'TBC'}`
).join('\n') : 'No spaces configured'}

LEADS (${realData.leads?.length || 0} total):
${realData.leads?.length > 0 ? realData.leads.map((l: any) => 
  `- ${l.client_name} - Status: ${l.status}, Contact: ${l.contact_date}, Value: £${l.estimated_value || 0}`
).join('\n') : 'No leads in pipeline'}

BOOKINGS (${realData.bookings?.length || 0} total):
${realData.bookings?.length > 0 ? realData.bookings.map((b: any) => 
  `- ${b.title} from ${b.start_ts} to ${b.end_ts} - Status: ${b.status}`
).join('\n') : 'No bookings scheduled'}

ACTIVE CONFLICTS (${realData.conflicts?.length || 0} total):
${realData.conflicts?.length > 0 ? realData.conflicts.map((c: any) => 
  `- ${c.conflict_type} (${c.severity}) between bookings ${c.booking_id_1} and ${c.booking_id_2}`
).join('\n') : 'No active conflicts'}

**Available Management Modules:**
1. **Spaces & Venues**: Manage physical spaces, capacity, layouts, opening hours
2. **Events & Bookings**: Create events, manage bookings, resolve conflicts, track status
3. **Leads & Sales**: Pipeline management, lead assignment, status tracking, conversions
4. **Calendar**: View availability, check conflicts, schedule bookings
5. **BEOs (Banquet Event Orders)**: Generate comprehensive event details (menu, staffing, schedule, layout, equipment)
6. **Contracts**: Generate, track, and manage event contracts with signatures
7. **Audit Logs**: Track all changes and actions for compliance

**How to Respond:**

FOR QUESTIONS (Most common):
- Chat naturally like a helpful colleague
- Keep it brief but friendly
- Use British English (organised, colour, etc.)
- Lead with the answer, not preamble

FOR BEO REQUESTS (Special handling):
- When user asks for a BEO or BEO PDF, ALWAYS include the PDF URL if available
- Format the URL as a clickable link in your response
- Summarise BEO contents (menu, staffing, schedule) from the data above
- If no BEO exists, offer to generate one
- Example: "Here's the latest BEO for [Event] (Version 3, generated on 29 Sep):
  📄 Download PDF: [URL]
  
  Contents: 4 menu items (Starters, Mains...), 2 staff roles, 5 schedule items"

FOR MENU QUESTIONS (CRITICAL):
- When user asks "what's on the menu" or "menu items", they want FOOD/DRINK dishes from the "ACTUAL MENU - FOOD & DRINK ITEMS" section
- DO NOT confuse this with financial line items (which show pricing like "Food | GBP25 per person")
- List the actual dish names by course: Starters, Mains, Desserts, etc.
- Example: "The menu for this event includes:
  Starters: Charred Octopus with Potato & Aioli, Wood-Roast Aubergine
  Mains: Roast Cod with Brown Shrimp Butter
  Desserts: Churros with Dark Chocolate"

FOR ACTIONS (When asked to DO something):
- Only return JSON when explicitly asked to CREATE, UPDATE, DELETE something
- Format: {"type": "action", "action": "action_name", "params": {...}, "reasoning": "why"}

**Response Examples:**
- "What events are coming up?" → "Hey! You've got 2 draft events: Michael Brown's presentation on 28 Sep and a social event on 6 Oct. Need details on either?"
- "Show me spaces" → "Looking at your spaces - Main Hall fits 200, Common Room does 50, and the Terrace holds 30. Which one are you interested in?"
- "Show me the BEO for 28th Sept event" → Provide PDF URL, version number, and summary of contents
- "What's on the menu?" or "What are the menu items?" → "The menu for Michael Brown's event includes: Starters - Charred Octopus with Potato & Aioli (x10), Wood-Roast Aubergine (x4); Mains - Roast Cod with Brown Shrimp Butter (x10); Desserts - Churros with Dark Chocolate (x10)"
- "Create a new event for Monday" → Return JSON action

**Keep in Mind:**
- Respect role permissions
- Summarise data-heavy info
- Offer helpful next steps
- Ask for clarification if unsure

**Available Actions (require user confirmation):**
${getAvailableActions(user?.role)}

**Current Page Context:**
${getPageContext(page)}

Help ${user?.firstName || 'the user'} efficiently manage their work at Croft Common.`;
}

function getRolePermissions(role: string): string {
  const permissions = {
    admin: "Full access - Can create, edit, delete anything. Access to all financial data and audit logs.",
    sales: "Can create/edit events, leads, bookings. Can view finances. Cannot delete major records or access full audit logs.",
    ops: "Can view bookings/events, manage schedules, limited editing. Cannot access finances or create major records.",
    finance: "Can view financial data, audit logs, generate reports. Cannot create or modify events/bookings.",
    readonly: "View-only access across all modules. Cannot make any changes."
  };
  return permissions[role as keyof typeof permissions] || "Unknown role - limited access";
}

function getAvailableActions(role: string): string {
  const baseActions = "- Query data and generate reports\n- Search across modules\n- Display BEO details and provide PDF links";
  
  const actionsByRole: Record<string, string> = {
    admin: `${baseActions}
- create_venue, update_venue, delete_venue
- create_event, update_event, delete_event
- create_booking, update_booking, resolve_conflict
- generate_beo (create new BEO version with all details)
- update_beo_section (update menu, staffing, schedule, equipment, layouts)
- send_beo_email (email BEO to client/team)
- create_lead, assign_lead, update_lead_status
- generate_contract, send_contract
- generate_invoice
- run_analytics, export_report`,
    
    sales: `${baseActions}
- create_event, update_event
- create_booking, update_booking
- generate_beo (create new BEO version)
- update_beo_section (update BEO details)
- send_beo_email (email BEO to client/team)
- create_lead, assign_lead, update_lead_status
- generate_contract, send_contract
- generate_invoice`,
    
    ops: `${baseActions}
- update_booking (limited)
- generate_beo (create BEO version)
- update_beo_section (update operational details)
- send_beo_email (send to operations team)
- generate_report (operational)`,
    
    finance: `${baseActions}
- run_analytics, export_report (financial)
- generate_invoice`,
    
    readonly: baseActions
  };
  
  return actionsByRole[role] || baseActions;
}

function getPageContext(page: any): string {
  if (!page?.route) return "No specific page context";
  
  const contexts: Record<string, string> = {
    "/management": "Overview dashboard - Summary of all activities",
    "/management/spaces": "Spaces management - View and edit venues and spaces",
    "/management/calendar": "Calendar view - Check availability and conflicts",
    "/management/events": "Events management - View and manage event bookings",
    "/management/leads": "Leads & Sales - Manage sales pipeline",
  };
  
  return contexts[page.route] || `Viewing: ${page.route}`;
}
