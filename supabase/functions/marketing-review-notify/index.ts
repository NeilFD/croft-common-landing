import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PRIMARY = "Jen.Needham@crazybear.co.uk";
const BACKUP = "neil.fincham-dukes@crazybear.co.uk";
const FROM = "Bears Den <noreply@notify.crazybear.dev>";
const APP_URL = "https://www.croftcommontest.com";

type Action =
  | "review_requested"
  | "approved"
  | "rejected"
  | "changes_requested"
  | "comment_added";

interface Payload {
  postId: string;
  action: Action;
  note?: string;
  commentBody?: string;
  actorName?: string;
}

const headlines: Record<Action, string> = {
  review_requested: "Review requested",
  approved: "Post approved",
  rejected: "Post rejected",
  changes_requested: "Changes requested",
  comment_added: "New comment on a post in review",
};

const cta: Record<Action, string> = {
  review_requested: "Review Now",
  approved: "Open Post",
  rejected: "Open Post",
  changes_requested: "Open Post",
  comment_added: "Open Post",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { postId, action, note, commentBody, actorName }: Payload = await req.json();
    if (!postId || !action) {
      return new Response(JSON.stringify({ error: "postId and action required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: post } = await supabase
      .from("marketing_posts")
      .select("id,title,body,status,scheduled_at,property_tag,hashtags,cta_text,cta_url")
      .eq("id", postId)
      .maybeSingle();

    if (!post) {
      return new Response(JSON.stringify({ error: "Post not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const link = `${APP_URL}/management/marketing/calendar?post=${postId}`;
    const headline = headlines[action];
    const ctaLabel = cta[action];
    const title = post.title || "(untitled)";
    const bodySnippet = (post.body || "").slice(0, 280);
    const tags = (post.hashtags || []).slice(0, 8).map((h: string) => `#${h}`).join(" ");
    const scheduled = post.scheduled_at
      ? new Date(post.scheduled_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })
      : "Not scheduled";

    const noteBlock = note
      ? `<div style="margin:24px 0;padding:16px;border-left:4px solid #000;background:#f4f4f4;"><div style="font-size:11px;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;color:#555;">Reason</div><div style="font-size:14px;color:#000;white-space:pre-wrap;">${escapeHtml(note)}</div></div>`
      : "";

    const commentBlock = commentBody
      ? `<div style="margin:24px 0;padding:16px;border-left:4px solid #000;background:#f4f4f4;"><div style="font-size:11px;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;color:#555;">Comment${actorName ? " from " + escapeHtml(actorName) : ""}</div><div style="font-size:14px;color:#000;white-space:pre-wrap;">${escapeHtml(commentBody)}</div></div>`
      : "";

    const html = `<!doctype html><html><body style="margin:0;padding:0;background:#fff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#000;">
<div style="max-width:600px;margin:0 auto;padding:32px 24px;">
  <div style="background:#000;color:#fff;padding:28px 24px;text-align:center;">
    <div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;opacity:0.7;">Bears Den</div>
    <div style="font-size:28px;font-weight:900;letter-spacing:-0.5px;text-transform:uppercase;margin-top:8px;">${headline}</div>
  </div>

  <div style="padding:32px 4px 8px;">
    <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#555;margin-bottom:8px;">Post</div>
    <div style="font-size:20px;font-weight:700;margin-bottom:16px;">${escapeHtml(title)}</div>
    ${bodySnippet ? `<div style="font-size:14px;line-height:1.6;color:#222;white-space:pre-wrap;margin-bottom:16px;">${escapeHtml(bodySnippet)}${(post.body || "").length > 280 ? "…" : ""}</div>` : ""}
    ${tags ? `<div style="font-size:13px;color:#1d4ed8;margin-bottom:16px;">${escapeHtml(tags)}</div>` : ""}
    <div style="font-size:12px;color:#555;">Scheduled: <strong style="color:#000;">${scheduled}</strong></div>
    ${post.property_tag ? `<div style="font-size:12px;color:#555;margin-top:4px;">Property: <strong style="color:#000;text-transform:capitalize;">${escapeHtml(post.property_tag)}</strong></div>` : ""}
  </div>

  ${noteBlock}
  ${commentBlock}

  <div style="text-align:center;margin:36px 0 24px;">
    <a href="${link}" style="display:inline-block;background:#000;color:#fff;text-decoration:none;padding:16px 32px;font-weight:700;letter-spacing:2px;text-transform:uppercase;font-size:13px;">${ctaLabel}</a>
  </div>

  <div style="text-align:center;font-size:11px;color:#999;margin-top:32px;padding-top:24px;border-top:1px solid #eee;letter-spacing:1px;text-transform:uppercase;">
    Sign in required. Bears Den.
  </div>
</div>
</body></html>`;

    const subjectMap: Record<Action, string> = {
      review_requested: `Review requested: ${title}`,
      approved: `Approved: ${title}`,
      rejected: `Rejected: ${title}`,
      changes_requested: `Changes requested: ${title}`,
      comment_added: `New comment: ${title}`,
    };

    const result = await resend.emails.send({
      from: FROM,
      to: [PRIMARY],
      cc: [BACKUP],
      reply_to: BACKUP,
      subject: subjectMap[action],
      html,
    });

    console.log("marketing-review-notify sent", { postId, action, result });

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("marketing-review-notify error", err);
    return new Response(JSON.stringify({ error: err.message || "Failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

serve(handler);
