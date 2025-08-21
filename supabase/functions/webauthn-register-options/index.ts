import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { generateRegistrationOptions } from "npm:@simplewebauthn/server@10.0.0";

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
    const { userHandle, displayName, rpId, origin } = await req.json();

const url = new URL(req.url);
const effectiveOrigin = origin ?? req.headers.get('origin') ?? `${url.protocol}//${url.host}`;
const hostForRp = rpId ?? new URL(effectiveOrigin).hostname;
const effectiveRpId = normalizeRpId(hostForRp);

    // Ensure user exists
    let handle = userHandle || crypto.randomUUID();
    const safeDisplay = typeof displayName === 'string' && displayName.trim().length > 0 ? displayName.trim() : 'Member';
    const userName = `member-${handle}`; // Stable, ASCII-only username as required by WebAuthn
    await supabase.from('webauthn_users').upsert({ user_handle: handle, display_name: safeDisplay }).throwOnError();

    // Get existing credentials to exclude
    const { data: creds } = await supabase
      .from('webauthn_credentials')
      .select('credential_id')
      .eq('user_handle', handle);

    const excludeCredentials = (creds ?? []).map((c: any) => ({ id: c.credential_id, type: 'public-key' as const }));

    console.log('webauthn-register-options', { rpId: effectiveRpId, origin: effectiveOrigin, excludeCount: excludeCredentials.length });
    const options = await generateRegistrationOptions({
      rpName: 'Croft Common',
      rpID: effectiveRpId,
      user: {
        id: new TextEncoder().encode(handle),
        name: userName,
        displayName: safeDisplay,
      },
      attestationType: 'none',
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        residentKey: 'required',
        requireResidentKey: false,
        userVerification: 'preferred', // iOS-friendly: preferred instead of required
      },
      extensions: {
        credProps: true, // Help iOS understand credential properties
      },
      excludeCredentials,
    });

    // Store challenge
    await supabase
      .from('webauthn_challenges')
      .insert({ user_handle: handle, type: 'registration', challenge: options.challenge })
      .throwOnError();

    return new Response(JSON.stringify({ options, userHandle: handle, rpId: effectiveRpId, origin: effectiveOrigin }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('webauthn-register-options error', error);
    return new Response(JSON.stringify({ error: String(error?.message ?? error) }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
