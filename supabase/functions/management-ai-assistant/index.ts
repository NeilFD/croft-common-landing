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

    // Fetch spaces
    const { data: spaces, error: spacesError } = await supabase
      .from('spaces')
      .select('id, name, capacity, venue_type')
      .limit(20);
    
    if (spacesError) console.error("Spaces fetch error:", spacesError);

    // Fetch leads
    const { data: leads, error: leadsError } = await supabase
      .from('management_leads')
      .select('id, client_name, status, contact_date, estimated_value')
      .order('contact_date', { ascending: false })
      .limit(30);
    
    if (leadsError) console.error("Leads fetch error:", leadsError);

    // Fetch bookings
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id, title, start_ts, end_ts, status')
      .order('start_ts', { ascending: true })
      .limit(30);
    
    if (bookingsError) console.error("Bookings fetch error:", bookingsError);

    return {
      events: events || [],
      spaces: spaces || [],
      leads: leads || [],
      bookings: bookings || [],
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
      events: [],
      spaces: [],
      leads: [],
      bookings: [],
      errors: { general: "Failed to fetch data" }
    };
  }
}

function buildSystemPrompt(context: any, realData: any): string {
  const { user, page, currentDate } = context;
  
  return `You're Cleo, Croft Common's AI assistant - here to help the management team work smarter and faster.

**CRITICAL RULES - READ FIRST:**
- You MUST ONLY use data provided in the "ACTUAL DATABASE DATA" section below
- NEVER make up, invent, or hallucinate information
- If data isn't available, say: "I don't have access to that info right now. Want me to help with something else?"
- Always reference real data when answering (e.g., "Looking at your ${realData.events?.length || 0} events...")
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

EVENTS (${realData.events?.length || 0} total):
${realData.events?.length > 0 ? realData.events.map((e: any) => 
  `- ${e.event_type} (${e.code}) on ${e.primary_date} - Status: ${e.status}, Attendees: ${e.headcount || 'TBC'}, Client: ${e.client_name || 'N/A'}${e.budget ? `, Budget: £${e.budget}` : ''}`
).join('\n') : 'No events scheduled yet'}

SPACES (${realData.spaces?.length || 0} total):
${realData.spaces?.length > 0 ? realData.spaces.map((s: any) => 
  `- ${s.name} (${s.venue_type}) - Capacity: ${s.capacity || 'Not set'}`
).join('\n') : 'No spaces configured'}

LEADS (${realData.leads?.length || 0} total):
${realData.leads?.length > 0 ? realData.leads.map((l: any) => 
  `- ${l.client_name} - Status: ${l.status}, Contact: ${l.contact_date}, Value: £${l.estimated_value || 0}`
).join('\n') : 'No leads in pipeline'}

BOOKINGS (${realData.bookings?.length || 0} total):
${realData.bookings?.length > 0 ? realData.bookings.map((b: any) => 
  `- ${b.title} from ${b.start_ts} to ${b.end_ts} - Status: ${b.status}`
).join('\n') : 'No bookings scheduled'}

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

FOR ACTIONS (When asked to DO something):
- Only return JSON when explicitly asked to CREATE, UPDATE, DELETE something
- Format: {"type": "action", "action": "action_name", "params": {...}, "reasoning": "why"}

**Response Examples:**
- "What events are coming up?" → "Hey! You've got 2 draft events: Michael Brown's presentation on 28 Sep and a social event on 6 Oct. Need details on either?"
- "Show me spaces" → "Looking at your spaces - Main Hall fits 200, Common Room does 50, and the Terrace holds 30. Which one are you interested in?"
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
  const baseActions = "- Query data and generate reports\n- Search across modules";
  
  const actionsByRole: Record<string, string> = {
    admin: `${baseActions}
- create_venue, update_venue, delete_venue
- create_event, update_event, delete_event
- create_booking, update_booking, resolve_conflict
- generate_beo, update_beo_section
- create_lead, assign_lead, update_lead_status
- generate_contract, send_contract
- run_analytics, export_report`,
    
    sales: `${baseActions}
- create_event, update_event
- create_booking, update_booking
- generate_beo, update_beo_section
- create_lead, assign_lead, update_lead_status
- generate_contract, send_contract`,
    
    ops: `${baseActions}
- update_booking (limited)
- update_beo_section
- generate_report (operational)`,
    
    finance: `${baseActions}
- run_analytics, export_report (financial)`,
    
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
