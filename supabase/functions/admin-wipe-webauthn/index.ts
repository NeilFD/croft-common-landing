import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-token",
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    const adminToken = req.headers.get('x-admin-token');
    const expected = Deno.env.get('ADMIN_WIPE_TOKEN');
    if (!expected || adminToken !== expected) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { email, userHandle } = await req.json();
    if (!email && !userHandle) throw new Error('Provide email or userHandle');

    // Collect handles from membership tables for this email
    const handles = new Set<string>();

    if (userHandle && typeof userHandle === 'string') handles.add(userHandle);

    if (email && typeof email === 'string') {
      const { data: linkRows } = await supabase
        .from('membership_links')
        .select('user_handle')
        .eq('email', email);
      (linkRows ?? []).forEach((r: any) => r?.user_handle && handles.add(r.user_handle));

      const { data: codeRows } = await supabase
        .from('membership_codes')
        .select('user_handle')
        .eq('email', email);
      (codeRows ?? []).forEach((r: any) => r?.user_handle && handles.add(r.user_handle));
    }

    const handleList = Array.from(handles);

    // Delete membership rows for the email
    let membershipLinksDeleted = 0;
    let membershipCodesDeleted = 0;

    if (email) {
      const { data: delLinks } = await supabase
        .from('membership_links')
        .delete()
        .eq('email', email)
        .select('id');
      membershipLinksDeleted = (delLinks ?? []).length;

      const { data: delCodes } = await supabase
        .from('membership_codes')
        .delete()
        .eq('email', email)
        .select('id');
      membershipCodesDeleted = (delCodes ?? []).length;
    }

    // Delete WebAuthn rows for the handles
    let credentialsDeleted = 0;
    let usersDeleted = 0;
    let challengesDeleted = 0;

    if (handleList.length > 0) {
      const { data: delCreds } = await supabase
        .from('webauthn_credentials')
        .delete()
        .in('user_handle', handleList)
        .select('id');
      credentialsDeleted = (delCreds ?? []).length;

      const { data: delUsers } = await supabase
        .from('webauthn_users')
        .delete()
        .in('user_handle', handleList)
        .select('user_handle');
      usersDeleted = (delUsers ?? []).length;

      const { data: delChallenges } = await supabase
        .from('webauthn_challenges')
        .delete()
        .in('user_handle', handleList)
        .select('id');
      challengesDeleted = (delChallenges ?? []).length;
    }

    console.log('admin-wipe-webauthn', { email, handleCount: handleList.length, membershipLinksDeleted, membershipCodesDeleted, credentialsDeleted, usersDeleted, challengesDeleted });

    return new Response(
      JSON.stringify({
        ok: true,
        email,
        handles: handleList,
        membershipLinksDeleted,
        membershipCodesDeleted,
        credentialsDeleted,
        usersDeleted,
        challengesDeleted,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('admin-wipe-webauthn error', error);
    return new Response(JSON.stringify({ error: String(error?.message ?? error) }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
