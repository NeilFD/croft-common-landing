import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Get the menu items, ordered by category and sort order
    const { data: menuItems, error } = await supabaseClient
      .from("lunch_menu")
      .select("*")
      .eq("is_available", true)
      .order("category")
      .order("sort_order");

    if (error) {
      console.error("Error fetching menu:", error);
      throw error;
    }

    // Group items by category
    const sandwiches = menuItems?.filter(item => item.category === 'sandwich') || [];
    const beverages = menuItems?.filter(item => item.category === 'beverage') || [];

    return new Response(
      JSON.stringify({
        sandwiches,
        beverages,
        totalItems: menuItems?.length || 0
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in get-lunch-menu:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});