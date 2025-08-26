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

    const { entrance_slug } = await req.json()

    if (!entrance_slug) {
      return new Response(
        JSON.stringify({ error: 'entrance_slug is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format

    // Check if user already checked in today (idempotent)
    const { data: existingCheckin } = await supabase
      .from('member_check_ins')
      .select('*')
      .eq('user_id', user.id)
      .eq('check_in_date', today)
      .single()

    if (existingCheckin) {
      // Return existing check-in data
      const { data: streakData } = await supabase
        .from('member_streaks')
        .select('current_streak, longest_streak, total_check_ins')
        .eq('user_id', user.id)
        .single()

      return new Response(
        JSON.stringify({
          message: 'Already checked in today',
          check_in: existingCheckin,
          streak: streakData || { current_streak: 1, longest_streak: 1, total_check_ins: 1 }
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Create new check-in (triggers will handle streak calculation)
    const { data: newCheckin, error: checkinError } = await supabase
      .from('member_check_ins')
      .insert({
        user_id: user.id,
        entrance_slug,
        check_in_date: today
      })
      .select()
      .single()

    if (checkinError) {
      console.error('Check-in error:', checkinError)
      return new Response(
        JSON.stringify({ error: 'Failed to create check-in' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get updated streak data
    const { data: streakData } = await supabase
      .from('member_streaks')
      .select('current_streak, longest_streak, total_check_ins')
      .eq('user_id', user.id)
      .single()

    return new Response(
      JSON.stringify({
        message: 'Check-in successful',
        check_in: newCheckin,
        streak: streakData || { current_streak: 1, longest_streak: 1, total_check_ins: 1 }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in member-checkin function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})