import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { analyzeSentiment, generateInsights, trackSentimentOverTime } from './sentiment';

type SentimentInsightsProps = {
  entries: Array<{ content: string; timestamp: string }>;
  className?: string;
};

export function SentimentInsights({ entries, className = '' }: SentimentInsightsProps) {
  const [insights, setInsights] = useState<string[]>([]);
  const [sentimentData, setSentimentData] = useState<Array<{ date: string; score: number }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const analyzeEntries = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (entries.length === 0) {
          setInsights(['Start journaling to see your sentiment insights!']);
          return;
        }

        // Analyze each entry
        const analysis = await trackSentimentOverTime(entries);
        
        // Generate insights
        const generatedInsights = generateInsights(analysis);
        setInsights(generatedInsights);
        
        // Prepare data for the chart
        const chartData = analysis.map(item => ({
          date: new Date(item.date).toLocaleDateString(),
          score: item.score,
        }));
        setSentimentData(chartData);
      } catch (err) {
        console.error('Error analyzing entries:', err);
        setError('Failed to analyze journal entries. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    analyzeEntries();
  }, [entries]);

  // Calculate overall sentiment
  const overallSentiment = sentimentData.reduce(
    (sum, item) => sum + item.score,
    0
  ) / (sentimentData.length || 1);

  // Get sentiment emoji and color
  const getSentimentInfo = (score: number) => {
    if (score > 0.3) return { emoji: '😊', color: 'text-green-500' };
    if (score < -0.3) return { emoji: '😔', color: 'text-red-500' };
    return { emoji: '😐', color: 'text-yellow-500' };
  };

  const { emoji, color } = getSentimentInfo(overallSentiment);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Analyzing your journal...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Sentiment Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Your Sentiment Insights
          <span className={`text-2xl ${color}`}>{emoji}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {insights.length > 0 ? (
          <div className="space-y-3">
            {insights.map((insight, index) => (
              <div key={index} className="flex items-start gap-2">
                <span className="text-muted-foreground">•</span>
                <p>{insight}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">
            Keep journaling to see personalized insights and patterns in your writing.
          </p>
        )}

        {sentimentData.length > 1 && (
          <div className="mt-6">
            <h4 className="text-sm font-medium mb-2">Sentiment Trend</h4>
            <div className="h-24 flex items-end gap-1">
              {sentimentData.map((data, index) => {
                const height = Math.abs(data.score) * 100;
                const isPositive = data.score >= 0;
                const barColor = isPositive ? 'bg-green-500' : 'bg-red-500';
                
                return (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div
                      className={`w-full rounded-t ${barColor} transition-all`}
                      style={{
                        height: `${height}%`,
                        opacity: 0.7,
                      }}
                    />
                    <span className="text-xs text-muted-foreground mt-1">
                      {new Date(data.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
