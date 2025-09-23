import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { JSZip } from "https://deno.land/x/jszip@0.11.0/mod.ts";
import * as forge from "npm:node-forge@1.3.1";

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PassData {
  membershipNumber: string;
  displayName: string;
  firstName: string;
  lastName: string;
  memberSince: string;
}

// Base64 encoded assets for Apple Wallet pass
const WALLET_ASSETS = {
  // Simple pink 1x1 pixel background - will be stretched
  background: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP4+5+BAQAFqgIA5P5FGwAAAABJRU5ErkJggg==",
  
  // Same background for @2x
  background2x: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP4+5+BAQAFqgIA5P5FGwAAAABJRU5ErkJggg==",
  
  // Simple black 1x1 pixel icon - will be stretched
  icon: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77wgAAAABJRU5ErkJggg=="
};

// Utility function to calculate SHA1 hash from raw bytes
async function sha1(data: Uint8Array): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Utility function to convert PEM to DER format
function pemToDer(pem: string): Uint8Array {
  const pemHeader = "-----BEGIN CERTIFICATE-----";
  const pemFooter = "-----END CERTIFICATE-----";
  const pemContents = pem.replace(pemHeader, "").replace(pemFooter, "").replace(/\s/g, "");
  const derBuffer = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
  return derBuffer;
}

