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

  // Title
  const title = page.title?.trim();
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
  const desc = page.description?.trim();
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
  const ogImage = page.og_image || defaults.default_og_image;
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
  const r = await fetch(endpoint);
  if (!r.ok) {
    throw new Error(`PageSpeed ${r.status}`);
  }
  const j = await r.json();
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

  // Combined overall: 40% internal + 60% lighthouse-average (when present)
  let overall = internal.score;
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
    overall_grade: gradeFor(overall),
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
        results.push({ route: r, overall: a.overall_score, grade: a.overall_grade });
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
