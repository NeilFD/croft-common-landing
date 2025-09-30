import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function getQueryParam(url: string, key: string): string | null {
  try {
    const u = new URL(url);
    const v = u.searchParams.get(key);
    return v;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Accept fileName from query or JSON body
    let fileName = getQueryParam(req.url, "fileName");
    if (!fileName && (req.method === "POST" || req.method === "PUT")) {
      const body = await req.json().catch(() => ({}));
      fileName = body?.fileName || null;
      const pdfUrl: string | undefined = body?.pdfUrl;
      if (!fileName && pdfUrl) {
        const marker = "/beo-documents/";
        const idx = pdfUrl.indexOf(marker);
        if (idx !== -1) fileName = pdfUrl.substring(idx + marker.length);
      }
    }

    // Normalize fileName: decode, strip prefix, remove query params
    if (fileName) {
      try {
        fileName = decodeURIComponent(fileName);
      } catch (e) {
        // If decode fails, use as-is
      }
      // Strip /beo-documents/ prefix if present
      if (fileName.startsWith("/beo-documents/")) {
        fileName = fileName.substring("/beo-documents/".length);
      } else if (fileName.startsWith("beo-documents/")) {
        fileName = fileName.substring("beo-documents/".length);
      }
      // Remove query params like ?token=...
      const qIdx = fileName.indexOf("?");
      if (qIdx !== -1) {
        fileName = fileName.substring(0, qIdx);
      }
    }

    if (!fileName) {
      return new Response(JSON.stringify({ error: "Missing fileName" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Download from storage using service role
    const { data, error } = await supabase.storage
      .from("beo-documents")
      .download(fileName);

    if (error || !data) {
      console.error("proxy-beo-pdf download error:", error);
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // data is a Blob
    const arrayBuffer = await data.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    // Derive a safe filename for the header
    const safeName = fileName.split("/").pop() || "beo.pdf";

    return new Response(bytes, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/pdf",
        "Cache-Control": "private, max-age=60",
        "Content-Disposition": `inline; filename="${safeName}"`,
      },
    });
  } catch (e) {
    console.error("proxy-beo-pdf error:", e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
