import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { JSZip } from "https://deno.land/x/jszip@0.11.0/mod.ts";
import { encode as base64Encode } from "https://deno.land/std@0.190.0/encoding/base64.ts";
import { encode as hexEncode } from "https://deno.land/std@0.190.0/encoding/hex.ts";

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

// Utility function to calculate SHA1 hash
async function sha1(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-1', dataBuffer);
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

    console.log('Creating wallet pass for user:', user.id);
    console.log('Member data:', member);

    // Create pass bundle with required files
    const zip = new JSZip();
    
    // Add pass.json
    const passJsonString = JSON.stringify(passJson, null, 2);
    zip.addFile("pass.json", passJsonString);

    // Create basic icon files (1x1 transparent PNG as placeholder)
    const transparentPng = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77wgAAAABJRU5ErkJggg==";
    const iconData = Uint8Array.from(atob(transparentPng), c => c.charCodeAt(0));
    
    zip.addFile("icon.png", iconData);
    zip.addFile("icon@2x.png", iconData);
    zip.addFile("icon@3x.png", iconData);
    zip.addFile("logo.png", iconData);
    zip.addFile("logo@2x.png", iconData);

    // Generate manifest.json with SHA1 hashes
    const manifest: Record<string, string> = {};
    
    // Calculate SHA1 for each file
    manifest["pass.json"] = await sha1(passJsonString);
    manifest["icon.png"] = await sha1(String.fromCharCode(...iconData));
    manifest["icon@2x.png"] = await sha1(String.fromCharCode(...iconData));
    manifest["icon@3x.png"] = await sha1(String.fromCharCode(...iconData));
    manifest["logo.png"] = await sha1(String.fromCharCode(...iconData));
    manifest["logo@2x.png"] = await sha1(String.fromCharCode(...iconData));

    const manifestString = JSON.stringify(manifest, null, 2);
    zip.addFile("manifest.json", manifestString);

    // For production: Add signature file (simplified for now)
    // In a full implementation, you would create a PKCS#7 signature here
    const signatureData = "PLACEHOLDER_SIGNATURE";
    zip.addFile("signature", signatureData);

    // Generate the ZIP file
    const zipArrayBuffer = await zip.generateAsync({ type: "arraybuffer" });
    const zipUint8Array = new Uint8Array(zipArrayBuffer);

    // Upload .pkpass file to storage
    const passFileName = `${user.id}/${serialNumber}.pkpass`;
    
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('wallet-passes')
      .upload(passFileName, zipUint8Array, {
        contentType: 'application/vnd.apple.pkpass',
        upsert: true
      });

    if (uploadError) {
      console.error('Error uploading pass:', uploadError);
      return new Response(JSON.stringify({ error: 'Failed to create pass file' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get signed URL for the pass
    const { data: signedUrlData } = await supabaseClient.storage
      .from('wallet-passes')
      .createSignedUrl(passFileName, 3600); // 1 hour expiry

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
      console.error('Error updating profile:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to update profile' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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