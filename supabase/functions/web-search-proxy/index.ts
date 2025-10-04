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
  
  // Relaxed filtering: allow all queries except those with blocked keywords
  return { appropriate: true };
}

async function weatherFallback(query: string) {
  try {
    const q = query || '';
    const m = q.match(/in\s+([A-Za-z\s,]+?)(\?|$)/i);
    let place = m ? m[1].trim() : '';
    if (!place || /weather|today|forecast/i.test(place)) place = 'Bristol';

    const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(place)}&count=1&language=en&format=json`);
    const geo = await geoRes.json();
    const first = geo?.results?.[0];
    if (!first) return null;

    const { latitude, longitude, name, country } = first;
    const wxRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,wind_speed_10m,wind_gusts_10m,wind_direction_10m,weather_code&timezone=Europe/London`);
    const wx = await wxRes.json();
    const cur = wx?.current;
    if (!cur) return null;

    const codeMap: Record<number, string> = { 0: 'clear', 1: 'mainly clear', 2: 'partly cloudy', 3: 'overcast', 45: 'fog', 48: 'depositing rime fog', 51: 'light drizzle', 53: 'moderate drizzle', 55: 'dense drizzle', 56: 'freezing drizzle', 57: 'freezing drizzle', 61: 'light rain', 63: 'moderate rain', 65: 'heavy rain', 66: 'freezing rain', 67: 'freezing rain', 71: 'light snow', 73: 'moderate snow', 75: 'heavy snow', 77: 'snow grains', 80: 'rain showers', 81: 'rain showers', 82: 'heavy rain showers', 85: 'snow showers', 86: 'snow showers', 95: 'thunderstorm', 96: 'thunderstorm with hail', 99: 'thunderstorm with hail' };
    const desc = codeMap[cur.weather_code as number] || 'conditions';
    const answer = `Current weather in ${name}, ${country} at ${new Date(cur.time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}: ${cur.temperature_2m}°C (feels ${cur.apparent_temperature}°C), ${desc}. Wind ${cur.wind_speed_10m} km/h, humidity ${cur.relative_humidity_2m}%.`;

    return {
      query,
      answer,
      timestamp: new Date().toISOString(),
      sources: `Open-Meteo real-time data (${name}, ${country})`
    };
  } catch (e) {
    console.error('weatherFallback error:', e);
    return null;
  }
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
        model: 'perplexity/sonar-pro',
        messages: [
          {
            role: 'system',
            content: 'You are a live web research assistant. Use current information from the internet. Respond in British English with UK formats (°C, £, dd/mm/yyyy). Structure the answer as: 3–6 clear bullet points followed by a 1–2 sentence summary. Include an "As at" timestamp when relevant. Always include 3–5 source URLs at the end. Be precise and concise.'
          },
          {
            role: 'user',
            content: query
          }
        ],
        max_tokens: 1000,
        temperature: 0.2
      })
    });

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error('OpenRouter API error:', searchResponse.status, errorText);
      // Try weather fallback for weather-like queries
      if (/\b(weather|forecast|temperature|climate)\b/i.test(query)) {
        const fb = await weatherFallback(query);
        if (fb) {
          return new Response(JSON.stringify(fb), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
      }
      throw new Error(`Search service error: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();
    const answer = searchData.choices?.[0]?.message?.content || 'No results found';

    // Extract source URLs from the answer (best-effort)
    const urlRegex = /\bhttps?:\/\/[^\s)\]]+/g;
    const sourcesArr: string[] = Array.from(new Set((answer.match(urlRegex) || []).map((u: string) => u.replace(/[.,)\]]+$/, '')))).slice(0, 5);
    
    // Log successful search
    console.log(`✅ Web search completed for: "${query}"`);
    
    return new Response(
      JSON.stringify({
        query,
        answer,
        timestamp: new Date().toISOString(),
        sources: sourcesArr
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
