import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { feedbackData, dateRange } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Prepare feedback summary for AI analysis
    const feedbackSummary = feedbackData.map((f: any) => ({
      overall: f.overall_rating,
      categories: {
        hospitality: f.hospitality_rating,
        food: f.food_rating,
        drink: f.drink_rating,
        team: f.team_rating,
        venue: f.venue_rating,
        price: f.price_rating
      },
      comment: f.message,
      anonymous: f.is_anonymous
    }));

    const prompt = `You are Cleo, an AI assistant analyzing customer feedback for a venue/hospitality business. 

Here's the feedback data from the last ${dateRange}:
${JSON.stringify(feedbackSummary, null, 2)}

Please provide:
1. Overall sentiment (positive, neutral, or negative) with confidence level
2. Key positives (3-5 specific things customers loved)
3. Key negatives / areas for improvement (3-5 specific issues to address)
4. Actionable recommendations (3-5 concrete steps to improve)

Focus on patterns across multiple feedback entries. Be specific and actionable.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are Cleo, an expert customer feedback analyst for hospitality businesses. Provide clear, actionable insights.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI gateway error:', aiResponse.status, errorText);
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const analysisText = aiData.choices?.[0]?.message?.content || '';

    // Parse the AI response to extract structured data
    const lines = analysisText.split('\n');
    let overallSentiment = 'neutral';
    let confidence = 0.7;
    const keyPositives: string[] = [];
    const keyNegatives: string[] = [];
    const recommendations: string[] = [];
    
    let currentSection = '';
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      
      if (trimmed.toLowerCase().includes('overall sentiment')) {
        if (trimmed.toLowerCase().includes('positive')) overallSentiment = 'positive';
        else if (trimmed.toLowerCase().includes('negative')) overallSentiment = 'negative';
        
        const confMatch = trimmed.match(/(\d+)%/);
        if (confMatch) confidence = parseInt(confMatch[1]) / 100;
      } else if (trimmed.toLowerCase().includes('key positive') || trimmed.toLowerCase().includes('positives:')) {
        currentSection = 'positives';
      } else if (trimmed.toLowerCase().includes('key negative') || trimmed.toLowerCase().includes('improvement') || trimmed.toLowerCase().includes('negatives:')) {
        currentSection = 'negatives';
      } else if (trimmed.toLowerCase().includes('recommendation')) {
        currentSection = 'recommendations';
      } else if (trimmed.match(/^[\d\-\*•]+/) && currentSection) {
        const cleanText = trimmed.replace(/^[\d\-\*•\.\)]+\s*/, '').trim();
        if (cleanText) {
          if (currentSection === 'positives') keyPositives.push(cleanText);
          else if (currentSection === 'negatives') keyNegatives.push(cleanText);
          else if (currentSection === 'recommendations') recommendations.push(cleanText);
        }
      }
    }

    return new Response(
      JSON.stringify({
        overallSentiment,
        confidence,
        keyPositives,
        keyNegatives,
        recommendations,
        rawAnalysis: analysisText
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error analyzing feedback:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
