// SEO audit edge function
// POST { route?: string, all?: boolean, source?: 'manual' | 'scheduled' }
// - Validates the seo_pages row (title/description/image present and right length)
// - Verifies the route returns 200 and og_image resolves
// - Runs Google PageSpeed Insights for real Lighthouse scores (perf/seo/a11y/best-practices + CWV)
// - Writes a row to seo_audits per route
// Auth: requires admin (verified via is_admin RPC against the caller's JWT)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SITE_BASE = "https://www.crazybear.dev";

const FALLBACK_SEO: Record<string, { title: string; description: string; og_image?: string }> = {
  "/": { title: "The Crazy Bear | Country & Town", description: "The Crazy Bear. Two hotels, one spirit. Country in Stadhampton, Town in Beaconsfield." },
  "/about": { title: "About | The Crazy Bear", description: "Born in 1993. Two hotels, one spirit. The story of The Crazy Bear at Stadhampton and Beaconsfield." },
  "/house-rules": { title: "House Rules | The Crazy Bear", description: "The Crazy Bear house rules. How to behave, dress and disappear." },
  "/bears-den": { title: "The Bear's Den | The Crazy Bear", description: "A quiet members' room at The Crazy Bear. Town and Country." },
  "/curious": { title: "Curious? | Crazy Bear", description: "Ask the Bear. Rooms, dining, members, events, or just a hello." },
  "/country": { title: "Crazy Bear Country | Crazy Bear Country", description: "Crazy Bear Country. 16th century inn in Stadhampton, Oxfordshire. Rooms, restaurants, a pub that refuses to behave." },
  "/country/pub": { title: "The Country Pub | Crazy Bear", description: "Real ale, proper food, fires lit. The pub at Crazy Bear Country, Stadhampton." },
  "/country/pub/food": { title: "Country Pub Food | Crazy Bear", description: "Pub food, properly done. Lunch and dinner every day at Crazy Bear Country." },
  "/country/pub/drink": { title: "Drink | Crazy Bear Country", description: "Real ale, proper wine, cocktails that bite back. The bar at Crazy Bear Country." },
  "/country/pub/hospitality": { title: "Hospitality | Crazy Bear Country", description: "Fires lit. Doors open. Country pub hospitality at Crazy Bear, Stadhampton." },
  "/country/rooms": { title: "Rooms | Crazy Bear Country", description: "Bedrooms at Crazy Bear Country. Theatrical, indulgent, never the same twice." },
  "/country/rooms/types": { title: "Room Types | Crazy Bear Country", description: "Room types at Crazy Bear Country. Pick your character. Sleep accordingly." },
  "/country/rooms/gallery": { title: "Bedroom Gallery | Crazy Bear Country", description: "Bedroom gallery at Crazy Bear Country, Stadhampton. Theatrical, indulgent, never the same twice." },
  "/country/parties": { title: "Parties | Crazy Bear Country", description: "Parties at Crazy Bear Country. Loud, long, late. Group bookings and exclusive use." },
  "/country/events": { title: "Events | Crazy Bear Country", description: "Events at Crazy Bear Country. Private rooms, marquee, exclusive use." },
  "/country/events/weddings": { title: "Weddings | Crazy Bear Country", description: "Weddings at Crazy Bear Country. Vows, dinner, dancing. Licensed for ceremonies." },
  "/country/events/birthdays": { title: "Birthdays | Crazy Bear Country", description: "Birthday parties at Crazy Bear Country. From long tables to whole house hire." },
  "/country/events/business": { title: "Business | Crazy Bear Country", description: "Business meetings and away days at Crazy Bear Country. Private rooms, dinner, rooms." },
  "/country/culture": { title: "Country Culture | The Crazy Bear, Stadhampton", description: "Country culture. Turf floors, a cow in the dining room, roll-top baths and thirty years of long Sundays in Stadhampton, Oxfordshire." },
  "/town": { title: "Crazy Bear Town | Crazy Bear Town", description: "Crazy Bear Town. Beaconsfield townhouse. Three restaurants, cocktails, signature rooms, hidden pool." },
  "/town/food": { title: "Food | Crazy Bear Town", description: "Food at Crazy Bear Town. The Black Bear, the B&B and Hom Thai." },
  "/town/food/black-bear": { title: "The Black Bear | Crazy Bear", description: "Modern British plates, charcoal and fire. The Black Bear restaurant at Crazy Bear Town." },
  "/town/food/bnb": { title: "The B&B | Crazy Bear", description: "All day kitchen. Breakfast, brunch and into the night, at Crazy Bear Town." },
  "/town/food/hom-thai": { title: "Hom Thai | Crazy Bear Town", description: "Hom Thai at Crazy Bear Town. Bangkok by way of Beaconsfield. Sharp, fragrant, fierce." },
  "/town/drink": { title: "Drink | Crazy Bear Town", description: "Bars at Crazy Bear Town. Mirrored rooms, low light, sharp pours." },
  "/town/drink/cocktails": { title: "Cocktails | Crazy Bear Town", description: "Cocktail bar at Crazy Bear Town. Stirred with intent. Served without apology." },
  "/town/rooms": { title: "Rooms | Crazy Bear Town", description: "Rooms at Crazy Bear Town. Velvet, mirror, marble. Each one its own world." },
  "/town/rooms/types": { title: "Room Types | Crazy Bear Town", description: "Room types at Crazy Bear Town. Each one its own world." },
  "/town/rooms/gallery": { title: "Bedroom Gallery | Crazy Bear Town", description: "Bedroom gallery at Crazy Bear Town, Beaconsfield. Velvet, mirror, marble. Each bedroom its own world." },
  "/town/pool": { title: "Pool | Crazy Bear Town", description: "The hidden pool at Crazy Bear Town. Heated, daytime, hotel guests only." },
  "/town/culture": { title: "Town Culture | The Crazy Bear, Beaconsfield", description: "Town culture. Koi behind the cisterns, Hom Thai upstairs, silver, gold and copper leaf and late nights in Beaconsfield." },
};

