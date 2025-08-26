import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get auth user
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      console.error('Auth error:', userError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get streak data
    const { data: streakData } = await supabase
      .from('member_streaks')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // Get extended profile
    const { data: profileData } = await supabase
      .from('member_profiles_extended')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // Get basic profile
    const { data: basicProfile } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('user_id', user.id)
      .single()

    // Get recent check-ins for calendar
    const { data: recentCheckins } = await supabase
      .from('member_check_ins')
      .select('check_in_date')
      .eq('user_id', user.id)
      .order('check_in_date', { ascending: false })
      .limit(31) // Last month of check-ins

    // Get this month's receipts for spend calculation
    const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM
    const { data: monthlyReceipts } = await supabase
      .from('member_receipts')
      .select('total_amount, currency')
      .eq('user_id', user.id)
      .gte('receipt_date', currentMonth + '-01')
      .eq('processing_status', 'completed')

    // Get recent visits (last 5 check-ins)
    const { data: recentVisits } = await supabase
      .from('member_check_ins')
      .select('check_in_date, check_in_timestamp, entrance_slug')
      .eq('user_id', user.id)
      .order('check_in_timestamp', { ascending: false })
      .limit(5)

    // Get current loyalty card status
    const { data: loyaltyCard } = await supabase
      .from('loyalty_cards')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_complete', false)
      .single()

    // Calculate monthly spend
    const monthlySpend = monthlyReceipts?.reduce((total, receipt) => {
      return total + parseFloat(receipt.total_amount || '0')
    }, 0) || 0

    // Auto-generate insights
    const insights = {
      favorite_venue: profileData?.favorite_venue || 'Not set',
      favorite_drink: profileData?.favorite_drink || 'Not set',
      visit_time_preference: profileData?.visit_time_preference || 'Not determined',
      total_visits: streakData?.total_check_ins || 0,
      monthly_spend: monthlySpend
    }

    return new Response(
      JSON.stringify({
        user: {
          id: user.id,
          email: user.email,
          first_name: basicProfile?.first_name || '',
          last_name: basicProfile?.last_name || ''
        },
        streak: streakData || {
          current_streak: 0,
          longest_streak: 0,
          total_check_ins: 0,
          last_check_in_date: null
        },
        profile: profileData || {
          display_name: `${basicProfile?.first_name || ''} ${basicProfile?.last_name || ''}`.trim(),
          tier_badge: 'bronze',
          join_date: new Date().toISOString()
        },
        recent_checkins: recentCheckins || [],
        recent_visits: recentVisits || [],
        monthly_spend: monthlySpend,
        loyalty_card: loyaltyCard,
        insights
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in member-stats function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})