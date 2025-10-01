import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Brain, TrendingUp, MessageCircle, ThumbsUp, ThumbsDown, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface FeedbackAnalyticsProps {
  data: any[];
  dateRange: string;
}

export function FeedbackAnalytics({ data, dateRange }: FeedbackAnalyticsProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Generate AI sentiment analysis
  const { data: sentimentAnalysis, isLoading: isLoadingSentiment, refetch: refetchSentiment } = useQuery({
    queryKey: ['feedback-sentiment', dateRange, data.length],
    queryFn: async () => {
      if (!data.length) return null;

      const { data: analysisData, error } = await supabase.functions.invoke('analyze-feedback-sentiment', {
        body: { 
          feedbackData: data,
          dateRange 
        }
      });

      if (error) throw error;
      return analysisData;
    },
    enabled: data.length > 0
  });

  const manualAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      await refetchSentiment();
      toast.success('Sentiment analysis updated');
    } catch (error) {
      toast.error('Failed to analyze feedback');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Calculate category averages
  const categoryAverages = useMemo(() => {
    if (!data.length) return {};

    const categories = [
      { key: 'hospitality', field: 'hospitality_rating' },
      { key: 'food', field: 'food_rating' },
      { key: 'drink', field: 'drink_rating' },
      { key: 'team', field: 'team_rating' },
      { key: 'venue', field: 'venue_rating' },
      { key: 'price', field: 'price_rating' },
      { key: 'overall', field: 'overall_rating' }
    ];
    
    return categories.reduce((acc, cat) => {
      const scores = data
        .map(f => f[cat.field as keyof typeof f] as number)
        .filter(s => s !== null && s !== undefined);
      
      acc[cat.key] = {
        avg: scores.length > 0 ? scores.reduce((sum, s) => sum + s, 0) / scores.length : 0,
        count: scores.length
      };
      
      return acc;
    }, {} as Record<string, { avg: number; count: number }>);
  }, [data]);

  return (
    <div className="space-y-6">
      {/* AI Analysis Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                AI Sentiment Analysis
              </CardTitle>
              <CardDescription>Powered by Cleo AI</CardDescription>
            </div>
            <Button 
              onClick={manualAnalyze} 
              disabled={isAnalyzing || isLoadingSentiment}
              variant="outline"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {isAnalyzing ? 'Analyzing...' : 'Refresh Analysis'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingSentiment ? (
            <div className="text-center py-8 text-muted-foreground">
              Cleo is analyzing feedback...
            </div>
          ) : sentimentAnalysis ? (
            <div className="space-y-6">
              {/* Overall Sentiment */}
              <div>
                <h4 className="font-semibold mb-2">Overall Sentiment</h4>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-lg">{sentimentAnalysis.overallSentiment}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Confidence: {(sentimentAnalysis.confidence * 100).toFixed(0)}%
                  </div>
                </div>
              </div>

              {/* Key Positives */}
              {sentimentAnalysis.keyPositives?.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <ThumbsUp className="w-4 h-4 text-green-500" />
                    Key Positives
                  </h4>
                  <ul className="space-y-2">
                    {sentimentAnalysis.keyPositives.map((positive: string, idx: number) => (
                      <li key={idx} className="p-3 bg-green-50 dark:bg-green-950 rounded-lg text-sm">
                        {positive}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Key Negatives */}
              {sentimentAnalysis.keyNegatives?.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <ThumbsDown className="w-4 h-4 text-red-500" />
                    Areas for Improvement
                  </h4>
                  <ul className="space-y-2">
                    {sentimentAnalysis.keyNegatives.map((negative: string, idx: number) => (
                      <li key={idx} className="p-3 bg-red-50 dark:bg-red-950 rounded-lg text-sm">
                        {negative}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations */}
              {sentimentAnalysis.recommendations?.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-500" />
                    Recommendations
                  </h4>
                  <ul className="space-y-2">
                    {sentimentAnalysis.recommendations.map((rec: string, idx: number) => (
                      <li key={idx} className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg text-sm">
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No analysis available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Category Performance</CardTitle>
          <CardDescription>Average ratings by category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(categoryAverages).map(([category, stats]) => (
              <div key={category}>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium capitalize">{category}</span>
                  <span className="text-sm text-muted-foreground">
                    {stats.avg.toFixed(2)}/5 ({stats.count} ratings)
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      stats.avg >= 4 ? 'bg-green-500' : 
                      stats.avg >= 3 ? 'bg-yellow-500' : 
                      'bg-red-500'
                    }`}
                    style={{ width: `${(stats.avg / 5) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