interface Check {
  id: string;
  label: string;
  status: "pass" | "warn" | "fail";
  message: string;
}

interface SeoPage {
  route: string;
  title: string | null;
  description: string | null;
  og_image: string | null;
  noindex: boolean;
}

function gradeFor(score: number): string {
  if (score >= 95) return "A+";
  if (score >= 90) return "A";
  if (score >= 85) return "A-";
  if (score >= 80) return "B+";
  if (score >= 75) return "B";
  if (score >= 70) return "B-";
  if (score >= 65) return "C+";
  if (score >= 60) return "C";
  if (score >= 55) return "C-";
  if (score >= 50) return "D";
  return "F";
}

async function internalScan(
  page: SeoPage,
  defaults: { default_og_image: string }
): Promise<{ score: number; checks: Check[]; ogImageOk: boolean; pageOk: boolean }> {
  const checks: Check[] = [];
  const url = `${SITE_BASE}${page.route}`;
  const fallback = FALLBACK_SEO[page.route];

  // Title
  const title = (page.title || fallback?.title || "").trim();
  if (!title) {
    checks.push({ id: "title", label: "Page title", status: "fail", message: "No page title set. Search engines and social shares need this." });
  } else if (title.length < 30) {
    checks.push({ id: "title", label: "Page title", status: "warn", message: `Title is short (${title.length} chars). Aim for 30–60 to use the space Google gives you.` });
  } else if (title.length > 60) {
    checks.push({ id: "title", label: "Page title", status: "warn", message: `Title is long (${title.length} chars). Google will cut it off after 60.` });
  } else {
    checks.push({ id: "title", label: "Page title", status: "pass", message: `${title.length} characters. Good length.` });
  }

  // Description
  const desc = (page.description || fallback?.description || "").trim();
  if (!desc) {
    checks.push({ id: "description", label: "Description", status: "fail", message: "No description set. This is the grey snippet under the title in Google." });
  } else if (desc.length < 70) {
    checks.push({ id: "description", label: "Description", status: "warn", message: `Description is short (${desc.length} chars). Aim for 70–160.` });
  } else if (desc.length > 160) {
    checks.push({ id: "description", label: "Description", status: "warn", message: `Description is long (${desc.length} chars). Google will cut it off after 160.` });
  } else {
    checks.push({ id: "description", label: "Description", status: "pass", message: `${desc.length} characters. Good length.` });
  }

  // Sharing image
  const ogImage = page.og_image || fallback?.og_image || defaults.default_og_image;
  let ogImageOk = false;
  if (!ogImage) {
    checks.push({ id: "og_image", label: "Sharing image", status: "fail", message: "No image set for WhatsApp / Facebook / iMessage previews." });
  } else {
    const fullImg = ogImage.startsWith("http") ? ogImage : `${SITE_BASE}${ogImage}`;
    try {
      const r = await fetch(fullImg, { method: "HEAD" });
      if (r.ok) {
        ogImageOk = true;
        checks.push({ id: "og_image", label: "Sharing image", status: "pass", message: "Image loads correctly." });
      } else {
        checks.push({ id: "og_image", label: "Sharing image", status: "fail", message: `Image returned ${r.status}. Pick a different image.` });
      }
    } catch {
      checks.push({ id: "og_image", label: "Sharing image", status: "fail", message: "Image could not be loaded." });
    }
  }

  // Noindex
  if (page.noindex) {
    checks.push({ id: "noindex", label: "Indexing", status: "warn", message: "This page is set to hide from Google. If that's wrong, untick 'Hide from Google'." });
  } else {
    checks.push({ id: "noindex", label: "Indexing", status: "pass", message: "Page is allowed in Google search." });
  }

  // Page reachable
  let pageOk = false;
  try {
    const r = await fetch(url, { method: "GET", redirect: "follow" });
    if (r.ok) {
      pageOk = true;
      checks.push({ id: "reachable", label: "Page loads", status: "pass", message: "Live page returns 200 OK." });
    } else {
      checks.push({ id: "reachable", label: "Page loads", status: "fail", message: `Live page returned ${r.status}.` });
    }
  } catch {
    checks.push({ id: "reachable", label: "Page loads", status: "fail", message: "Live page could not be loaded." });
  }

  // Score = weighted pass count
  const weights: Record<string, number> = {
    title: 25, description: 25, og_image: 20, reachable: 20, noindex: 10,
  };
  let max = 0, got = 0;
  for (const c of checks) {
    const w = weights[c.id] ?? 5;
    max += w;
    if (c.status === "pass") got += w;
    else if (c.status === "warn") got += w * 0.6;
  }
  const score = Math.round((got / max) * 100);

  return { score, checks, ogImageOk, pageOk };
}

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

