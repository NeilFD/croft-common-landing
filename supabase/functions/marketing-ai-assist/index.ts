import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const FALLBACK_VOICE = `You are writing for 'The Crazy Bear', voice = 'Bears Den': bold, irreverent, short, staccato, confident, minimal copy. British English only. Never use em dashes or double hyphens. Never invent prices or facts. Never use Americanisms. Currency £ only.`;

const FALLBACK_HINTS: Record<string, string> = {
  instagram: "Tone: visual-led, 1-3 short lines, hashtags optional, emoji sparingly.",
  tiktok: "Tone: punchy hook in line one, casual.",
  facebook: "Tone: warm, slightly longer, conversational.",
  x: "Hard limit 280 chars, single tight line, witty.",
  linkedin: "Tone: confident, professional, no hype, 2-4 short paragraphs.",
  email: "Output a subject line then a 2-3 sentence preheader-friendly intro.",
  website: "Tone: editorial, scannable, headline + 2 short paragraphs.",
};

async function loadSettings(): Promise<{ voice: string; hints: Record<string, string> }> {
  try {
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) return { voice: FALLBACK_VOICE, hints: FALLBACK_HINTS };
    const sb = createClient(url, key);
    const { data } = await sb
      .from("marketing_settings")
      .select("voice_prompt, channel_hints")
      .eq("key", "default")
      .maybeSingle();
    if (!data) return { voice: FALLBACK_VOICE, hints: FALLBACK_HINTS };
    return {
      voice: data.voice_prompt || FALLBACK_VOICE,
      hints: { ...FALLBACK_HINTS, ...((data.channel_hints || {}) as Record<string, string>) },
    };
  } catch (_e) {
    return { voice: FALLBACK_VOICE, hints: FALLBACK_HINTS };
  }
}

const CMS_RULES = `
Hard rules for CMS website copy:
- British English only. Never American spellings. Currency £ only, never $.
- Never use em dashes or double hyphens. Use full stops or commas.
- Never invent prices, dates, room counts or facts not provided.
- Never use the term "membership tiers" (we don't have them). The members club is called "Bears Den". The paid subscription is "Bear's Den Gold" at £69/month.
- Voice = Bears Den: short, staccato, confident, minimal. No corporate filler. No exclamation marks unless punchy.
- No emojis, no hashtags, no markdown. Plain text only.
- Return ONLY the finished copy. No preamble, no quotes, no labels, no explanation.
`;

const KIND_RULES: Record<string, string> = {
  title: "Format: a single line, max 6 words, sentence case or ALL CAPS if the existing copy is ALL CAPS. No trailing punctuation.",
  eyebrow: "Format: 1 to 3 words, ALL CAPS, no punctuation. A label that sits above a headline.",
  intro: "Format: 1 to 2 short sentences, max 30 words total. Sits under a hero headline.",
  body: "Format: 2 to 4 short sentences or 1 to 2 tight paragraphs. Max ~80 words.",
  cta: "Format: a button label. Max 4 words. Imperative voice (e.g. Book a table, See rooms).",
  legal: "Format: plain, factual, neutral British English. No brand flourish. Keep accurate and clear.",
  label: "Format: 1 to 4 words. Sentence case. No punctuation.",
};

function buildCmsPrompt(
  voice: string,
  ctx: {
    page: string;
    section: string;
    contentKey: string;
    pageTitle?: string;
    property?: string | null;
    currentText?: string;
    brief?: string;
    kind?: string;
  }
): string {
  const kind = (ctx.kind || "body").toLowerCase();
  const kindRule = KIND_RULES[kind] || KIND_RULES.body;
  const propertyLine = ctx.property === "country"
    ? "Property: Crazy Bear Country, Stadhampton. Countryside, log fires, dogs welcome, eccentric character."
    : ctx.property === "town"
    ? "Property: Crazy Bear Town, Beaconsfield. Urban, polished, design-led, livelier energy."
    : "Property: cross-site (applies to both Town and Country unless context says otherwise).";

  return `${voice}

${CMS_RULES}

You are writing one block of website copy for the Crazy Bear CMS.

Page: ${ctx.pageTitle || ctx.page} (slug: ${ctx.page})
Section: ${ctx.section}
Field: ${ctx.contentKey}
Field kind: ${kind}
${propertyLine}

${kindRule}

${ctx.brief ? `Editor brief: ${ctx.brief}\n` : ""}${ctx.currentText ? `Current copy (rewrite or replace):\n"""\n${ctx.currentText}\n"""` : "(No current copy. Write fresh.)"}

Now write the copy. Return only the finished copy.`;
}

const ACTIONS: Record<string, (voice: string, hints: Record<string, string>, body: string, channel: string) => string> = {
  caption: (v, h, b, c) =>
    `${v}\n\nWrite a fresh ${c} caption for the post idea below. Keep it under 80 words. ${h[c] || ""}\n\nIdea:\n${b || "(no draft yet, invent something on-brand)"}`,
  rewrite: (v, h, b, c) =>
    `${v}\n\nRewrite the copy below for ${c}. ${h[c] || ""} Return only the rewritten copy, no preamble.\n\nCopy:\n${b}`,
  shorten: (v, _h, b, c) =>
    `${v}\n\nShorten the copy below to its sharpest form for ${c}. Keep meaning. Return only the result.\n\nCopy:\n${b}`,
  hashtags: (v, _h, b) =>
    `${v}\n\nSuggest 8 to 12 hashtags for the post below. Return as a single line of space separated hashtags, no commentary.\n\nPost:\n${b}`,
  alt_text: (v, _h, b) =>
    `${v}\n\nWrite a single concise image alt text (max 120 chars) for the post below. Return only the alt text.\n\nPost:\n${b}`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const payload = await req.json();
    const { action } = payload;
    const { voice, hints } = await loadSettings();

    let prompt: string;
    if (action === "cms_copy") {
      prompt = buildCmsPrompt(voice, {
        page: payload.page || "",
        section: payload.section || "",
        contentKey: payload.contentKey || "",
        pageTitle: payload.pageTitle,
        property: payload.property,
        currentText: payload.currentText,
        brief: payload.brief,
        kind: payload.kind,
      });
    } else {
      const ch = (payload.channel || "instagram").toLowerCase();
      const builder = ACTIONS[action];
      if (!builder) throw new Error(`Unknown action: ${action}`);
      prompt = builder(voice, hints, payload.body || "", ch);
    }


    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: voice },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("AI gateway error", res.status, errText);
      if (res.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit reached, try again shortly" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (res.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted, top up Lovable workspace" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI service error: ${res.status}`);
    }

    const json = await res.json();
    const text = json?.choices?.[0]?.message?.content?.trim() || "";

    return new Response(JSON.stringify({ text }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("marketing-ai-assist error", e);
    return new Response(
      JSON.stringify({ error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
