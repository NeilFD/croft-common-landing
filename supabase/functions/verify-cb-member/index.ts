// Public Crazy Bear member verification.
// Hit by Apple Wallet QR scans -> /den/verify?m=CB-XXXX-XXXX
// Returns minimal info (first name + last initial) so staff can confirm
// the bearer matches the card without leaking PII to passers-by.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function membershipFromUserId(uuid: string): string {
  const hex = uuid.replace(/-/g, '').toUpperCase();
  return `CB-${hex.slice(0, 4)}-${hex.slice(4, 8)}`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const raw = (url.searchParams.get('m') || '').trim().toUpperCase();
    const membershipNumber = raw.replace(/[^A-Z0-9-]/g, '').slice(0, 16);

    if (!/^CB-[A-F0-9]{4}-[A-F0-9]{4}$/.test(membershipNumber)) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Invalid membership number' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Membership number is derived from user_id hex (first 8 chars).
    // Reconstruct the uuid prefix to filter server-side.
    const hex = membershipNumber.replace('CB-', '').replace('-', '').toLowerCase();
    const uuidPrefix = `${hex.slice(0, 8)}-`;

    const { data: members, error } = await supabase
      .from('cb_members')
      .select('user_id, first_name, last_name, created_at')
      .ilike('user_id', `${uuidPrefix}%`)
      .limit(5);

    if (error) {
      console.error('verify-cb-member lookup failed:', error);
      return new Response(
        JSON.stringify({ ok: false, error: 'Lookup failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const match = (members || []).find((m: any) => membershipFromUserId(m.user_id) === membershipNumber);

    if (!match) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Member not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const first = (match.first_name || '').trim();
    const last = (match.last_name || '').trim();
    const initial = last ? `${last[0]}.` : '';
    const memberSince = match.created_at
      ? (() => {
          const d = new Date(match.created_at);
          return `${String(d.getMonth() + 1).padStart(2, '0')} / ${String(d.getFullYear()).slice(-2)}`;
        })()
      : '— / —';

    return new Response(
      JSON.stringify({
        ok: true,
        membership_number: membershipNumber,
        display_name: [first, initial].filter(Boolean).join(' ') || 'Member',
        member_since: memberSince,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ ok: false, error: err?.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
