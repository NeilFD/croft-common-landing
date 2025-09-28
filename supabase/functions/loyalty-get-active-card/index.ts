import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper: paginate through auth users to find by email (admin API lacks direct getByEmail)
async function findUserIdByEmail(supabase: ReturnType<typeof createClient>, email: string): Promise<string | null> {
  try {
    let page = 1;
    const perPage = 100;
    const target = email.trim().toLowerCase();
    for (let i = 0; i < 20; i++) { // safety cap 2000 users
      const { data, error } = await (supabase as any).auth.admin.listUsers({ page, perPage });
      if (error) {
        console.error('listUsers error', error);
        return null;
      }
      const users = (data?.users ?? []) as Array<{ id: string; email?: string | null }>;
      const match = users.find(u => (u.email || '').trim().toLowerCase() === target);
      if (match) return match.id;
      if (!users.length) return null; // no more pages
      page++;
    }
    return null;
  } catch (e) {
    console.error('findUserIdByEmail error', e);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    const { userHandle } = await req.json();
    if (!userHandle) {
      return new Response(JSON.stringify({ error: 'missing_params' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 1) Resolve membership link by userHandle
    const { data: link, error: linkErr } = await supabase
      .from('membership_links')
      .select('email, is_verified')
      .eq('user_handle', userHandle)
      .maybeSingle();

    if (linkErr) throw linkErr;
    if (!link || !link.is_verified) {
      return new Response(JSON.stringify({ linked: false }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 2) Must be an active subscriber
    const normEmail = String(link.email).trim().toLowerCase();
    const { data: sub, error: subErr } = await supabase
      .from('subscribers')
      .select('id, is_active')
      .eq('email', normEmail)
      .eq('is_active', true)
      .maybeSingle();

    if (subErr) throw subErr;
    if (!sub) {
      return new Response(JSON.stringify({ linked: false, reason: 'not_subscribed' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 3) Try to find an auth user for this email (loyalty is keyed by user_id)
    const userId = await findUserIdByEmail(supabase as any, normEmail);
    if (!userId) {
      return new Response(JSON.stringify({ linked: true, email: normEmail, userHasAccount: false }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 4) Fetch active (incomplete) loyalty card for that user
    const { data: cards, error: cardsErr } = await supabase
      .from('loyalty_cards')
      .select('*')
      .eq('user_id', userId)
      .eq('is_complete', false)
      .order('created_at', { ascending: true })
      .limit(1);

    if (cardsErr) throw cardsErr;

    const card = (cards && cards[0]) || null;
    if (!card) {
      return new Response(JSON.stringify({ linked: true, email: normEmail, userHasAccount: true, hasCard: false }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 5) Fetch entries and create signed URLs to display publicly (read-only)
    const { data: rawEntries, error: entriesErr } = await supabase
      .from('loyalty_entries')
      .select('id, card_id, index, kind, image_url, created_at')
      .eq('card_id', card.id)
      .order('index', { ascending: true });
    if (entriesErr) throw entriesErr;

    // Create signed URLs via storage (1 hour)
    const BUCKET = 'loyalty';
    const entriesWithUrls = await Promise.all((rawEntries ?? []).map(async (e: any) => {
      let signedUrl: string | undefined = undefined;
      try {
        const { data: urlData, error: urlErr } = await supabase.storage.from(BUCKET).createSignedUrl(e.image_url, 60 * 60);
        if (!urlErr) signedUrl = urlData?.signedUrl;
      } catch {}
      return { ...e, signedUrl };
    }));

    return new Response(
      JSON.stringify({ linked: true, email: normEmail, userHasAccount: true, hasCard: true, card, entries: entriesWithUrls }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    console.error('loyalty-get-active-card error', e);
    return new Response(JSON.stringify({ error: 'server_error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