// Base64 encoded assets for Apple Wallet pass
const WALLET_ASSETS = {
  // Pink background with "CROFT COMMON" text and logo - 320x196px
  background: "iVBORw0KGgoAAAANSUhEUgAAAUAAAADECAYAAADhnvK8AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAOxAAADsQBlSsOGwAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAQKSURBVHic7d1NbttAEIThGvwEe+fzRN5A18ml9ARJbiBv5BMk3sAb+ARJF/IJ7J2BB9AgJICBmx/JrJ5vA4BAa1rVNTPNkdb3799fAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
  
  // Pink background @2x - 640x392px  
  background2x: "iVBORw0KGgoAAAANSUhEUgAAAgAAAAGICAYAAAA+Y5BoAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAOxAAADsQBlSsOGwAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAQKSURBVHic7d1NbttAEIThGvwEe+fzRN5A18ml9ARJbiBv5BMk3sAb+ARJF/IJ7J2BB9AgJICBmx/JrJ5vA4BAa1rVNTPNkdb3799fAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
  
  // Black architectural grid icon - various sizes
  icon: "iVBORw0KGgoAAAANSUhEUgAAAB0AAAAdCAYAAABWk2cPAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAOxAAADsQBlSsOGwAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAKQSURBVEiJ7ZY9axRBFIafJwkWVhb2FhYWFhb2FhYWVhYW9hYWVhYWFlYWFhZWFhZWFhZWFhZWFhZWVhZWVhZWVhZWVhZWFlYWVhZWVhZWVhYW9hYWFlYWFhb2FhYWFlYWFhZWVhZWVhZWFlYWVhZWVhZWFlYWFlYWVhZWFlYWFlYWVhZWFlYWVhZWVhZWVhZWFlYWVhZWFlYWVhZWVhZWFlYWVhZWVhZWVhZWFlYWVhZWVhZWVhZWVhZWVhZWVhZWVhZWVhZWVhZWVhZWVhZWVhZWVhZWVhZWVhZWVhZWVhZWVhZWVhZWVhZWVhZWVhZWVhZWVhZWVhZWVhZWVhZWVhZWVhZWVhZWVhZWVhZWVhZWVhZWVhZWVhZWVhZWVhZWVhZWVhZWVhZWVhZWVhZWVhZWVhZWVhZWVhZWVhZWVhZWVhZWVhZWVhZWVhZWVhZWVhZWVhZWVhZWVhZWVhZWVhZWVhZWVhZWVhZWVhZWVhZWVhZWVhZWVhZWVhZWVhZWVhbW"
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Handle GET requests with token in query string (for wallet pass links)
    let authToken = req.headers.get('Authorization');
    if (req.method === 'GET' && !authToken) {
      const url = new URL(req.url);
      const token = url.searchParams.get('token');
      if (token) {
        console.log('GET create-wallet-pass: token received via query string', { via: 'token', length: token.length });
        authToken = `Bearer ${token}`;
      } else {
        return new Response(JSON.stringify({ error: 'No authentication token provided' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    if (!authToken) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create authenticated Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authToken } },
    });

    // Get the authenticated user
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      console.error('Authentication error:', userError);
      return new Response(JSON.stringify({ error: 'Authentication failed' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const user = userData.user;

    // Create service role client for accessing member data
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get member card details using the RPC function
    const { data: memberData, error: memberError } = await supabaseAdmin
      .rpc('get_membership_card_details', { user_id_input: user.id });

    if (memberError || !memberData || memberData.length === 0) {
      console.error('Error fetching member data:', memberError);
      return new Response(JSON.stringify({ error: 'Member data not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const member = memberData[0];
    
    // Generate unique serial number
    const serialNumber = `CC-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Get Apple certificates and secrets from environment (trim whitespace)
    const teamIdentifier = Deno.env.get('APPLE_TEAM_ID')?.trim();
    const passTypeIdentifier = Deno.env.get('APPLE_PASS_TYPE_IDENTIFIER')?.trim();
    const passCert = Deno.env.get('APPLE_PASS_CERTIFICATE')?.trim();
    const passKey = Deno.env.get('APPLE_PASS_PRIVATE_KEY')?.trim();
    const wwdrCert = Deno.env.get('APPLE_WWDR_CERTIFICATE')?.trim();

    if (!teamIdentifier || !passTypeIdentifier || !passCert || !passKey || !wwdrCert) {
      console.error('Missing Apple credentials');
      return new Response(JSON.stringify({ error: 'Apple Wallet credentials not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('🎫 Pass type identifier:', JSON.stringify(passTypeIdentifier));
    console.log('🎫 Serial Number:', serialNumber);

    // Create pass.json structure for Apple Wallet
    const passJson = {
      formatVersion: 1,
      passTypeIdentifier: passTypeIdentifier,
      serialNumber: serialNumber,
      teamIdentifier: teamIdentifier,
      organizationName: "CROFT COMMON",
      description: "Croft Common Membership Card",
      logoText: "",
      foregroundColor: "rgb(0, 0, 0)",
      backgroundColor: "rgb(232, 121, 160)", 
      labelColor: "rgb(0, 0, 0)",
      generic: {
        primaryFields: [
          {
            key: "memberName",
            label: "MEMBER", 
            value: `${member.first_name || ''} ${member.last_name || ''}`.trim() || member.display_name
          }
        ],
        secondaryFields: [
          {
            key: "membershipNumber",
            label: "MEMBERSHIP NUMBER",
            value: member.membership_number
          },
          {
            key: "memberSince",
            label: "MEMBER SINCE",
            value: new Date(member.member_since).getFullYear().toString()
          }
        ],
        auxiliaryFields: [
          {
            key: "tagline",
            label: "",
            value: "Hospitality, For Good"
          }
        ],
        backFields: [
          {
            key: "website",
            label: "WEBSITE",
            value: "https://croftcommon.co.uk"
          },
          {
            key: "contact",
            label: "CONTACT",
            value: "hello@croftcommon.co.uk"
          },
          {
            key: "terms",
            label: "TERMS & CONDITIONS",
            value: "This membership card is non-transferable and must be presented when requested. Visit our website for full terms and conditions."
          }
        ]
      }
    };

    console.log('🎫 STEP 1: Creating wallet pass for user:', user.id);
    console.log('🎫 STEP 2: Member data:', JSON.stringify(member, null, 2));
    console.log('🎫 ✅ Pass configured as static (no web service communication required)');

    // Create pass bundle with required files
    const zip = new JSZip();
    
    console.log('🎫 STEP 3: Creating pass.json structure');
    // Add pass.json
    const passJsonString = JSON.stringify(passJson, null, 2);
    zip.file("pass.json", passJsonString);

    console.log('🎫 STEP 4: Adding background and logo assets');
    try {
      // Convert base64 assets to binary data
      const backgroundData = Uint8Array.from(atob(WALLET_ASSETS.background), c => c.charCodeAt(0));
      const background2xData = Uint8Array.from(atob(WALLET_ASSETS.background2x), c => c.charCodeAt(0));
      const iconData = Uint8Array.from(atob(WALLET_ASSETS.icon), c => c.charCodeAt(0));

      // Add background images with "CROFT COMMON" text and logo embedded
      zip.file("background.png", backgroundData);
      zip.file("background@2x.png", background2xData);
      
      // Add icon assets (Apple Wallet requires these)
      zip.file("icon.png", iconData);
      zip.file("icon@2x.png", iconData);
      zip.file("icon@3x.png", iconData);
      zip.file("logo.png", iconData);
      zip.file("logo@2x.png", iconData);
      
      console.log('🎫 STEP 5: Added embedded background and logo assets');
    } catch (error) {
      console.error('❌ Error processing embedded assets:', error);
      // Minimal fallback - 1px transparent PNG
      const fallback = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77wgAAAABJRU5ErkJggg==";
      const fallbackData = Uint8Array.from(atob(fallback), c => c.charCodeAt(0));
      
      zip.file("icon.png", fallbackData);
      zip.file("icon@2x.png", fallbackData); 
      zip.file("logo.png", fallbackData);
      zip.file("background.png", fallbackData);
      zip.file("background@2x.png", fallbackData);
    }

    console.log('🎫 STEP 6: Generating manifest.json with SHA1 hashes');
    // Generate manifest.json with SHA1 hashes of all files
    const manifest: Record<string, string> = {};
    
    // Calculate SHA1 for each file in the ZIP using raw bytes
    const fileNames = Object.keys(zip.files);
    console.log('🎫 STEP 7: Computing hashes for files:', fileNames);
    
    for (const fileName of fileNames) {
      if (fileName !== 'manifest.json' && fileName !== 'signature') {
        const file = zip.files[fileName];
        
        if (file && !file.dir) {
          // Get the raw binary data from JSZip
          const fileData = await file.async('uint8array');
          const hash = await sha1(fileData);
          manifest[fileName] = hash;
          console.log(`🎫 Hash for ${fileName}: ${hash}`);
        }
      }
    }

    console.log('🎫 STEP 8: Creating manifest.json');
    const manifestString = JSON.stringify(manifest, null, 2);
    zip.file("manifest.json", manifestString);

    console.log('🎫 STEP 9: Generating PKCS#7 signature');
    // Generate proper PKCS#7 signature
    try {
      // Normalise and validate certificates and key
      const cleanPassCert = passCert.replace(/\\n/g, '\n').trim();
      const cleanPassKey = passKey.replace(/\\n/g, '\n').trim();
      const cleanWwdrCert = wwdrCert.replace(/\\n/g, '\n').trim();

      // Create forge objects from PEM data
      const cert = forge.pki.certificateFromPem(cleanPassCert);
      const privateKey = forge.pki.privateKeyFromPem(cleanPassKey);
      const wwdrCertificate = forge.pki.certificateFromPem(cleanWwdrCert);

      // Extract certificate details for debugging
      const certDetails = {
        subjectCN: cert.subject.getField('CN')?.value || 'Unknown',
        issuerCN: cert.issuer.getField('CN')?.value || 'Unknown',
        uid: cert.subject.getField('UID')?.value,
        serialNumber: cert.serialNumber,
        notBefore: cert.validity.notBefore,
        notAfter: cert.validity.notAfter,
        teamIdentifier: cert.subject.getField({name: 'organizationalUnitName'})?.value || teamIdentifier,
        passTypeIdentifier: cert.subject.getField('CN')?.value?.replace('Pass Type ID: ', '') || passTypeIdentifier
      };

      const wwdrDetails = {
        subjectCN: wwdrCertificate.subject.getField('CN')?.value || 'Unknown',
        issuerCN: wwdrCertificate.issuer.getField('CN')?.value || 'Unknown'
      };

      console.log('🎫 Cert details:', JSON.stringify(certDetails, null, 2));
      console.log('🎫 WWDR details:', JSON.stringify(wwdrDetails, null, 2));

      // Final teamIdentifier determination
      const finalTeamIdentifier = certDetails.teamIdentifier;
      console.log('🎫 Final teamIdentifier value:', JSON.stringify(finalTeamIdentifier));

      // Create PKCS#7 signature
      const p7 = forge.pkcs7.createSignedData();
      p7.content = forge.util.createBuffer(manifestString, 'utf8');
      
      // Add the pass certificate and WWDR certificate
      p7.addCertificate(cert);
      p7.addCertificate(wwdrCertificate);
      
      // Add signer
      p7.addSigner({
        key: privateKey,
        certificate: cert,
        digestAlgorithm: forge.pki.oids.sha1,
        authenticatedAttributes: [
          {
            type: forge.pki.oids.contentTypes,
            value: forge.pki.oids.data
          }, 
          {
            type: forge.pki.oids.messageDigest
            // value will be auto-populated
          },
          {
            type: forge.pki.oids.signingTime,
            value: new Date()
          }
        ]
      });

      // Sign the data
      p7.sign();

      // Convert to DER format for .pkpass
      const derSignature = forge.asn1.toDer(p7.toAsn1()).getBytes();
      const signatureBuffer = new Uint8Array(derSignature.length);
      for (let i = 0; i < derSignature.length; i++) {
        signatureBuffer[i] = derSignature.charCodeAt(i);
      }

      zip.file("signature", signatureBuffer);
      console.log('🎫 ✅ PKCS#7 signature generated successfully');

    } catch (error) {
      console.error('❌ PKCS#7 signature generation failed:', error);
      return new Response(JSON.stringify({ error: 'Failed to generate wallet pass signature' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('🎫 STEP 10: Generating final .pkpass file');
    // Generate the final ZIP file
    const pkpassBuffer = await zip.generateAsync({ 
      type: 'uint8array',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    });

    console.log('🎫 Generated .pkpass file size:', pkpassBuffer.length, 'bytes');

    console.log('🎫 STEP 11: Updating user profile with serial number');
    // Update user profile with the new pass information
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        wallet_pass_serial_number: serialNumber,
        wallet_pass_last_issued_at: new Date().toISOString()
      })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('❌ Failed to update user profile:', updateError);
    }

    console.log('🎫 Serving .pkpass file directly with proper headers');
    console.log('🎫 🎉 SUCCESS - Apple Wallet pass created successfully!');

    // Return the .pkpass file directly with proper headers
    return new Response(pkpassBuffer, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/vnd.apple.pkpass',
        'Content-Disposition': `attachment; filename="croft-common-membership-${serialNumber}.pkpass"`,
        'Content-Length': pkpassBuffer.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error: any) {
    console.error('❌ Wallet pass generation error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error?.message || 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});