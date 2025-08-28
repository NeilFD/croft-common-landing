// This function is now deprecated as we use database triggers
// The trigger_ai_moderation function in the database handles moderation automatically
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  return new Response(
    JSON.stringify({ 
      message: 'Auto-moderation is now handled by database triggers',
      deprecated: true
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})