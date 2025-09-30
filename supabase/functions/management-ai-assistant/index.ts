import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============= INTENT DETECTION & EVENT RESOLUTION =============

interface Intent {
  type: 'menu' | 'beo' | 'pdf' | 'schedule' | 'staffing' | 'equipment' | 'contract' | 'general';
  eventIdentifier?: string;
  confidence: number;
}

function detectIntent(message: string, conversationHistory: any[] = []): Intent {
  const lower = message.toLowerCase();
  
  // Menu intent detection
  if (/\b(menu|dish|food|drink|course|starter|main|dessert|allergen)\b/i.test(lower)) {
    const eventId = extractEventIdentifier(message, conversationHistory);
    return { type: 'menu', eventIdentifier: eventId, confidence: 0.9 };
  }
  
  // BEO/PDF intent detection
  if (/\b(beo|banquet.?event.?order|pdf|document|send.?me|download)\b/i.test(lower)) {
    const eventId = extractEventIdentifier(message, conversationHistory);
    return { type: 'beo', eventIdentifier: eventId, confidence: 0.9 };
  }
  
  // Schedule intent detection
  if (/\b(schedule|timing|timeline|when|time|agenda)\b/i.test(lower)) {
    const eventId = extractEventIdentifier(message, conversationHistory);
    return { type: 'schedule', eventIdentifier: eventId, confidence: 0.8 };
  }
  
  // Staffing intent detection
  if (/\b(staff|team|role|who.?work)\b/i.test(lower)) {
    const eventId = extractEventIdentifier(message, conversationHistory);
    return { type: 'staffing', eventIdentifier: eventId, confidence: 0.8 };
  }
  
  // Equipment intent detection
  if (/\b(equipment|av|audio|visual|setup|hire)\b/i.test(lower)) {
    const eventId = extractEventIdentifier(message, conversationHistory);
    return { type: 'equipment', eventIdentifier: eventId, confidence: 0.8 };
  }
  
  // Contract intent detection
  if (/\b(contract|agreement|sign|signature)\b/i.test(lower)) {
    const eventId = extractEventIdentifier(message, conversationHistory);
    return { type: 'contract', eventIdentifier: eventId, confidence: 0.8 };
  }
  
  // General fallback
  const eventId = extractEventIdentifier(message, conversationHistory);
  return { type: 'general', eventIdentifier: eventId, confidence: 0.5 };
}

