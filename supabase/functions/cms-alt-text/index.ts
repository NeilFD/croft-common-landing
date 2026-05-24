// Generates concise SEO/accessibility alt text for a CMS image using Lovable AI vision.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_KEY = Deno.env.get("LOVABLE_API_KEY");

const SYSTEM = `You write alt text for Crazy Bear (a boutique hotel + pub group) website images.
Rules:
- British English. No American spellings. No em dashes.
- 6 to 14 words. One short phrase. No trailing full stop.
- Describe what is visible. No "image of" / "photo of".
- No clichés (nestled, indulge, discover, unwind, experience).
- Sensory and specific where the image allows.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST")
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });

  if (!LOVABLE_KEY)
    return new Response(JSON.stringify({ error: "LOVABLE_API_KEY missing" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  let body: any;
  try { body = await req.json(); } catch {
    return new Response(JSON.stringify({ error: "Bad JSON" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const imageUrl: string = body.imageUrl;
  const context: string = body.context ?? "";
  if (!imageUrl) {
    return new Response(JSON.stringify({ error: "imageUrl required" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${LOVABLE_KEY}` },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content: [
            { type: "text", text: `Context: ${context || "Crazy Bear website carousel"}\nReturn only the alt text, nothing else.` },
            { type: "image_url", image_url: { url: imageUrl } },
          ],
        },
      ],
    }),
  });

  if (!aiRes.ok) {
    const txt = await aiRes.text();
    const status = aiRes.status === 429 || aiRes.status === 402 ? aiRes.status : 500;
    return new Response(JSON.stringify({ error: txt || "AI error" }), {
      status, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const json = await aiRes.json();
  const raw: string = json?.choices?.[0]?.message?.content ?? "";
  const altText = raw.trim().replace(/^["']|["']$/g, "").replace(/\.$/, "").slice(0, 160);

  return new Response(JSON.stringify({ altText }), {
    status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
