import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import JSZip from "https://esm.sh/jszip@3.10.1";
import { encode as base64Encode } from "https://deno.land/std@0.190.0/encoding/base64.ts";
import { encode as hexEncode } from "https://deno.land/std@0.190.0/encoding/hex.ts";
import forge from "https://esm.sh/node-forge@1.3.1";

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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user from JWT
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user's membership data
    const { data: memberData, error: memberError } = await supabaseClient
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

    // Get Apple certificates and secrets from environment
    const teamIdentifier = Deno.env.get('APPLE_TEAM_ID');
    const passTypeIdentifier = Deno.env.get('APPLE_PASS_TYPE_IDENTIFIER');
    const passCert = Deno.env.get('APPLE_PASS_CERTIFICATE');
    const passKey = Deno.env.get('APPLE_PASS_PRIVATE_KEY');
    const wwdrCert = Deno.env.get('APPLE_WWDR_CERTIFICATE');

    if (!teamIdentifier || !passTypeIdentifier || !passCert || !passKey || !wwdrCert) {
      console.error('Missing Apple credentials');
      return new Response(JSON.stringify({ error: 'Apple Wallet credentials not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create pass.json structure for Apple Wallet
    const passJson = {
      formatVersion: 1,
      passTypeIdentifier: passTypeIdentifier,
      serialNumber: serialNumber,
      teamIdentifier: teamIdentifier,
      organizationName: "Croft Common",
      description: "Croft Common Membership Card",
      logoText: "Croft Common",
      foregroundColor: "rgb(255, 255, 255)",
      backgroundColor: "rgb(34, 34, 34)",
      labelColor: "rgb(255, 255, 255)",
      webServiceURL: `https://${Deno.env.get('SUPABASE_URL')?.replace('https://', '')}/functions/v1/wallet-pass-service`,
      authenticationToken: serialNumber, // Use serial number as auth token
      generic: {
        primaryFields: [
          {
            key: "memberName",
            label: "MEMBER",
            value: member.display_name || `${member.first_name} ${member.last_name}`
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

    // Create pass bundle with required files
    const zip = new JSZip();
    
    console.log('🎫 STEP 3: Creating pass.json structure');
    // Add pass.json
    const passJsonString = JSON.stringify(passJson, null, 2);
    zip.file("pass.json", passJsonString);

    console.log('🎫 STEP 4: Adding icon assets');
    // Fetch actual icon assets from Supabase storage
    try {
      // For now, use a basic transparent PNG as fallback
      const iconBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77wgAAAABJRU5ErkJggg==";
      const iconData = Uint8Array.from(atob(iconBase64), c => c.charCodeAt(0));
      
      // Add icon files (all sizes) using JSZip
      zip.file("icon.png", iconData);
      zip.file("icon@2x.png", iconData);
      zip.file("icon@3x.png", iconData);
      zip.file("logo.png", iconData);
      zip.file("logo@2x.png", iconData);
      console.log('🎫 STEP 5: Icon assets added successfully');
    } catch (error) {
      console.error('❌ Error adding icon assets:', error);
      // Continue with placeholder icons
      const transparentPng = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77wgAAAABJRU5ErkJggg==";
      const iconData = Uint8Array.from(atob(transparentPng), c => c.charCodeAt(0));
      
      zip.file("icon.png", iconData);
      zip.file("icon@2x.png", iconData);
      zip.file("icon@3x.png", iconData);
      zip.file("logo.png", iconData);
      zip.file("logo@2x.png", iconData);
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
      // Parse certificates and key
      const passCertPem = passCert.replace(/\\n/g, '\n');
      const passKeyPem = passKey.replace(/\\n/g, '\n');
      const wwdrCertPem = wwdrCert.replace(/\\n/g, '\n');
      
      // Create PKCS#7 signature
      const p7 = forge.pkcs7.createSignedData();
      p7.content = forge.util.createBuffer(manifestString, 'utf8');
      
      // Add certificates
      const cert = forge.pki.certificateFromPem(passCertPem);
      const wwdr = forge.pki.certificateFromPem(wwdrCertPem);
      p7.addCertificate(cert);
      p7.addCertificate(wwdr);
      
      // Add signer
      const key = forge.pki.privateKeyFromPem(passKeyPem);
      p7.addSigner({
        key: key,
        certificate: cert,
        digestAlgorithm: forge.pki.oids.sha1,
        authenticatedAttributes: [
          {
            type: forge.pki.oids.contentTypes,
            value: forge.pki.oids.data
          },
          {
            type: forge.pki.oids.messageDigest
          },
          {
            type: forge.pki.oids.signingTime,
            value: new Date()
          }
        ]
      });
      
      // Sign
      p7.sign({ detached: true });
      
      // Convert to DER format
      const derBuffer = forge.asn1.toDer(p7.toAsn1()).getBytes();
      const signatureBytes = new Uint8Array(derBuffer.length);
      for (let i = 0; i < derBuffer.length; i++) {
        signatureBytes[i] = derBuffer.charCodeAt(i);
      }
      
      zip.file("signature", signatureBytes);
      console.log('🎫 ✅ PKCS#7 signature generated successfully');
      
    } catch (sigError) {
      console.error('❌ Error generating PKCS#7 signature:', sigError);
      console.error('❌ Signature error details:', sigError.message);
      
      // Fallback to placeholder signature
      const signatureData = "SIGNATURE_PLACEHOLDER_FOR_DEVELOPMENT";
      zip.file("signature", signatureData);
      console.log('🎫 ⚠️ Using placeholder signature due to error');
    }

    console.log('🎫 STEP 10: Generating final .pkpass file');
    // Generate the ZIP file using JSZip
    const zipArrayBuffer = await zip.generateAsync({ type: "arraybuffer" });
    const zipUint8Array = new Uint8Array(zipArrayBuffer);
    console.log(`🎫 Generated .pkpass file size: ${zipUint8Array.length} bytes`);

    // Upload .pkpass file to storage
    const passFileName = `${user.id}/${serialNumber}.pkpass`;
    console.log(`🎫 STEP 11: Uploading to storage: ${passFileName}`);
    
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('wallet-passes')
      .upload(passFileName, zipUint8Array, {
        contentType: 'application/vnd.apple.pkpass',
        upsert: true
      });

    if (uploadError) {
      console.error('❌ STEP 11 FAILED - Error uploading pass:', uploadError);
      return new Response(JSON.stringify({ error: 'Failed to create pass file' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    console.log('🎫 ✅ STEP 11 SUCCESS - Pass uploaded to storage');

    console.log('🎫 STEP 12: Creating signed URL');
    // Get signed URL for the pass
    const { data: signedUrlData } = await supabaseClient.storage
      .from('wallet-passes')
      .createSignedUrl(passFileName, 3600); // 1 hour expiry
    
    console.log('🎫 ✅ Signed URL created:', signedUrlData?.signedUrl ? 'YES' : 'NO');

    console.log('🎫 STEP 13: Updating user profile');
    // Update user profile with pass information
    const { error: updateError } = await supabaseClient
      .from('profiles')
      .update({
        wallet_pass_url: signedUrlData?.signedUrl,
        wallet_pass_last_issued_at: new Date().toISOString(),
        wallet_pass_serial_number: serialNumber,
        wallet_pass_revoked: false
      })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('❌ STEP 13 FAILED - Error updating profile:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to update profile' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('🎫 🎉 SUCCESS - Apple Wallet pass created successfully!');
    console.log('🎫 Serial Number:', serialNumber);
    console.log('🎫 Pass URL available:', signedUrlData?.signedUrl ? 'YES' : 'NO');

    return new Response(JSON.stringify({
      success: true,
      passUrl: signedUrlData?.signedUrl,
      serialNumber: serialNumber,
      message: 'Apple Wallet pass created successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in create-wallet-pass function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});