function extractEventIdentifier(message: string, conversationHistory: any[] = []): string | undefined {
  // Improved event code pattern - more flexible
  const codeMatch = message.match(/\b(event\s*(?:no\.?|number|#)?\s*)?(?:20\d{2}\d{3})\b/i);
  if (codeMatch) {
    const extractedCode = codeMatch[0].match(/20\d{2}\d{3}/);
    if (extractedCode) {
      console.log(`✓ Found explicit event code: ${extractedCode[0]}`);
      return extractedCode[0];
    }
  }
  
  // Try to extract date (e.g., "28 Sep", "28th September", "Sept 28")
  const datePatterns = [
    /\b(\d{1,2})\s*(st|nd|rd|th)?\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*/i,
    /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s*(\d{1,2})\b/i,
  ];
  
  for (const pattern of datePatterns) {
    const match = message.match(pattern);
    if (match) {
      console.log(`✓ Found date reference: ${match[0]}`);
      return match[0];
    }
  }
  
  // Check if message references a previous event ("that event", "this event", "the event")
  const contextReferences = /\b(that|this|the|same)\s+(event|one|booking)\b/i;
  if (contextReferences.test(message) && conversationHistory.length > 0) {
    console.log(`🔍 Detected contextual reference, searching conversation history...`);
    
    // Search last 5 messages for event identifiers
    const recentMessages = conversationHistory.slice(-5).reverse();
    
    for (const msg of recentMessages) {
      if (!msg?.content) continue;
      
      const content = msg.content;
      
      // Look for event codes
      const historyCodeMatch = content.match(/\b(20\d{2}\d{3})\b/);
      if (historyCodeMatch) {
        console.log(`✓ Found event code in history: ${historyCodeMatch[1]}`);
        return historyCodeMatch[1];
      }
      
      // Look for dates
      for (const pattern of datePatterns) {
        const historyDateMatch = content.match(pattern);
        if (historyDateMatch) {
          console.log(`✓ Found date in history: ${historyDateMatch[0]}`);
          return historyDateMatch[0];
        }
      }
    }
    
    console.log(`✗ No event identifier found in conversation history`);
  }
  
  // Return undefined if no identifier found
  return undefined;
}

async function resolveEvent(supabase: any, identifier: string): Promise<string | null> {
  // First try exact code match
  if (/^20\d{2}\d{3}$/.test(identifier)) {
    const { data } = await supabase
      .from('management_events')
      .select('id')
      .eq('code', identifier)
      .maybeSingle();
    
    if (data) {
      console.log(`✓ Event resolved by code: ${identifier} -> ${data.id}`);
      return data.id;
    }
  }
  
  // Try date match
  if (/\d/.test(identifier)) {
    try {
      const now = new Date();
      const currentYear = now.getFullYear();
      
      // Parse the date string and try current and next year
      const dateStr = identifier.toLowerCase();
      const months: Record<string, number> = {
        jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
        jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
      };
      
      let targetDate: Date | null = null;
      
      // Try "28 Sep" format
      const match1 = dateStr.match(/(\d{1,2})\s*(st|nd|rd|th)?\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i);
      if (match1) {
        const day = parseInt(match1[1]);
        const monthName = match1[3].toLowerCase().substring(0, 3);
        const month = months[monthName];
        targetDate = new Date(currentYear, month, day);
        
        // If date is in the past, try next year
        if (targetDate < now) {
          targetDate = new Date(currentYear + 1, month, day);
        }
      }
      
      // Try "Sep 28" format
      const match2 = dateStr.match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s*(\d{1,2})/i);
      if (!targetDate && match2) {
        const monthName = match2[1].toLowerCase().substring(0, 3);
        const month = months[monthName];
        const day = parseInt(match2[2]);
        targetDate = new Date(currentYear, month, day);
        
        if (targetDate < now) {
          targetDate = new Date(currentYear + 1, month, day);
        }
      }
      
      if (targetDate) {
        const dateString = targetDate.toISOString().split('T')[0];
        console.log(`🔍 Searching for events on date: ${dateString}`);
        
        const { data } = await supabase
          .from('management_events')
          .select('id, code, event_type, primary_date')
          .gte('primary_date', dateString)
          .lt('primary_date', new Date(targetDate.getTime() + 86400000).toISOString().split('T')[0])
          .limit(1)
          .maybeSingle();
        
        if (data) {
          console.log(`✓ Event resolved by date: ${identifier} -> ${data.code} (${data.id})`);
          return data.id;
        }
      }
    } catch (e) {
      console.error('Date parsing error:', e);
    }
  }
  
  // Try fuzzy text match on event_type or client_name
  const { data } = await supabase
    .from('management_events')
    .select('id, code, event_type, client_name')
    .or(`event_type.ilike.%${identifier}%,client_name.ilike.%${identifier}%`)
    .limit(1)
    .maybeSingle();
  
  if (data) {
    console.log(`✓ Event resolved by fuzzy match: ${identifier} -> ${data.code} (${data.id})`);
    return data.id;
  }
  
  console.log(`✗ Could not resolve event identifier: ${identifier}`);
  return null;
}

async function retrieveTargetedData(supabase: any, intent: Intent, eventId: string | null) {
  const retrieved: any = { intent: intent.type };
  
  if (!eventId) {
    return retrieved;
  }
  
  try {
    // Retrieve menu data for menu or BEO intent (people often ask "menu on the BEO")
    if (intent.type === 'menu' || intent.type === 'beo' || intent.type === 'pdf') {
      const { data: menus } = await supabase
        .from('event_menus')
        .select('course, item_name, description, allergens, price, notes')
        .eq('event_id', eventId)
        .order('course')
        .order('item_name');
      
      retrieved.menus = menus || [];
      console.log(`📋 Retrieved ${menus?.length || 0} menu items for event ${eventId}`);
    }
    
    // Retrieve BEO data for beo/pdf intent
    if (intent.type === 'beo' || intent.type === 'pdf') {
      const { data: beos } = await supabase
        .from('event_beo_versions')
        .select('version_no, generated_at, pdf_url, notes, is_final')
        .eq('event_id', eventId)
        .order('generated_at', { ascending: false })
        .limit(1);
      
      if (beos && beos.length > 0 && beos[0].pdf_url) {
        // Get signed URL for the PDF
        const { data: signedData } = await supabase.functions.invoke('get-beo-signed-url', {
          body: { pdfUrl: beos[0].pdf_url }
        });
        
        retrieved.latestBeo = beos[0];
        retrieved.beoSignedUrl = signedData?.signedUrl;
        console.log(`📄 Retrieved BEO v${beos[0].version_no} with signed URL`);
      }
    }
    
    // Retrieve schedule data for schedule intent
    if (intent.type === 'schedule') {
      const { data: schedule } = await supabase
        .from('event_schedule')
        .select('time_label, scheduled_at, duration_minutes, responsible_role, notes')
        .eq('event_id', eventId)
        .order('scheduled_at');
      
      retrieved.schedule = schedule || [];
      console.log(`⏰ Retrieved ${schedule?.length || 0} schedule items`);
    }
    
    // Retrieve staffing data for staffing intent
    if (intent.type === 'staffing') {
      const { data: staffing } = await supabase
        .from('event_staffing')
        .select('role, qty, shift_start, shift_end, hourly_rate, notes')
        .eq('event_id', eventId)
        .order('shift_start');
      
      retrieved.staffing = staffing || [];
      console.log(`👥 Retrieved ${staffing?.length || 0} staffing roles`);
    }
    
    // Retrieve equipment data for equipment intent
    if (intent.type === 'equipment') {
      const { data: equipment } = await supabase
        .from('event_equipment')
        .select('category, item_name, quantity, specifications, supplier, hire_cost')
        .eq('event_id', eventId)
        .order('category');
      
      retrieved.equipment = equipment || [];
      console.log(`🔧 Retrieved ${equipment?.length || 0} equipment items`);
    }
    
    // Always get basic event info for context
    const { data: event } = await supabase
      .from('management_events')
      .select('code, event_type, primary_date, status, headcount, client_name, budget')
      .eq('id', eventId)
      .maybeSingle();
    
    if (event) {
      retrieved.event = event;
    }
    
  } catch (error) {
    console.error('Error retrieving targeted data:', error);
  }
  
  return retrieved;
}

async function fetchMinimalBaseData(supabase: any, userRole: string) {
  try {
    // Only fetch high-level overviews for context
    const { data: events } = await supabase
      .from('management_events')
      .select('id, code, event_type, primary_date, status, headcount, client_name')
      .order('primary_date', { ascending: true })
      .limit(20);
    
    const { data: spaces } = await supabase
      .from('spaces')
      .select('id, name, capacity_seated, capacity_standing')
      .eq('is_active', true)
      .order('display_order')
      .limit(10);
    
    return {
      events: events || [],
      spaces: spaces || [],
      eventCount: events?.length || 0,
      spaceCount: spaces?.length || 0,
    };
  } catch (error) {
    console.error('Error fetching minimal base data:', error);
    return { events: [], spaces: [], eventCount: 0, spaceCount: 0 };
  }
}

// ============= END INTENT & RESOLUTION =============

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

    // Get the latest user message for intent detection
    const latestMessage = messages[messages.length - 1]?.content || '';
    
    console.log('🎯 Processing message:', latestMessage.substring(0, 100));
    console.log('📚 Conversation history length:', messages.length);

    // Detect intent and extract event identifier (pass conversation history for context)
    const intent = detectIntent(latestMessage, messages);
    console.log('🔍 Detected intent:', intent);

    // Resolve event if identifier found
    let resolvedEventId = null;
    if (intent.eventIdentifier) {
      resolvedEventId = await resolveEvent(supabase, intent.eventIdentifier);
      console.log('📍 Resolved event ID:', resolvedEventId || 'NOT_FOUND');
    }

    // Perform targeted retrieval based on intent
    const retrievedData = await retrieveTargetedData(supabase, intent, resolvedEventId);
    console.log('📦 Retrieved data:', {
      intent: intent.type,
      eventId: resolvedEventId,
      menuCount: retrievedData.menus?.length || 0,
      hasBeoUrl: !!retrievedData.beoSignedUrl,
      scheduleCount: retrievedData.schedule?.length || 0,
    });

    // Fetch minimal base data for context (overview only)
    const baseData = await fetchMinimalBaseData(supabase, context?.user?.role);

    // Build minimal system prompt + append retrieved data section
    const systemPrompt = buildSystemPrompt(context, baseData, retrievedData);

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

// Old fetchRealData function removed - replaced with fetchMinimalBaseData and retrieveTargetedData

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

function buildSystemPrompt(context: any, baseData: any, retrievedData: any): string {
  const { user, page, currentDate } = context;
  
  // Build minimal base prompt
  let prompt = `You're Cleo, Croft Common's AI assistant - here to help the management team work smarter and faster.

**CRITICAL RULES:**
- ONLY use data from the RETRIEVED DATA section below (if present) or the DATABASE OVERVIEW
- NEVER make up, invent, or hallucinate information
- If data isn't available, say: "I don't have that info right now - can I help with something else?"
- Do NOT use markdown formatting with asterisks - write in plain text
- Use British English (organised, colour, etc.)

**Your Personality:**
- Your name is Cleo
- Be warm, friendly, and conversational (like a helpful colleague)
- Be efficient - get to the point without being robotic
- Use contractions (there's, you've, let's) and natural language
- Address ${user?.firstName || 'the user'} by first name when possible

**Current Context:**
- User: ${user?.firstName || ''} ${user?.lastName || ''} (${user?.role})
- Page: ${page?.route || 'Dashboard'}
- Today: ${currentDate || new Date().toISOString()}

**Permissions:**
${getRolePermissions(user?.role)}

**DATABASE OVERVIEW (High-level context only):**
- Events: ${baseData.eventCount} upcoming events
${baseData.events?.slice(0, 5).map((e: any) => 
  `  • ${e.code}: ${e.event_type} on ${e.primary_date} (${e.status})`
).join('\n') || '  No events'}

- Spaces: ${baseData.spaceCount} active spaces
${baseData.spaces?.map((s: any) => 
  `  • ${s.name}: Seated ${s.capacity_seated}, Standing ${s.capacity_standing}`
).join('\n') || '  No spaces'}
`;

  // Add RETRIEVED DATA section if we have targeted data
  if (retrievedData && Object.keys(retrievedData).length > 1) {
    prompt += `\n**━━━ RETRIEVED DATA (Use this as source of truth for this query) ━━━**\n`;
    
    // Event context
    if (retrievedData.event) {
      const e = retrievedData.event;
      prompt += `\nEVENT: ${e.event_type} (Code: ${e.code})
Date: ${e.primary_date}
Status: ${e.status}
Client: ${e.client_name || 'N/A'}
Attendees: ${e.headcount || 'TBC'}${e.budget ? `\nBudget: £${e.budget}` : ''}\n`;
    }
    
    // Menu data
    if (retrievedData.menus && retrievedData.menus.length > 0) {
      prompt += `\n🍽️ MENU ITEMS (${retrievedData.menus.length} dishes):\n`;
      
      // Group by course
      const courses: Record<string, any[]> = {};
      retrievedData.menus.forEach((m: any) => {
        if (!courses[m.course]) courses[m.course] = [];
        courses[m.course].push(m);
      });
      
      Object.entries(courses).forEach(([course, items]) => {
        prompt += `\n${course}:\n`;
        items.forEach((m: any) => {
          prompt += `  • ${m.item_name}`;
          if (m.description) prompt += ` - ${m.description}`;
          if (m.price) prompt += ` [£${m.price}]`;
          if (m.allergens && m.allergens.length > 0) {
            prompt += `\n    ⚠️ Allergens: ${m.allergens.join(', ')}`;
          }
          prompt += '\n';
        });
      });
    } else if (retrievedData.event) {
      // Be explicit to avoid hallucinating from financials
      prompt += `\n🍽️ MENU ITEMS: None found for this event in the database.\n`;
    }
    
    // BEO data
    if (retrievedData.latestBeo) {
      const beo = retrievedData.latestBeo;
      prompt += `\n📋 BEO (Banquet Event Order):\n`;
      prompt += `  Version: ${beo.version_no}${beo.is_final ? ' (FINAL)' : ' (DRAFT)'}\n`;
      prompt += `  Generated: ${new Date(beo.generated_at).toLocaleString('en-GB')}\n`;
      if (retrievedData.beoSignedUrl) {
        prompt += `  📄 Download PDF: ${retrievedData.beoSignedUrl}\n`;
      }
      if (beo.notes) {
        prompt += `  Notes: ${beo.notes}\n`;
      }
    }
    
    // Schedule data
    if (retrievedData.schedule && retrievedData.schedule.length > 0) {
      prompt += `\n⏰ SCHEDULE (${retrievedData.schedule.length} items):\n`;
      retrievedData.schedule.forEach((s: any) => {
        const time = new Date(s.scheduled_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        prompt += `  • ${time} - ${s.time_label}`;
        if (s.duration_minutes) prompt += ` (${s.duration_minutes} min)`;
        if (s.responsible_role) prompt += ` | ${s.responsible_role}`;
        if (s.notes) prompt += `\n    Notes: ${s.notes}`;
        prompt += '\n';
      });
    }
    
    // Staffing data
    if (retrievedData.staffing && retrievedData.staffing.length > 0) {
      prompt += `\n👥 STAFFING (${retrievedData.staffing.length} roles):\n`;
      retrievedData.staffing.forEach((s: any) => {
        prompt += `  • ${s.role} x${s.qty}`;
        if (s.shift_start && s.shift_end) {
          const start = new Date(s.shift_start).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
          const end = new Date(s.shift_end).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
          prompt += ` | ${start}-${end}`;
        }
        if (s.hourly_rate) prompt += ` | £${s.hourly_rate}/hr`;
        if (s.notes) prompt += `\n    Notes: ${s.notes}`;
        prompt += '\n';
      });
    }
    
    // Equipment data
    if (retrievedData.equipment && retrievedData.equipment.length > 0) {
      prompt += `\n🔧 EQUIPMENT (${retrievedData.equipment.length} items):\n`;
      retrievedData.equipment.forEach((eq: any) => {
        prompt += `  • ${eq.category}: ${eq.item_name} x${eq.quantity}`;
        if (eq.hire_cost) prompt += ` - £${eq.hire_cost}`;
        if (eq.supplier) prompt += ` (${eq.supplier})`;
        prompt += '\n';
      });
    }
    
    prompt += `\n**━━━ END RETRIEVED DATA ━━━**\n`;
  }


  // Add response guidelines
  prompt += `
**How to Respond:**

FOR QUESTIONS (Most common):
- Chat naturally like a helpful colleague
- Keep it brief but friendly  
- Lead with the answer, not preamble

FOR MENU QUESTIONS:
- If menu data is in RETRIEVED DATA section, list the actual dishes by course
- Include allergens and descriptions when relevant
- Example: "The menu includes: Starters - Charred Octopus, Wood-Roast Aubergine; Mains - Roast Cod; Desserts - Churros"

FOR BEO/PDF REQUESTS:
- If BEO data is in RETRIEVED DATA section, output the actual PDF download URL from the data
- Make it clear and clickable by including the full https:// URL
- Provide version number and generation date
- Example: "Here's the BEO (Version 3, generated 29 Sep): https://xccidvoxhpgcnwinnyin.supabase.co/storage/v1/object/sign/..."

FOR SCHEDULE QUESTIONS:
- List times and activities from RETRIEVED DATA if available
- Format times in 24-hour UK format (e.g., 14:30)

FOR ACTIONS (When asked to DO something):
- Only return JSON when explicitly asked to CREATE, UPDATE, DELETE something
- Format: {"type": "action", "action": "action_name", "params": {...}, "reasoning": "why"}

**Response Examples:**
- "What's on the menu for the 28 Sep event?" → List actual dishes from RETRIEVED DATA
- "Send me the BEO for 2025002" → "Here's the BEO [link]"
- "What events are coming up?" → "You've got 2 events: [list from overview]"
- "Create a new event" → Return JSON action

**Keep in Mind:**
- Respect role permissions
- If event isn't clear, ask for clarification or offer recent events as choices
- Offer helpful next steps when appropriate

**Available Actions:**
${getAvailableActions(user?.role)}

**Current Page:**
${getPageContext(page)}
`;

  return prompt;
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
