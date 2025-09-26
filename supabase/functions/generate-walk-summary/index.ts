import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WalkData {
  walkCard: {
    title: string;
    created_at: string;
    time_block?: string;
    weather_preset?: string;
    weather_temp_c?: number;
    weather_notes?: string;
  };
  venues: Array<{
    id: string;
    name: string;
    max_capacity?: number;
  }>;
  walkEntries: Array<{
    venue_id: string;
    people_count?: number;
    laptop_count?: number;
    capacity_percentage?: number;
    notes?: string;
    flag_anomaly: boolean;
    recorded_at: string;
  }>;
  geoAreas: Array<{
    id: string;
    name: string;
  }>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const { walkData }: { walkData: WalkData } = await req.json();
    
    // Check if this is an evening walk (when laptop usage isn't relevant)
    const isEveningWalk = walkData.walkCard.time_block && 
      ['Early Evening', 'Evening', 'Late'].includes(walkData.walkCard.time_block);
    
    // Create a structured summary of the walk data
    const walkDate = new Date(walkData.walkCard.created_at).toLocaleDateString('en-GB');
    const totalVenues = new Set(walkData.walkEntries.map(e => e.venue_id)).size;
    const totalVisits = walkData.walkEntries.length;
    const totalPeople = walkData.walkEntries.reduce((sum, e) => sum + (e.people_count || 0), 0);
    const totalLaptops = walkData.walkEntries.reduce((sum, e) => sum + (e.laptop_count || 0), 0);
    const anomalies = walkData.walkEntries.filter(e => e.flag_anomaly).length;
    const notesWithContent = walkData.walkEntries.filter(e => e.notes && e.notes.trim()).length;
    
    // Calculate capacity and occupancy metrics
    const entriesWithCapacity = walkData.walkEntries.filter(e => e.capacity_percentage !== null && e.capacity_percentage !== undefined);
    const avgCapacityUtilization = entriesWithCapacity.length > 0 
      ? (entriesWithCapacity.reduce((sum, e) => sum + (e.capacity_percentage || 0), 0) / entriesWithCapacity.length).toFixed(1)
      : 'N/A';
    const peakCapacity = entriesWithCapacity.length > 0 
      ? Math.max(...entriesWithCapacity.map(e => e.capacity_percentage || 0)).toFixed(1) + '%'
      : 'N/A';
    
    // Venue capacity analysis
    const venueCapacityData = walkData.walkEntries.reduce((acc, entry) => {
      const venue = walkData.venues.find(v => v.id === entry.venue_id);
      if (venue && venue.max_capacity && entry.people_count !== null) {
        const occupancyRate = ((entry.people_count || 0) / venue.max_capacity * 100).toFixed(1);
        if (!acc[venue.id]) {
          acc[venue.id] = { name: venue.name, maxCapacity: venue.max_capacity, visits: [] };
        }
        acc[venue.id].visits.push({ people: entry.people_count || 0, occupancy: parseFloat(occupancyRate) });
      }
      return acc;
    }, {} as Record<string, { name: string; maxCapacity: number; visits: { people: number; occupancy: number }[] }>);

    // Prepare data for AI analysis
    const walkContext = `
Field Research Walk: ${walkData.walkCard.title}
Date: ${walkDate}
Weather: ${walkData.walkCard.weather_preset || 'Not recorded'}${walkData.walkCard.weather_temp_c ? `, ${walkData.walkCard.weather_temp_c}°C` : ''}
${walkData.walkCard.weather_notes ? `Weather Notes: ${walkData.walkCard.weather_notes}` : ''}

Statistics:
- Total venues visited: ${totalVenues}
- Total visits recorded: ${totalVisits}
- Total people observed: ${totalPeople}${isEveningWalk ? '' : `\n- Total laptops observed: ${totalLaptops}`}
- Average capacity utilization: ${avgCapacityUtilization}${avgCapacityUtilization !== 'N/A' ? '%' : ''}
- Peak capacity reached: ${peakCapacity}
- Anomalies flagged: ${anomalies}
- Visits with notes: ${notesWithContent}

Areas with recorded visits: ${walkData.geoAreas.map(area => area.name).join(', ')}

Capacity Analysis by Venue:
${Object.values(venueCapacityData).map(venue => {
  const avgOccupancy = (venue.visits.reduce((sum, v) => sum + v.occupancy, 0) / venue.visits.length).toFixed(1);
  const maxOccupancy = Math.max(...venue.visits.map(v => v.occupancy)).toFixed(1);
  const maxPeople = Math.max(...venue.visits.map(v => v.people));
  return `- ${venue.name} (capacity: ${venue.maxCapacity}): Avg ${avgOccupancy}% utilization, Peak ${maxOccupancy}% (${maxPeople} people)`;
}).join('\n')}

Visit details with notes:
${walkData.walkEntries
  .filter(entry => entry.notes && entry.notes.trim())
  .map(entry => {
    const venue = walkData.venues.find(v => v.id === entry.venue_id);
    const time = new Date(entry.recorded_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const laptopInfo = isEveningWalk ? '' : `, ${entry.laptop_count || 0} laptops`;
    return `- ${time} at ${venue?.name || 'Unknown venue'}: ${entry.notes} (${entry.people_count || 0} people${laptopInfo})${entry.flag_anomaly ? ' [ANOMALY FLAGGED]' : ''}`;
  }).join('\n')}
`;

    console.log('Generating summary for walk data:', walkContext);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Create a concise, objective summary of this field research walk. Present key findings and patterns based solely on the provided data. Use factual language and focus on quantifiable observations. ${isEveningWalk ? 'Note: This is an evening walk - laptop usage data is not relevant.' : ''} Keep to 1-2 brief paragraphs with specific statistics and notable patterns only.`
          },
          {
            role: 'user',
            content: `Here's what happened during this field research walk - what are the key takeaways and interesting observations?\n\n${walkContext}`
          }
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API failed: ${response.status}`);
    }

    const data = await response.json();
    const summary = data.choices[0]?.message?.content || 'Unable to generate summary';

    console.log('Generated summary:', summary);

    return new Response(JSON.stringify({ summary }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating walk summary:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        summary: 'Summary generation temporarily unavailable. Please refer to the detailed statistics above.'
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});