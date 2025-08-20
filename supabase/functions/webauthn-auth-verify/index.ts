
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { verifyAuthenticationResponse } from "npm:@simplewebauthn/server@10.0.0";

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
    const { userHandle, authResp, rpId, origin } = await req.json();
    console.log('webauthn-auth-verify received:', { userHandle, authRespId: authResp?.id || authResp?.rawId, rpId, origin });
    if (!userHandle || !authResp) throw new Error('Missing userHandle or authResp');

    const url = new URL(req.url);
    const expectedOrigin = origin ?? req.headers.get('origin') ?? `${url.protocol}//${url.host}`;
    const hostForRp = rpId ?? new URL(expectedOrigin).hostname;
    const expectedRPID = normalizeRpId(hostForRp);

    // Load latest auth challenge
    const { data: challenges, error: chErr } = await supabase
      .from('webauthn_challenges')
      .select('*')
      .eq('user_handle', userHandle)
      .eq('type', 'authentication')
      .order('created_at', { ascending: false })
      .limit(1);
    if (chErr) throw chErr;
    const challenge = challenges?.[0]?.challenge;
    if (!challenge) return new Response(JSON.stringify({ error: 'no_challenge' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    // Get authenticator data scoped to this RP ID
    const { data: credRows, error: credErr } = await supabase
      .from('webauthn_credentials')
      .select('*')
      .eq('user_handle', userHandle)
      .eq('rp_id', expectedRPID);
    if (credErr) throw credErr;
    
    console.log('webauthn-auth-verify credentials found:', credRows?.length, 'for user:', userHandle, 'rpId:', expectedRPID);
    console.log('webauthn-auth-verify credential IDs:', credRows?.map(c => ({ id: c.credential_id, length: c.credential_id?.length })));

    const credMap = new Map<string, any>();
    for (const c of credRows ?? []) credMap.set(c.credential_id, c);

    // SimpleWebAuthn expects an authenticator object
    const authenticator = (() => {
      const rawIdB64u: string = authResp.rawId || authResp.id;
      console.log('webauthn-auth-verify looking for credential ID:', rawIdB64u);
      console.log('webauthn-auth-verify available credential IDs:', Array.from(credMap.keys()));
      const row = credMap.get(rawIdB64u);
      if (!row) {
        console.log('webauthn-auth-verify no matching credential found');
        return null;
      }
      return {
        credentialID: base64urlToUint8Array(row.credential_id),
        credentialPublicKey: base64urlToUint8Array(row.public_key),
        counter: Number(row.counter ?? 0),
        transports: row.transports ?? undefined,
      };
    })();

    if (!authenticator) {
      return new Response(JSON.stringify({ error: 'unknown_credential' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const verification = await verifyAuthenticationResponse({
      response: authResp,
      expectedChallenge: challenge,
      expectedOrigin,
      expectedRPID,
      authenticator,
    });

    if (!verification.verified || !verification.authenticationInfo) {
      return new Response(JSON.stringify({ verified: false }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { newCounter } = verification.authenticationInfo;

    // Update counter and last_used_at
    await supabase
      .from('webauthn_credentials')
      .update({ counter: Number(newCounter ?? 0), last_used_at: new Date().toISOString() })
      .eq('credential_id', authResp.rawId || authResp.id)
      .throwOnError();

    // Cleanup old challenges
    await supabase.from('webauthn_challenges').delete().eq('user_handle', userHandle).eq('type', 'authentication');

    return new Response(JSON.stringify({ verified: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('webauthn-auth-verify error', error);
    return new Response(JSON.stringify({ error: String(error?.message ?? error) }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
