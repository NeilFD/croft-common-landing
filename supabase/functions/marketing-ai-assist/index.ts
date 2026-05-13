import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const VOICE = `You are writing for 'The Crazy Bear', voice = 'Bears Den': bold, irreverent, short, staccato, confident, minimal copy. British English only. Never use em dashes or double hyphens. Never invent prices or facts. Never use Americanisms. Currency £ only.`;

const CHANNEL_HINTS: Record<string, string> = {
  instagram: "Tone: visual-led, 1-3 short lines, hashtags optional, emoji sparingly.",
  tiktok: "Tone: punchy hook in line one, casual.",
  facebook: "Tone: warm, slightly longer, conversational.",
  x: "Hard limit 280 chars, single tight line, witty.",
  linkedin: "Tone: confident, professional, no hype, 2-4 short paragraphs.",
  email: "Output a subject line then a 2-3 sentence preheader-friendly intro.",
  website: "Tone: editorial, scannable, headline + 2 short paragraphs.",
};

const ACTIONS: Record<string, (body: string, channel: string) => string> = {
  caption: (b, c) =>
    `${VOICE}\n\nWrite a fresh ${c} caption for the post idea below. Keep it under 80 words. ${CHANNEL_HINTS[c] || ""}\n\nIdea:\n${b || "(no draft yet, invent something on-brand)"}`,
  rewrite: (b, c) =>
    `${VOICE}\n\nRewrite the copy below for ${c}. ${CHANNEL_HINTS[c] || ""} Return only the rewritten copy, no preamble.\n\nCopy:\n${b}`,
  shorten: (b, c) =>
    `${VOICE}\n\nShorten the copy below to its sharpest form for ${c}. Keep meaning. Return only the result.\n\nCopy:\n${b}`,
  hashtags: (b) =>
    `${VOICE}\n\nSuggest 8 to 12 hashtags for the post below. Return as a single line of space separated hashtags, no commentary.\n\nPost:\n${b}`,
  alt_text: (b) =>
    `${VOICE}\n\nWrite a single concise image alt text (max 120 chars) for the post below. Return only the alt text.\n\nPost:\n${b}`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const { action, body, channel } = await req.json();
    const ch = (channel || "instagram").toLowerCase();
    const builder = ACTIONS[action];
    if (!builder) throw new Error(`Unknown action: ${action}`);

    const prompt = builder(body || "", ch);

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: VOICE },
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
