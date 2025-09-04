import { LLMService } from './llmService';

const llmService = new LLMService();

export interface SentimentAnalysis {
  score: number; // -1 (negative) to 1 (positive)
  emotions: string[];
  themes: string[];
  summary: string;
}

export async function analyzeSentimentWithLLM(text: string): Promise<SentimentAnalysis> {
  const prompt = `Analyze the following journal entry and provide sentiment analysis in JSON format with these fields:
  - score: a float between -1 (very negative) and 1 (very positive)
  - emotions: array of primary emotions detected (3-5 items)
  - themes: array of key themes/topics (3-5 items)
  - summary: a brief 1-2 sentence summary of the sentiment

Journal Entry:
${text}

Analysis:`;

  try {
    const response = await llmService.chat({
      messages: [
        {
          role: 'system',
          content: 'You are an AI that analyzes journal entries and provides sentiment analysis. Respond with a valid JSON object.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    // Parse and validate the response
    const result = JSON.parse(response.content);
    return {
      score: parseFloat(result.score) || 0,
      emotions: Array.isArray(result.emotions) ? result.emotions : [],
      themes: Array.isArray(result.themes) ? result.themes : [],
      summary: result.summary || ''
    };
  } catch (error) {
    console.error('Error analyzing sentiment with LLM:', error);
    // Return neutral sentiment as fallback
    return {
      score: 0,
      emotions: [],
      themes: [],
      summary: 'Unable to analyze sentiment at this time.'
    };
  }
}

export async function analyzeSentimentBatchWithLLM(entries: Array<{ content: string; timestamp: string }>): Promise<Array<{ date: string; score: number }>> {
  if (entries.length === 0) return [];

  // For batch processing, we'll analyze each entry individually
  // In a production app, you might want to batch these requests
  const results = [];
  
  for (const entry of entries) {
    try {
      const analysis = await analyzeSentimentWithLLM(entry.content);
      results.push({
        date: entry.timestamp,
        score: analysis.score
      });
    } catch (error) {
      console.error(`Error analyzing entry from ${entry.timestamp}:`, error);
      // Skip failed entries
    }
  }

  return results;
}
