import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Content filtering - block inappropriate topics
const BLOCKED_KEYWORDS = [
  'porn', 'xxx', 'adult content', 'sex', 'nude', 'naked',
  'violence', 'kill', 'murder', 'weapon', 'drug',
  'celebrity gossip', 'kardashian', 'reality tv',
  'gambling', 'casino', 'betting',
  'piracy', 'torrent', 'crack', 'hack'
];

const WORK_APPROPRIATE_CATEGORIES = [
  'weather', 'forecast', 'temperature', 'climate',
  'news', 'business', 'finance', 'market', 'economy',
  'regulation', 'law', 'compliance', 'food safety',
  'exchange rate', 'currency',
  'public holiday', 'bank holiday',
  'company', 'industry', 'trade',
  'definition', 'what is', 'how to', 'guide',
  'technical', 'documentation', 'tutorial'
];

function isQueryAppropriate(query: string): { appropriate: boolean; reason?: string } {
  const lowerQuery = query.toLowerCase();
  
  // Check for blocked keywords
  for (const blocked of BLOCKED_KEYWORDS) {
    if (lowerQuery.includes(blocked)) {
      return { 
        appropriate: false, 
        reason: 'Query contains inappropriate content. I can only help with work-related information.' 
      };
    }
  }
  
  // Check if query matches work-appropriate categories
  const hasWorkCategory = WORK_APPROPRIATE_CATEGORIES.some(category => 
    lowerQuery.includes(category)
  );
  
  // If no work category detected but query seems like entertainment/gossip
  const entertainmentTerms = ['funny', 'video', 'meme', 'game', 'movie', 'tv show', 'celebrity'];
  const seemsEntertainment = entertainmentTerms.some(term => lowerQuery.includes(term));
  
  if (seemsEntertainment && !hasWorkCategory) {
    return { 
      appropriate: false, 
      reason: 'I focus on work-related queries. I can help with weather, business news, regulations, and factual information.' 
    };
  }
  
  return { appropriate: true };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    
    if (!query || typeof query !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Query parameter required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Content filtering
    const contentCheck = isQueryAppropriate(query);
    if (!contentCheck.appropriate) {
      console.log(`🚫 Blocked query: "${query}" - ${contentCheck.reason}`);
      return new Response(
        JSON.stringify({ 
          error: contentCheck.reason,
          blocked: true 
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🔍 Approved web search query: "${query}"`);

    // Make web search request using Perplexity via OpenRouter
    const openRouterKey = Deno.env.get('OPENROUTER_API_KEY');
    
    if (!openRouterKey) {
      throw new Error('OPENROUTER_API_KEY not configured');
    }

    const searchResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://www.croftcommontest.com',
        'X-Title': 'Croft Common Management Assistant'
      },
      body: JSON.stringify({
        model: 'perplexity/llama-3.1-sonar-large-128k-online',
        messages: [
          {
            role: 'user',
            content: `Provide a concise, factual answer to: ${query}. Focus on current, accurate information. Include the date of information if relevant.`
          }
        ],
        max_tokens: 500,
        temperature: 0.3
      })
    });

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error('OpenRouter API error:', searchResponse.status, errorText);
      throw new Error(`Search service error: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();
    const answer = searchData.choices?.[0]?.message?.content || 'No results found';

    // Log successful search
    console.log(`✅ Web search completed for: "${query}"`);

    return new Response(
      JSON.stringify({
        query,
        answer,
        timestamp: new Date().toISOString(),
        sources: 'Internet search via Perplexity'
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in web-search-proxy:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        details: 'Unable to complete web search'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