async function pagespeed(url: string, apiKey: string | null) {
  const params = new URLSearchParams({
    url,
    strategy: "mobile",
  });
  for (const c of ["performance", "seo", "accessibility", "best-practices"]) {
    params.append("category", c);
  }
  if (apiKey) params.set("key", apiKey);
  const endpoint = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${params.toString()}`;

  // Retry with exponential backoff for 429 / 5xx so transient rate limits
  // don't get persisted as fake "Lighthouse failed" results.
  const maxAttempts = 4;
  let lastStatus = 0;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const r = await fetch(endpoint);
    if (r.ok) {
      const j = await r.json();
      return parsePagespeed(j);
    }
    lastStatus = r.status;
    const retryable = r.status === 429 || r.status >= 500;
    if (!retryable || attempt === maxAttempts) {
      throw new Error(`PageSpeed ${r.status}`);
    }
    // Backoff: 4s, 8s, 16s
    await sleep(4000 * Math.pow(2, attempt - 1));
  }
  throw new Error(`PageSpeed ${lastStatus}`);
}

function parsePagespeed(j: any) {
  const cats = j.lighthouseResult?.categories ?? {};
  const audits = j.lighthouseResult?.audits ?? {};
  return {
    perf: Math.round((cats.performance?.score ?? 0) * 100),
    seo: Math.round((cats.seo?.score ?? 0) * 100),
    a11y: Math.round((cats.accessibility?.score ?? 0) * 100),
    bp: Math.round((cats["best-practices"]?.score ?? 0) * 100),
    lcp: Math.round(audits["largest-contentful-paint"]?.numericValue ?? 0),
    cls: Number(audits["cumulative-layout-shift"]?.numericValue ?? 0),
    inp: Math.round(
      audits["interaction-to-next-paint"]?.numericValue ??
        audits["experimental-interaction-to-next-paint"]?.numericValue ??
        0
    ),
  };
}

async function auditOne(
  supabase: ReturnType<typeof createClient>,
  route: string,
  defaults: { default_og_image: string },
  apiKey: string | null,
  source: string
) {
  const { data: pageRow } = await supabase
    .from("seo_pages")
    .select("route,title,description,og_image,noindex")
    .eq("route", route)
    .maybeSingle();

  const page: SeoPage = (pageRow as SeoPage) ?? {
    route,
    title: null,
    description: null,
    og_image: null,
    noindex: false,
  };

  const internal = await internalScan(page, defaults);

  let perf: number | null = null;
  let seo: number | null = null;
  let a11y: number | null = null;
  let bp: number | null = null;
  let lcp: number | null = null;
  let cls: number | null = null;
  let inp: number | null = null;
  let psError: string | null = null;

  try {
    const r = await pagespeed(`${SITE_BASE}${route}`, apiKey);
    perf = r.perf; seo = r.seo; a11y = r.a11y; bp = r.bp;
    lcp = r.lcp; cls = r.cls; inp = r.inp;
  } catch (e) {
    psError = (e as Error).message;
  }

  // Combined overall: 40% internal + 60% Lighthouse average.
  // If Lighthouse fails, keep the score empty so the dashboard never presents
  // an internal-only fallback as a real SEO performance result.
  let overall: number | null = null;
  if (perf !== null && seo !== null && a11y !== null && bp !== null) {
    const lhAvg = (perf + seo + a11y + bp) / 4;
    overall = Math.round(internal.score * 0.4 + lhAvg * 0.6);
  }

  const audit = {
    route,
    source,
    internal_score: internal.score,
    internal_checks: internal.checks,
    perf_score: perf,
    seo_score: seo,
    accessibility_score: a11y,
    best_practices_score: bp,
    lcp_ms: lcp,
    cls,
    inp_ms: inp,
    overall_score: overall,
    overall_grade: overall === null ? null : gradeFor(overall),
    error: psError,
  };

  const { error } = await supabase.from("seo_audits").insert(audit);
  if (error) throw error;
  return audit;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify caller is admin using their JWT
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userRes } = await userClient.auth.getUser();
    if (!userRes?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const adminCheck = await userClient.rpc("is_admin", { uid: userRes.user.id });
    if (!adminCheck.data) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role for writes to bypass any RLS edge cases
    const admin = createClient(supabaseUrl, serviceKey);

    const body = await req.json().catch(() => ({}));
    const { route, all, source = "manual" } = body as { route?: string; all?: boolean; source?: string };

    const apiKey = Deno.env.get("GOOGLE_PAGESPEED_API_KEY") ?? null;

    const { data: settings } = await admin
      .from("seo_settings")
      .select("default_og_image")
      .eq("id", 1)
      .maybeSingle();
    const defaults = {
      default_og_image: (settings as any)?.default_og_image ?? "/brand/logo.png",
    };

    let routes: string[] = [];
    if (all) {
      const { data } = await admin.from("seo_pages").select("route");
      routes = (data ?? []).map((r: any) => r.route as string);
    } else if (route) {
      routes = [route];
    } else {
      return new Response(JSON.stringify({ error: "Provide route or all:true" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: any[] = [];
    const errors: any[] = [];

    // Process sequentially to avoid hammering PageSpeed
    for (const r of routes) {
      try {
        const a = await auditOne(admin, r, defaults, apiKey, source);
        results.push({ route: r, overall: a.overall_score, grade: a.overall_grade, error: a.error });
      } catch (e) {
        errors.push({ route: r, error: (e as Error).message });
      }
    }

    return new Response(JSON.stringify({ ok: true, results, errors }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
