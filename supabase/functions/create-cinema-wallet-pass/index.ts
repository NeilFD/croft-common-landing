// Crazy Bear / Bears Den — Secret Cinema Apple Wallet event ticket.
// Accessed unauthenticated via ?token=<wallet_token> from the booking email.
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

async function fetchAsset(file: string): Promise<Uint8Array> {
  const candidates = [
    `https://crazybear.dev/brand/wallet/${file}`,
    `https://www.crazybear.dev/brand/wallet/${file}`,
    `https://crazy-bear-web.lovable.app/brand/wallet/${file}`,
  ];
  for (const url of candidates) {
    try {
      const res = await fetch(url, { headers: { 'cache-control': 'no-cache' } });
      if (res.ok) {
        const buf = new Uint8Array(await res.arrayBuffer());
        if (buf.length > 0) return buf;
      }
    } catch (_e) { /* try next */ }
  }
  throw new Error(`Could not fetch wallet asset: ${file}`);
}

function fmtRelevantDate(dateIso: string, time: string): string {
  // ISO 8601 string for Apple Wallet relevantDate
  const t = (time || '19:30:00').slice(0, 8);
  // Treat as UK time, Apple wants ISO with offset; use Z (rough)
  return new Date(`${dateIso}T${t}Z`).toISOString();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');
    if (!token) {
      return new Response(JSON.stringify({ error: 'Missing token' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { data: booking, error: bErr } = await supabase
      .from('cinema_bookings')
      .select('id, release_id, quantity, guest_name, guest_email, wallet_token')
      .eq('wallet_token', token)
      .maybeSingle();

    if (bErr || !booking) {
      return new Response(JSON.stringify({ error: 'Invalid or expired ticket link' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: release } = await supabase
      .from('cinema_releases')
      .select('title, screening_date, doors_time, screening_time')
      .eq('id', booking.release_id)
      .maybeSingle();

    const teamIdentifier = Deno.env.get('APPLE_TEAM_ID')?.trim();
    const passTypeIdentifier = Deno.env.get('APPLE_PASS_TYPE_IDENTIFIER')?.trim();
    const passCert = Deno.env.get('APPLE_PASS_CERTIFICATE')?.trim();
    const passKey = Deno.env.get('APPLE_PASS_PRIVATE_KEY')?.trim();
    const wwdrCert = Deno.env.get('APPLE_WWDR_CERTIFICATE')?.trim();

    if (!teamIdentifier || !passTypeIdentifier || !passCert || !passKey || !wwdrCert) {
      return new Response(JSON.stringify({ error: 'Apple Wallet not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const title = release?.title || 'Secret Cinema Club';
    const screeningDate = release?.screening_date || new Date().toISOString().slice(0, 10);
    const doorsTime = (release?.doors_time || '19:00:00').slice(0, 5);
    const screeningTime = (release?.screening_time || '19:30:00').slice(0, 5);
    const dateLabel = new Date(screeningDate).toLocaleDateString('en-GB', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    });
    const serialNumber = `CINEMA-${booking.id.replace(/-/g, '').slice(0, 16).toUpperCase()}`;
    const ticketHolder = (booking.guest_name || 'Member').toUpperCase();
    const namesLabel = booking.quantity === 2 ? 'NAMES' : 'NAME';

    // Expire the pass at end of day after the screening (UK time, ~midnight UTC)
    const expirationIso = (() => {
      const d = new Date(`${screeningDate}T00:00:00Z`);
      d.setUTCDate(d.getUTCDate() + 2); // start of day-after-tomorrow == end of day-after-screening
      return d.toISOString();
    })();

    const passJson = {
      formatVersion: 1,
      passTypeIdentifier,
      serialNumber,
      teamIdentifier,
      organizationName: 'Crazy Bear',
      description: `${title} — Secret Cinema Ticket`,
      logoText: 'SECRET CINEMA',
      foregroundColor: 'rgb(255, 255, 255)',
      backgroundColor: 'rgb(0, 0, 0)',
      labelColor: 'rgb(200, 200, 200)',
      relevantDate: fmtRelevantDate(screeningDate, release?.screening_time || '19:30:00'),
      expirationDate: expirationIso,
      voided: false,
      eventTicket: {
        primaryFields: [
          { key: 'film', label: 'TONIGHT', value: title.toUpperCase() },
        ],
        secondaryFields: [
          { key: 'date', label: 'DATE', value: dateLabel },
          { key: 'doors', label: 'DOORS', value: doorsTime, textAlignment: 'PKTextAlignmentRight' },
        ],
        auxiliaryFields: [
          { key: 'screening', label: 'SCREENING', value: screeningTime },
          { key: 'qty', label: 'TICKETS', value: String(booking.quantity), textAlignment: 'PKTextAlignmentRight' },
          { key: 'holder', label: namesLabel, value: ticketHolder },
        ],
        backFields: [
          { key: 'holderBack', label: namesLabel, value: ticketHolder },
          { key: 'about', label: 'SECRET CINEMA', value: 'One night. One screen. Fifty tickets. Show this pass on arrival.' },
          { key: 'venue', label: 'VENUE', value: 'Crazy Bear — see your booking email for location' },
          { key: 'website', label: 'WEBSITE', value: 'https://www.crazybear.dev' },
          { key: 'terms', label: 'TERMS', value: 'Non-transferable. Late entry not guaranteed.' },
        ],
      },
      barcodes: [
        {
          format: 'PKBarcodeFormatQR',
          message: `cinema:${booking.id}`,
          messageEncoding: 'iso-8859-1',
          altText: serialNumber,
        },
      ],
    };

    const zip = new JSZip();
    const passJsonString = JSON.stringify(passJson, null, 2);
    zip.file('pass.json', passJsonString);

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

    const zipArrayBuffer = await zip.generateAsync({ type: 'arraybuffer' });
    const zipUint8Array = new Uint8Array(zipArrayBuffer);

    const filename = `${serialNumber}.pkpass`;
    return new Response(zipUint8Array, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/vnd.apple.pkpass',
        'Content-Disposition': `inline; filename="${filename}"`,
        'Content-Length': zipUint8Array.byteLength.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('create-cinema-wallet-pass error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
