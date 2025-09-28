
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { verifyRegistrationResponse } from "https://esm.sh/@simplewebauthn/server@10.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function toBase64Url(u8: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...u8));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
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
    const { userHandle, attResp, rpId, origin } = await req.json();
    console.log('[webauthn-register-verify] Request received:', {
      userHandle,
      rpId,
      origin,
      attRespKeys: attResp ? Object.keys(attResp) : 'null'
    });
    
    if (!userHandle || !attResp) throw new Error('Missing userHandle or attResp');

    const url = new URL(req.url);
    const expectedOrigin = origin ?? req.headers.get('origin') ?? `${url.protocol}//${url.host}`;
    const hostForRp = rpId ?? new URL(expectedOrigin).hostname;
    const expectedRPID = normalizeRpId(hostForRp);

    console.log('[webauthn-register-verify] Verification params:', {
      expectedOrigin,
      expectedRPID,
      requestOrigin: req.headers.get('origin')
    });

    // Load latest registration challenge
    const { data: challenges, error: chErr } = await supabase
      .from('webauthn_challenges')
      .select('*')
      .eq('user_handle', userHandle)
      .eq('type', 'registration')
      .order('created_at', { ascending: false })
      .limit(1);
    if (chErr) {
      console.error('[webauthn-register-verify] Challenge query error:', chErr);
      throw chErr;
    }
    
    const challenge = challenges?.[0]?.challenge;
    console.log('[webauthn-register-verify] Challenge found:', !!challenge, challenges?.[0]?.created_at);
    
    if (!challenge) {
      console.error('[webauthn-register-verify] No challenge found for userHandle:', userHandle);
      return new Response(JSON.stringify({ error: 'no_challenge' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log('[webauthn-register-verify] Starting verification with:', {
      hasResponse: !!attResp,
      challengeLength: challenge.length,
      expectedOrigin,
      expectedRPID
    });

    const verification = await verifyRegistrationResponse({
      response: attResp,
      expectedChallenge: challenge,
      expectedOrigin,
      expectedRPID,
    });

    console.log('[webauthn-register-verify] Verification result:', {
      verified: verification.verified,
      hasRegistrationInfo: !!verification.registrationInfo
    });

    if (!verification.verified || !verification.registrationInfo) {
      console.error('[webauthn-register-verify] Verification failed:', {
        verified: verification.verified,
        hasRegistrationInfo: !!verification.registrationInfo
      });
      return new Response(JSON.stringify({ 
        verified: false, 
        error: 'Verification failed',
        details: { verified: verification.verified, hasRegistrationInfo: !!verification.registrationInfo }
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const regInfo: any = verification.registrationInfo;
    const toB64u = (data: any): string => {
      if (typeof data === 'string') return data;
      const u8 = data instanceof Uint8Array ? data : new Uint8Array(data as ArrayBuffer);
      return toBase64Url(u8);
    };

    const credIdB64u = toB64u(regInfo.credentialID);
    const pubKeyB64u = toB64u(regInfo.credentialPublicKey);

    await supabase.from('webauthn_users').upsert({ user_handle: userHandle }).throwOnError();

    // Store credential including rp_id for domain scoping
    await supabase
      .from('webauthn_credentials')
      .upsert({
        user_handle: userHandle,
        credential_id: credIdB64u,
        public_key: pubKeyB64u,
        counter: Number(regInfo.counter ?? 0),
        device_type: regInfo.credentialDeviceType,
        backed_up: regInfo.credentialBackedUp,
        transports: regInfo.transports ?? null,
        last_used_at: new Date().toISOString(),
        rp_id: expectedRPID,
      }, { onConflict: 'credential_id' })
      .throwOnError();

    // Cleanup old challenges
    await supabase.from('webauthn_challenges').delete().eq('user_handle', userHandle).eq('type', 'registration');

    return new Response(JSON.stringify({ 
      verified: true, 
      userHandle,
      requiresLinking: true // Signal that frontend should create session
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('webauthn-register-verify error', error);
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
