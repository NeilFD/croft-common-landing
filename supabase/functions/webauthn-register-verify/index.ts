import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { verifyRegistrationResponse } from "npm:@simplewebauthn/server@10.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function toBase64Url(u8: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...u8));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    const { userHandle, attResp, rpId, origin } = await req.json();
    if (!userHandle || !attResp) throw new Error('Missing userHandle or attResp');

    const url = new URL(req.url);
    const expectedOrigin = origin ?? req.headers.get('origin') ?? `${url.protocol}//${url.host}`;
    const expectedRPID = rpId ?? new URL(expectedOrigin).hostname;

    // Load latest registration challenge
    const { data: challenges, error: chErr } = await supabase
      .from('webauthn_challenges')
      .select('*')
      .eq('user_handle', userHandle)
      .eq('type', 'registration')
      .order('created_at', { ascending: false })
      .limit(1);
    if (chErr) throw chErr;
    const challenge = challenges?.[0]?.challenge;
    if (!challenge) return new Response(JSON.stringify({ error: 'no_challenge' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const verification = await verifyRegistrationResponse({
      response: attResp,
      expectedChallenge: challenge,
      expectedOrigin,
      expectedRPID,
    });

    if (!verification.verified || !verification.registrationInfo) {
      return new Response(JSON.stringify({ verified: false }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { credentialID, credentialPublicKey, counter, credentialDeviceType, credentialBackedUp, credentialTransports } = verification.registrationInfo;

    await supabase.from('webauthn_users').upsert({ user_handle: userHandle }).throwOnError();

    await supabase
      .from('webauthn_credentials')
      .upsert({
        user_handle: userHandle,
        credential_id: toBase64Url(new Uint8Array(credentialID)),
        public_key: toBase64Url(new Uint8Array(credentialPublicKey)),
        counter: Number(counter ?? 0),
        device_type: credentialDeviceType,
        backed_up: credentialBackedUp,
        transports: credentialTransports ?? null,
        last_used_at: new Date().toISOString(),
      }, { onConflict: 'credential_id' })
      .throwOnError();

    // Cleanup old challenges
    await supabase.from('webauthn_challenges').delete().eq('user_handle', userHandle).eq('type', 'registration');

    return new Response(JSON.stringify({ verified: true, userHandle }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('webauthn-register-verify error', error);
    return new Response(JSON.stringify({ error: String(error?.message ?? error) }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
