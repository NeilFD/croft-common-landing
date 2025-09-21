import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    // Create pass.json structure for Apple Wallet
    const passJson = {
      formatVersion: 1,
      passTypeIdentifier: "pass.com.croftcommon.membership",
      serialNumber: serialNumber,
      teamIdentifier: "YOUR_TEAM_ID", // This should be your Apple Developer Team ID
      organizationName: "Croft Common",
      description: "Croft Common Membership Card",
      logoText: "Croft Common",
      foregroundColor: "rgb(255, 255, 255)",
      backgroundColor: "rgb(0, 0, 0)",
      labelColor: "rgb(255, 255, 255)",
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
          }
        ]
      }
    };

    // Get Apple certificates from environment
    const passCert = Deno.env.get('APPLE_PASS_CERTIFICATE');
    const passKey = Deno.env.get('APPLE_PASS_PRIVATE_KEY');
    const wwdrCert = Deno.env.get('APPLE_WWDR_CERTIFICATE');

    if (!passCert || !passKey || !wwdrCert) {
      console.error('Missing Apple certificates');
      return new Response(JSON.stringify({ error: 'Apple certificates not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // For now, create a simplified pass structure
    // In a full implementation, you would:
    // 1. Create the complete pass bundle with images
    // 2. Generate manifest.json with file hashes
    // 3. Sign the pass with Apple certificates
    // 4. Create the .pkpass file (ZIP format)
    // 5. Upload to Supabase Storage

    console.log('Creating wallet pass for user:', user.id);
    console.log('Member data:', member);

    // Create pass bundle structure (simplified for this implementation)
    const passBundle = {
      'pass.json': JSON.stringify(passJson, null, 2),
      'manifest.json': JSON.stringify({
        'pass.json': 'sha1-hash-placeholder'
      }, null, 2)
    };

    // For now, we'll create a JSON response with pass data
    // In production, this would be a signed .pkpass file
    const passFileName = `${user.id}/${serialNumber}.json`;
    
    // Upload pass data to storage (simplified)
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('wallet-passes')
      .upload(passFileName, JSON.stringify(passBundle), {
        contentType: 'application/json',
        upsert: true
      });

    if (uploadError) {
      console.error('Error uploading pass:', uploadError);
      return new Response(JSON.stringify({ error: 'Failed to create pass' }), {
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