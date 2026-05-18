// cb-journal-ai-write — Bear's Den AI writing assistant for the CMS.
// Admin-only. Generates drafts, rewrites, tightens, expands, or SEO meta.
// Enforces British English and strips em dashes / double hyphens server-side.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Mode = "draft" | "rewrite" | "tighten" | "expand" | "seo";

interface Body {
  mode: Mode;
  input: string;
  title?: string;
  targetWords?: number;
  targetMinutes?: number;
  tone?: string;
  model?: string;
}

const VOICE = `You are a copywriter for Crazy Bear, an irreverent British country-house hotel group.
The brand voice is 'Bears Den': short sentences, staccato, confident, dry wit, never corporate.
You are writing for the Journal — a blog of food, music, mischief, and the occasional manifesto.

HARD RULES (non-negotiable):
- British English spellings only. organise, colour, theatre, realise, traveller, behaviour, programme, jewellery, defence, licence, kerb, grey.
- Never use American spellings (no "organize", "color", "theater", etc.).
- Never use em dashes (—) or en dashes (–) or double hyphens (--). Use a comma, full stop, semicolon, or colon instead.
- Never use emoji.
- Never use the £ symbol as decoration; only with a real price.
- No corporate filler: no "in today's fast-paced world", no "delve into", no "elevate".
- Vary sentence length. Short. Then a longer one when it earns it.
- Prefer concrete nouns over adjectives.

Output plain HTML using only <h2>, <h3>, <p>, <ul>, <ol>, <li>, <strong>, <em>, <a>, <blockquote>. No <div>, no inline styles, no scripts.`;

function stripBadCharacters(text: string): string {
  // Remove em/en dashes and double hyphens, replace with appropriate punctuation
  let out = text
    .replace(/\s*[—–]\s*/g, ", ")
    .replace(/(?<!<)--+(?!>)/g, ", ");

  // Convert common American spellings to British
  const swaps: Array<[RegExp, string]> = [
    [/\borganiz(e|es|ed|ing|ation|ations|er|ers)\b/g, "organis$1"],
    [/\brealiz(e|es|ed|ing|ation)\b/g, "realis$1"],
    [/\bcolor(s|ed|ing|ful)?\b/g, (_m, s = "") => "colour" + s],
    [/\bflavor(s|ed|ing|ful)?\b/g, (_m, s = "") => "flavour" + s],
    [/\bhonor(s|ed|ing|able)?\b/g, (_m, s = "") => "honour" + s],
    [/\bneighbor(s|hood|ing|ly)?\b/g, (_m, s = "") => "neighbour" + s],
    [/\bbehavior(s|al)?\b/g, (_m, s = "") => "behaviour" + s],
    [/\bfavorite(s)?\b/g, (_m, s = "") => "favourite" + s],
    [/\btheater(s)?\b/g, (_m, s = "") => "theatre" + s],
    [/\bcenter(s|ed|ing)?\b/g, (_m, s = "") => "centre" + s],
    [/\btraveler(s)?\b/g, (_m, s = "") => "traveller" + s],
    [/\bcanceled\b/g, "cancelled"],
    [/\bcanceling\b/g, "cancelling"],
    [/\bcheck mark\b/gi, "tick"],
  ];
  for (const [re, rep] of swaps) {
    // @ts-ignore allow function replacer
    out = out.replace(re, rep as any);
  }

  // Strip emoji (most common ranges)
  out = out.replace(
    /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F000}-\u{1F2FF}]/gu,
    "",
  );

  return out;
}

function buildUserPrompt(b: Body): string {
  const length = b.targetWords
    ? `Target length: about ${b.targetWords} words (±10%).`
    : b.targetMinutes
    ? `Target length: about ${Math.round(b.targetMinutes * 200)} words (~${b.targetMinutes} minute read at 200 wpm). Stay within ±10%.`
    : "Target length: 500 words.";

  const tone = b.tone ? `Tone override: ${b.tone}.` : "";
  const title = b.title ? `Working title: "${b.title}".` : "";

  switch (b.mode) {
    case "draft":
      return `${title}\n${length}\n${tone}\n\nWrite a Journal post from this brief. Open with a hook, never a summary. End with something that lingers.\n\nBrief:\n${b.input}`;
    case "rewrite":
      return `${tone}\nRewrite the following in the Bear's Den voice without changing the meaning. Keep roughly the same length.\n\nText:\n${b.input}`;
    case "tighten":
      return `Tighten the following. Cut filler. Keep every concrete detail. Aim for 25-40% shorter.\n\nText:\n${b.input}`;
    case "expand":
      return `${length}\nExpand the following with vivid concrete detail in the Bear's Den voice. Do not pad.\n\nText:\n${b.input}`;
    case "seo":
      return `From the following article, produce exactly this JSON object and nothing else:
{
  "seo_title": "max 60 chars, compelling, includes the main topic",
  "seo_description": "max 158 chars, reads like a sentence, makes you click",
  "excerpt": "1-2 sentences, max 220 chars, sets up the piece without spoiling it"
}
No code fences. No commentary. JSON only.

Article:
${b.input}`;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const sb = createClient(supabaseUrl, anon, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await sb.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Admin check
    const { data: roleCheck } = await sb.rpc("has_management_role", {
      _user_id: user.id,
      _role: "admin",
    });
    const { data: superCheck } = await sb.rpc("has_management_role", {
      _user_id: user.id,
      _role: "super_admin",
    });
    if (!roleCheck && !superCheck) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as Body;
    if (!body?.mode || !body?.input) {
      return new Response(JSON.stringify({ error: "mode and input are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const model = body.model || "google/gemini-2.5-flash";
    const userPrompt = buildUserPrompt(body);

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: VOICE },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    if (aiResp.status === 429) {
      return new Response(
        JSON.stringify({ error: "AI is busy. Try again in a moment." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (aiResp.status === 402) {
      return new Response(
        JSON.stringify({ error: "AI credits exhausted. Top up in workspace settings." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (!aiResp.ok) {
      const detail = await aiResp.text();
      return new Response(
        JSON.stringify({ error: "AI request failed", detail }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await aiResp.json();
    const raw = data.choices?.[0]?.message?.content ?? "";
    const cleaned = stripBadCharacters(raw);

    if (body.mode === "seo") {
      // Try to parse JSON from the cleaned response
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (!match) {
        return new Response(
          JSON.stringify({ error: "Could not parse SEO JSON", raw: cleaned }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      try {
        const parsed = JSON.parse(match[0]);
        return new Response(JSON.stringify(parsed), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch {
        return new Response(
          JSON.stringify({ error: "Invalid SEO JSON", raw: cleaned }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    // Count words for the editor
    const words = cleaned.replace(/<[^>]+>/g, " ").trim().split(/\s+/).filter(Boolean).length;
    return new Response(
      JSON.stringify({ content: cleaned, words, model }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
