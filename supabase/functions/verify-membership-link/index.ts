import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    const { userHandle, email, code } = await req.json();
    if (!email || !code) {
      return new Response(JSON.stringify({ error: 'missing_params' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const normEmail = String(email).trim().toLowerCase();

    const nowIso = new Date().toISOString();
    
    // Find code by email and code first
    const { data: codeRow, error: codeErr } = await supabase
      .from('membership_codes')
      .select('id, user_handle')
      .eq('email', normEmail)
      .eq('code', String(code))
      .eq('consumed', false)
      .gt('expires_at', nowIso)
      .order('created_at', { ascending: false })
      .maybeSingle();

    if (codeErr) throw codeErr;
    if (!codeRow) {
      return new Response(JSON.stringify({ error: 'invalid_or_expired_code' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { error: updErr } = await supabase
      .from('membership_codes')
      .update({ consumed: true })
      .eq('id', codeRow.id);
    if (updErr) throw updErr;

    // Use the userHandle from the request or from the stored code row
    const finalUserHandle = userHandle || codeRow.user_handle;
    
    const { error: upsertErr } = await supabase
      .from('membership_links')
      .upsert({ user_handle: finalUserHandle, email: normEmail, is_verified: true, verified_at: new Date().toISOString() }, { onConflict: 'user_handle' });
    if (upsertErr) throw upsertErr;

    return new Response(JSON.stringify({ ok: true, userHandle: finalUserHandle }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('verify-membership-link error', e);
    return new Response(JSON.stringify({ error: 'server_error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
