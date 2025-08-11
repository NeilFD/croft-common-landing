
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { generateAuthenticationOptions } from "npm:@simplewebauthn/server@10.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function base64urlToUint8Array(base64url: string): Uint8Array {
  const padding = '='.repeat((4 - (base64url.length % 4)) % 4);
  const base64 = (base64url.replace(/-/g, '+').replace(/_/g, '/')) + padding;
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

function normalizeRpId(hostname: string): string {
  return hostname.replace(/^www\./, '');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    const { userHandle, rpId, origin, discoverable } = await req.json();
    if (!userHandle) throw new Error('Missing userHandle');

    const url = new URL(req.url);
    const effectiveOrigin = origin ?? req.headers.get('origin') ?? `${url.protocol}//${url.host}`;
    const hostForRp = rpId ?? new URL(effectiveOrigin).hostname;
    const effectiveRpId = normalizeRpId(hostForRp);

    // Only consider credentials saved for this RP ID (domain)
    const { data: creds } = await supabase
      .from('webauthn_credentials')
      .select('credential_id, transports')
      .eq('user_handle', userHandle)
      .eq('rp_id', effectiveRpId);

    if (!creds || creds.length === 0) {
      return new Response(JSON.stringify({ error: 'no_credentials' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Build allowCredentials without forcing transports; allow browser to choose best
    const allowCredentials = creds.map((c: any) => ({
      id: c.credential_id,
      type: 'public-key' as const,
    }));

    console.log('webauthn-auth-options', {
      rpId: effectiveRpId,
      origin: effectiveOrigin,
      allowCount: allowCredentials.length,
      discoverable: !!discoverable,
    });

    const baseOpts: any = {
      rpID: effectiveRpId,
      userVerification: 'required',
    };

    if (!discoverable) {
      baseOpts.allowCredentials = allowCredentials;
    }

    const options = await generateAuthenticationOptions(baseOpts);

    await supabase
      .from('webauthn_challenges')
      .insert({ user_handle: userHandle, type: 'authentication', challenge: options.challenge })
      .throwOnError();

    return new Response(JSON.stringify({ options, rpId: effectiveRpId, origin: effectiveOrigin }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error('webauthn-auth-options error', error);
    return new Response(JSON.stringify({ error: String(error?.message ?? error) }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
