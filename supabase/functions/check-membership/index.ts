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
    const { userHandle } = await req.json();
    if (!userHandle) {
      return new Response(JSON.stringify({ error: 'missing_params' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: link, error: linkErr } = await supabase
      .from('membership_links')
      .select('email, is_verified')
      .eq('user_handle', userHandle)
      .maybeSingle();

    if (linkErr) throw linkErr;

    if (!link || !link.is_verified) {
      return new Response(JSON.stringify({ linked: false }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const normEmail = String(link.email).trim().toLowerCase();
    const { data: sub, error: subErr } = await supabase
      .from('subscribers')
      .select('id, is_active')
      .eq('email', normEmail)
      .eq('is_active', true)
      .maybeSingle();

    if (subErr) throw subErr;
    if (!sub) {
      return new Response(JSON.stringify({ linked: false, reason: 'not_subscribed' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ linked: true, email: normEmail }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('check-membership error', e);
    return new Response(JSON.stringify({ error: 'server_error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
