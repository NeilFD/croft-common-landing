// SEO copywriter — pulls live page text and asks Lovable AI for
// title / description / keywords in Bears Den tone of voice.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SITE_BASE = "https://www.crazybear.dev";
const LOVABLE_KEY = Deno.env.get("LOVABLE_API_KEY");

const TOV = `Brand voice: 'Bears Den' — short, staccato, confident, minimal.
- British English only. Never American spellings. Never $; use £ if money appears.
- No em dashes, no double hyphens. Use a comma or full stop instead.
- No clichés (no "nestled", "discover", "unwind", "indulge", "experience").
- Write like the bear wrote it: punchy, present tense, sensory, specific.
- Crazy Bear is a boutique hotel + pub group. 'Town' = Beaconsfield. 'Country' = Stadhampton.
- Never mention "membership tiers". Bear's Den Gold is a £69/month thing only mention if relevant.`;

async function fetchPageText(route: string): Promise<string> {
  try {
    const r = await fetch(`${SITE_BASE}${route}`, {
      headers: { "User-Agent": "CrazyBearSEOBot/1.0" },
    });
    if (!r.ok) return "";
    const html = await r.text();
    // strip scripts/styles
    const cleaned = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ");
    // pull h1/h2/h3/p text
    const text = cleaned
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return text.slice(0, 6000);
  } catch {
    return "";
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST")
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });

  if (!LOVABLE_KEY) {
    return new Response(
      JSON.stringify({ error: "LOVABLE_API_KEY missing" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Bad JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const route: string = body.route;
  const label: string | undefined = body.label;
  const fields: string[] = body.fields ?? ["title", "description", "keywords"];
  const currentTitle: string = body.current?.title ?? "";
  const currentDescription: string = body.current?.description ?? "";

  if (!route || !route.startsWith("/")) {
    return new Response(JSON.stringify({ error: "route required, must start with /" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const pageText = await fetchPageText(route);

  const userPrompt = `Route: ${route}
Page label: ${label ?? "(none)"}
Current title: ${currentTitle || "(none)"}
Current description: ${currentDescription || "(none)"}

Live page content (truncated):
"""
${pageText || "(no live text could be fetched)"}
"""

Write SEO copy for this page that follows the Bears Den voice rules.
Return three things:
- title: 50-60 characters, includes the most important keyword naturally, never ends with a full stop.
- description: 140-160 characters, one or two short sentences, includes a soft hook, no clichés, no em dashes.
- keywords: 5-8 short keyword phrases, lowercase, no hashtags.

Keep it British. Keep it Crazy Bear.`;

  const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LOVABLE_KEY}`,
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: TOV },
        { role: "user", content: userPrompt },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "submit_seo_copy",
            description: "Submit SEO copy for this page",
            parameters: {
              type: "object",
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                keywords: { type: "array", items: { type: "string" } },
                rationale: { type: "string", description: "One sentence on why this works" },
              },
              required: ["title", "description", "keywords"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "submit_seo_copy" } },
    }),
  });

  if (!aiRes.ok) {
    const errText = await aiRes.text();
    if (aiRes.status === 429)
      return new Response(JSON.stringify({ error: "Rate limit, try again shortly." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    if (aiRes.status === 402)
      return new Response(
        JSON.stringify({ error: "AI credits exhausted. Add credits in Workspace settings." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    return new Response(JSON.stringify({ error: `AI error: ${errText}` }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const json = await aiRes.json();
  const call = json.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
  let parsed: any = {};
  try {
    parsed = call ? JSON.parse(call) : {};
  } catch {
    parsed = {};
  }

  // Filter to requested fields only
  const out: Record<string, any> = {};
  for (const f of fields) if (parsed[f] !== undefined) out[f] = parsed[f];
  if (parsed.rationale) out.rationale = parsed.rationale;

  return new Response(JSON.stringify(out), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
