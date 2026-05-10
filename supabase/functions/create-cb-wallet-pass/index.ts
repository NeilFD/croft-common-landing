// Crazy Bear — The Den member Apple Wallet pass.
// Mirrors the structure of create-wallet-pass but reads cb_members and
// uses Crazy Bear branding (black card, bear mark logo).

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import JSZip from "https://esm.sh/jszip@3.10.1";
import forge from "https://esm.sh/node-forge@1.3.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function sha1(data: Uint8Array): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-1', data as any);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function normalizePem(pem: string): string {
  return pem.replace(/\\n/g, '\n').replace(/\r\n/g, '\n').trim();
}

function formatMembershipNumber(uuid: string): string {
  const hex = uuid.replace(/-/g, '').toUpperCase();
  return `CB-${hex.slice(0, 4)}-${hex.slice(4, 8)}`;
}

function formatMemberSince(iso: string | null): string {
  if (!iso) return '— / —';
  const d = new Date(iso);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(-2);
  return `${mm} / ${yy}`;
}

// Fetch a wallet asset (sized + tinted variants of the bear mark) from the
// public site. Apple silently rejects oversized logo PNGs, so we ship pre-sized
// 50/100/150px logo files and 29/58/87px icon files.
async function fetchAsset(file: string): Promise<Uint8Array> {
  const candidates = [
    `https://crazybear.dev/brand/wallet/${file}`,
    `https://www.crazybear.dev/brand/wallet/${file}`,
    `https://crazy-bear-web.lovable.app/brand/wallet/${file}`,
    `https://www.crazybear.dev/brand/wallet/${file}`,
  ];
  for (const url of candidates) {
    try {
      const res = await fetch(url, { headers: { 'cache-control': 'no-cache' } });
      if (res.ok) {
        const buf = new Uint8Array(await res.arrayBuffer());
        if (buf.length > 0) return buf;
      }
    } catch (_e) {
      // try next
    }
  }
  throw new Error(`Could not fetch wallet asset: ${file}`);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Allow GET with ?token= so iOS Safari can hit the URL directly from a link.
  if (req.method === 'GET') {
    const url = new URL(req.url);
    const rawParam = url.searchParams.get('token') || url.searchParams.get('Authorization');
    if (!rawParam) {
      return new Response(JSON.stringify({ error: 'Missing token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const decoded = decodeURIComponent(rawParam).replace(/^Bearer\s+/i, '');
    req = new Request(req.url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${decoded}`,
        'Content-Type': 'application/json',
      },
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: member, error: memberError } = await supabaseClient
      .from('cb_members')
      .select('first_name, last_name, created_at')
      .eq('user_id', user.id)
      .maybeSingle();

    // Check Gold subscription status to brand the pass accordingly.
    let isGold = false;
    try {
      const { data: goldData } = await supabaseClient.rpc('is_gold', { check_user_id: user.id });
      isGold = !!goldData;
    } catch (e) {
      console.warn('is_gold check failed:', e);
    }

    if (memberError) {
      console.error('cb_members lookup failed:', memberError);
      return new Response(JSON.stringify({ error: 'Member lookup failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const firstName = (member?.first_name || (user.user_metadata as any)?.first_name || '').trim();
    const lastName = (member?.last_name || (user.user_metadata as any)?.last_name || '').trim();
    const fullName = [firstName, lastName].filter(Boolean).join(' ') || (user.email ?? 'Member');
    const membershipNumber = formatMembershipNumber(user.id);
    const memberSince = formatMemberSince(member?.created_at ?? (user as any).created_at);
    const serialNumber = `CB-${user.id.replace(/-/g, '').slice(0, 12).toUpperCase()}`;

    const teamIdentifier = Deno.env.get('APPLE_TEAM_ID')?.trim();
    const passTypeIdentifier = Deno.env.get('APPLE_PASS_TYPE_IDENTIFIER')?.trim();
    const passCert = Deno.env.get('APPLE_PASS_CERTIFICATE')?.trim();
    const passKey = Deno.env.get('APPLE_PASS_PRIVATE_KEY')?.trim();
    const wwdrCert = Deno.env.get('APPLE_WWDR_CERTIFICATE')?.trim();

    if (!teamIdentifier || !passTypeIdentifier || !passCert || !passKey || !wwdrCert) {
      console.error('Missing Apple Wallet credentials');
      return new Response(JSON.stringify({ error: 'Apple Wallet credentials not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const passJson = {
      formatVersion: 1,
      passTypeIdentifier,
      serialNumber,
      teamIdentifier,
      organizationName: 'Crazy Bear',
      description: isGold ? "The Den Bear's Den Gold Card" : 'The Den Member Card',
      logoText: isGold ? "BEAR'S DEN GOLD" : 'THE DEN',
      foregroundColor: isGold ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)',
      backgroundColor: isGold ? 'rgb(212, 175, 55)' : 'rgb(0, 0, 0)',
      labelColor: isGold ? 'rgb(60, 45, 0)' : 'rgb(200, 200, 200)',
      storeCard: {
        primaryFields: [
          { key: 'memberName', label: 'MEMBER', value: fullName },
        ],
        secondaryFields: [
          { key: 'membershipNumber', label: 'MEMBER NO.', value: membershipNumber },
          { key: 'tier', label: 'TIER', value: isGold ? 'GOLD' : 'STANDARD', textAlignment: 'PKTextAlignmentRight' },
        ],
        auxiliaryFields: [
          { key: 'memberSince', label: 'MEMBER SINCE', value: memberSince },
        ],
        backFields: [
          { key: 'about', label: 'THE DEN', value: 'Your Crazy Bear membership. Show this card on arrival.' },
          { key: 'website', label: 'WEBSITE', value: 'https://www.crazybear.dev' },
          { key: 'contact', label: 'CONTACT', value: 'hello@crazybear.dev' },
          { key: 'terms', label: 'TERMS', value: 'This card is non-transferable. The Den reserves the right to refuse entry.' },
        ],
      },
      barcodes: [
        {
          format: 'PKBarcodeFormatQR',
          message: `https://www.crazybear.dev/den/verify?m=${encodeURIComponent(membershipNumber)}`,
          messageEncoding: 'iso-8859-1',
          altText: membershipNumber,
        },
      ],
    };

    const zip = new JSZip();
    const passJsonString = JSON.stringify(passJson, null, 2);
    zip.file('pass.json', passJsonString);

    // Pre-sized bear logo + icon assets so Apple Wallet renders them.
    const [logo1x, logo2x, logo3x, icon1x, icon2x, icon3x] = await Promise.all([
      fetchAsset('wallet-logo.png'),
      fetchAsset('wallet-logo@2x.png'),
      fetchAsset('wallet-logo@3x.png'),
      fetchAsset('wallet-icon.png'),
      fetchAsset('wallet-icon@2x.png'),
      fetchAsset('wallet-icon@3x.png'),
    ]);
    zip.file('icon.png', icon1x);
    zip.file('icon@2x.png', icon2x);
    zip.file('icon@3x.png', icon3x);
    zip.file('logo.png', logo1x);
    zip.file('logo@2x.png', logo2x);
    zip.file('logo@3x.png', logo3x);

    // Manifest
    const manifest: Record<string, string> = {};
    for (const fileName of Object.keys(zip.files)) {
      if (fileName === 'manifest.json' || fileName === 'signature') continue;
      const file = zip.files[fileName];
      if (file && !file.dir) {
        const fileData = await file.async('uint8array');
        manifest[fileName] = await sha1(fileData);
      }
    }
    const manifestString = JSON.stringify(manifest, null, 2);
    zip.file('manifest.json', manifestString);

    // PKCS#7 signature
    try {
      const passCertPem = normalizePem(passCert);
      const passKeyPem = normalizePem(passKey);
      const wwdrCertPem = normalizePem(wwdrCert);

      const cert = forge.pki.certificateFromPem(passCertPem);
      const wwdr = forge.pki.certificateFromPem(wwdrCertPem);
      const key = forge.pki.privateKeyFromPem(passKeyPem);

      const p7 = forge.pkcs7.createSignedData();
      p7.content = forge.util.createBuffer(manifestString, 'utf8');
      p7.addCertificate(cert);
      p7.addCertificate(wwdr);
      p7.addSigner({
        key,
        certificate: cert,
        digestAlgorithm: forge.pki.oids.sha1,
        authenticatedAttributes: [
          { type: forge.pki.oids.contentType, value: forge.pki.oids.data },
          { type: forge.pki.oids.messageDigest },
          { type: forge.pki.oids.signingTime, value: new Date() },
        ],
      });
      p7.sign({ detached: true });

      const derBuffer = forge.asn1.toDer(p7.toAsn1()).getBytes();
      const signatureBytes = new Uint8Array(derBuffer.length);
      for (let i = 0; i < derBuffer.length; i++) {
        signatureBytes[i] = derBuffer.charCodeAt(i);
      }
      zip.file('signature', signatureBytes);
    } catch (sigError) {
      console.error('PKCS#7 signature error:', sigError);
      return new Response(
        JSON.stringify({ error: `Wallet pass signing failed: ${(sigError as any)?.message || sigError}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const zipArrayBuffer = await zip.generateAsync({ type: 'arraybuffer' });
    const zipUint8Array = new Uint8Array(zipArrayBuffer);

    await supabaseClient
      .from('cb_members')
      .update({
        wallet_pass_serial_number: serialNumber,
        wallet_pass_last_issued_at: new Date().toISOString(),
        wallet_pass_revoked: false,
      })
      .eq('user_id', user.id);

    const filename = `${membershipNumber}.pkpass`;

    return new Response(zipUint8Array, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/vnd.apple.pkpass',
        'Content-Disposition': `inline; filename="${filename}"`,
        'Content-Length': zipUint8Array.byteLength.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Content-Type-Options': 'nosniff',
        'Accept-Ranges': 'bytes',
      },
    });
  } catch (error) {
    console.error('create-cb-wallet-pass error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
