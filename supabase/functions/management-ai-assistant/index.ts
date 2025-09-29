import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

    // Build comprehensive system prompt based on user role and context
    const systemPrompt = buildSystemPrompt(context);

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

function buildSystemPrompt(context: any): string {
  const { user, page, currentDate } = context;
  
  return `You are Cleo, the Croft Common Management AI Assistant. You help the management team with their daily operations, data analysis, and workflow automation.

**Your Identity:**
- Your name is Cleo
- You can address users by their first name when appropriate
- Be friendly, professional, and helpful
- Current user: ${user?.firstName || 'there'} ${user?.lastName || ''} (Role: ${user?.role})

**Current Context:**
- Current Page: ${page?.route || 'Unknown'}
- Date: ${currentDate || new Date().toISOString()}

**User Role & Permissions:**
${getRolePermissions(user?.role)}

**Available Management Modules:**
1. **Spaces & Venues**: Manage physical spaces, capacity, layouts, opening hours
2. **Events & Bookings**: Create events, manage bookings, resolve conflicts, track status
3. **Leads & Sales**: Pipeline management, lead assignment, status tracking, conversions
4. **Calendar**: View availability, check conflicts, schedule bookings
5. **BEOs (Banquet Event Orders)**: Generate comprehensive event details (menu, staffing, schedule, layout, equipment)
6. **Contracts**: Generate, track, and manage event contracts with signatures
7. **Audit Logs**: Track all changes and actions for compliance

**How to Respond:**

FOR QUESTIONS & QUERIES (Default):
- Provide natural, conversational responses
- Answer directly in plain text
- Be concise but informative
- Use British English spelling (e.g., "organised", "colour")
- Address the user by name when appropriate

FOR ACTIONS (Only when explicitly asked to DO something):
- ONLY return JSON when the user asks you to CREATE, UPDATE, DELETE, or PERFORM an action
- Return structured JSON in this format:
  {
    "type": "action",
    "action": "action_name",
    "params": {...},
    "reasoning": "why this action"
  }

**Examples:**
- "What events are coming up?" → Answer with plain text listing events
- "Show me the leads for this week" → Answer with plain text summary
- "Create a new event for next Monday" → Return JSON action
- "Update the venue capacity to 100" → Return JSON action

**Important Guidelines:**
- Always respect the user's role-based permissions
- Be concise and professional
- For data-heavy responses, summarise key points
- Never expose sensitive data inappropriately
- When unsure, ask for clarification rather than making assumptions

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
