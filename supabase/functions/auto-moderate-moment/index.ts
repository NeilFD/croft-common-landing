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
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Listen for database notifications
    const { data, error } = await supabase
      .channel('moderate_moment')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'member_moments'
      }, async (payload) => {
        console.log('New moment detected for moderation:', payload.new.id)
        
        // Call the existing moderation function
        try {
          const moderationResponse = await fetch(`${supabaseUrl}/functions/v1/moderate-moment-image`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${serviceRoleKey}`
            },
            body: JSON.stringify({
              imageUrl: payload.new.image_url,
              momentId: payload.new.id
            })
          })
          
          if (!moderationResponse.ok) {
            console.error('Moderation failed:', await moderationResponse.text())
          } else {
            console.log('Moderation completed for moment:', payload.new.id)
          }
        } catch (error) {
          console.error('Error calling moderation function:', error)
        }
      })
      .subscribe()

    if (error) {
      console.error('Error setting up subscription:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to setup subscription' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    return new Response(
      JSON.stringify({ message: 'Auto-moderation listener started' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in auto-moderate-moment function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})