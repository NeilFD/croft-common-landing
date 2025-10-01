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
    const { feedbackData, reportType, dateRange } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Calculate statistics
    const totalFeedback = feedbackData.length;
    const avgOverall = feedbackData.reduce((sum: number, f: any) => sum + (f.overall_rating || 0), 0) / totalFeedback;
    const avgHospitality = feedbackData.reduce((sum: number, f: any) => sum + (f.hospitality_rating || 0), 0) / totalFeedback;
    const avgFood = feedbackData.reduce((sum: number, f: any) => sum + (f.food_rating || 0), 0) / totalFeedback;
    const avgDrink = feedbackData.reduce((sum: number, f: any) => sum + (f.drink_rating || 0), 0) / totalFeedback;
    const avgTeam = feedbackData.reduce((sum: number, f: any) => sum + (f.team_rating || 0), 0) / totalFeedback;
    const avgVenue = feedbackData.reduce((sum: number, f: any) => sum + (f.venue_rating || 0), 0) / totalFeedback;
    const avgPrice = feedbackData.reduce((sum: number, f: any) => sum + (f.price_rating || 0), 0) / totalFeedback;
    
    const withComments = feedbackData.filter((f: any) => f.message?.trim()).length;
    const anonymousCount = feedbackData.filter((f: any) => f.is_anonymous).length;

    const reportPrompts: Record<string, string> = {
      summary: `Create a concise executive summary report of customer feedback covering ${totalFeedback} submissions over ${dateRange}. Include overall sentiment, key metrics, and top 3 action items.`,
      detailed: `Create a detailed analysis report of ${totalFeedback} customer feedback submissions over ${dateRange}. Analyze patterns, trends, and provide in-depth insights into each rating category with specific examples from comments.`,
      trends: `Analyze trends and patterns in ${totalFeedback} customer feedback submissions over ${dateRange}. Identify improving vs declining areas, emerging themes, and predictive insights.`,
      sentiment: `Perform a deep sentiment analysis on ${totalFeedback} customer feedback submissions over ${dateRange}. Analyze emotional tone, satisfaction drivers, pain points, and customer expectations.`
    };

    const prompt = `${reportPrompts[reportType]}

Statistics:
- Total Feedback: ${totalFeedback}
- Average Overall: ${avgOverall.toFixed(2)}/5
- Average Hospitality: ${avgHospitality.toFixed(2)}/5
- Average Food: ${avgFood.toFixed(2)}/5
- Average Drink: ${avgDrink.toFixed(2)}/5
- Average Team: ${avgTeam.toFixed(2)}/5
- Average Venue: ${avgVenue.toFixed(2)}/5
- Average Price: ${avgPrice.toFixed(2)}/5
- With Comments: ${withComments}
- Anonymous: ${anonymousCount}

Sample Comments:
${feedbackData.slice(0, 10).map((f: any) => f.message).filter(Boolean).join('\n\n')}

Format the report in HTML with proper headings, bullet points, and sections.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are Cleo, an expert report writer for hospitality businesses. Create professional, actionable reports.' },
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
    const reportContent = aiData.choices?.[0]?.message?.content || '';

    const reportTypeLabels: Record<string, string> = {
      summary: 'Executive Summary Report',
      detailed: 'Detailed Analysis Report',
      trends: 'Trend Analysis Report',
      sentiment: 'Sentiment Deep Dive Report'
    };

    return new Response(
      JSON.stringify({
        title: reportTypeLabels[reportType],
        period: `Period: ${dateRange}`,
        content: reportContent,
        statistics: {
          totalFeedback,
          avgOverall,
          avgHospitality,
          avgFood,
          avgDrink,
          avgTeam,
          avgVenue,
          avgPrice,
          withComments,
          anonymousCount
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error generating report:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
