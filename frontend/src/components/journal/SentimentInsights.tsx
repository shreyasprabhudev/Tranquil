import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Sparkles } from 'lucide-react';
import { useLLMService } from '@/lib/llm/llmService';

export interface JournalEntry {
  id: string;
  content: string;
  timestamp: Date;
}

interface SentimentInsightsProps {
  entries: JournalEntry[];
  isLoading?: boolean;
}

export function SentimentInsights({ entries, isLoading }: SentimentInsightsProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [insight, setInsight] = useState<string | null>(null);
  const llmService = useLLMService();

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const analyzeEntries = async () => {
      if (entries.length === 0 || isLoading) return;
      
      setIsAnalyzing(true);
      setError(null);
      
      try {
        // Combine journal entries into a single string
        const journalText = entries
          .slice(0, 10) // Limit to last 10 entries
          .map(entry => entry.content)
          .join('\n\n');

        // Create a focused analysis prompt with strict output format
        const prompt = `You are a compassionate therapist. Analyze these journal entries and respond with:
        
        1. A warm, supportive opening message (1-2 sentences)
        2. Three bullet points of analysis using this exact format:
           • [Emotion/Theme] - [Specific observation or insight]
           • [Emotion/Theme] - [Specific observation or insight]
           • [Pattern/Concern] - [Specific observation or suggestion]
        
        Rules:
        - Keep the opening message limited to 30 words
        - Keep each bullet point concise (max 15 words)
        - Use simple, direct language
        - If entries are insufficient, say: "I'd love to hear more about your thoughts and feelings to provide better insights."
        - Never use markdown formatting
        - Never include section headers or numbers
        - Always use • for bullet points
        - Never use emojis.
        - Never use bold or italics
        
        Analyze your output to ensure it follows the format and rules above. Revise your response if necessary. but do not make explicit references to these instructions.
        
        Journal Entries:
        ${journalText}`;

        const response = await llmService.generateResponse(prompt, signal);
        if (!signal.aborted) {
          setInsight(response);
        }
      } catch (err) {
        if (!signal.aborted) {
          console.error('Error analyzing entries:', err);
          setError('Failed to analyze journal entries. Please try again later.');
        }
      } finally {
        if (!signal.aborted) {
          setIsAnalyzing(false);
        }
      }
    };

    analyzeEntries();

    return () => {
      controller.abort(); // Cleanup function to abort the request
    };
  }, [entries, isLoading, llmService]);

  const cardClass = "w-full max-w-2xl mx-auto";
  const contentClass = "text-center";

  if (isLoading || isAnalyzing) {
    return (
      <div className="flex justify-center p-4">
        <Card className={cardClass}>
          <CardHeader className={contentClass}>
            <CardTitle className="flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Analyzing your journal entries...
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center p-4">
        <Card className={cardClass}>
          <CardContent className={`pt-6 text-destructive ${contentClass}`}>
            {error}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!insight) {
    return (
      <div className="flex justify-center p-4">
        <Card className={cardClass}>
          <CardContent className={`pt-6 text-muted-foreground ${contentClass}`}>
            Start writing journal entries to see insights about your mood and patterns.
          </CardContent>
        </Card>
      </div>
    );
  }

  // Process the insight text to ensure proper formatting
  const formattedInsight = insight
    .split('\n')
    .filter(line => line.trim() !== '')
    .map((line, i) => (
      <p key={i} className={i > 0 ? 'mt-3' : ''}>
        {line}
      </p>
    ));

  return (
    <div className="flex justify-center p-4">
      <Card className={cardClass}>
        <CardHeader className={contentClass}>
          <CardTitle className="flex items-center justify-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            Your Journal Insights
          </CardTitle>
        </CardHeader>
        <CardContent className={contentClass}>
          <div className="space-y-3">
            {formattedInsight}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
