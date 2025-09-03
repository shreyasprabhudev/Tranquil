import * as tf from '@tensorflow/tfjs';

// Simple word lists for basic sentiment analysis
const POSITIVE_WORDS = [
  'happy', 'joy', 'excited', 'grateful', 'thankful', 'love', 'loved', 'like', 'liked', 'great', 'good',
  'wonderful', 'amazing', 'awesome', 'excellent', 'fantastic', 'superb', 'perfect', 'positive', 'fortunate',
  'pleased', 'content', 'cheerful', 'delighted', 'blissful', 'ecstatic', 'thrilled', 'overjoyed', 'hopeful',
  'optimistic', 'proud', 'confident', 'motivated', 'inspired', 'peaceful', 'calm', 'relaxed', 'satisfied'
];

const NEGATIVE_WORDS = [
  'sad', 'unhappy', 'angry', 'mad', 'frustrated', 'annoyed', 'upset', 'depressed', 'miserable', 'terrible',
  'awful', 'horrible', 'bad', 'worst', 'hate', 'hated', 'dislike', 'disliked', 'negative', 'unfortunate',
  'disappointed', 'fear', 'fearful', 'scared', 'anxious', 'worried', 'nervous', 'stressed', 'tired', 'exhausted',
  'drained', 'overwhelmed', 'lonely', 'alone', 'hurt', 'pain', 'painful', 'regret', 'guilty', 'ashamed'
];

// Emotion categories with associated words
const EMOTION_CATEGORIES = {
  joy: ['happy', 'joy', 'excited', 'delighted', 'thrilled', 'ecstatic', 'cheerful', 'blissful', 'jubilant', 'elated'],
  gratitude: ['grateful', 'thankful', 'appreciative', 'blessed', 'fortunate', 'lucky'],
  love: ['love', 'affection', 'caring', 'compassion', 'tenderness', 'warmth', 'devotion', 'passion'],
  sadness: ['sad', 'unhappy', 'depressed', 'miserable', 'sorrowful', 'heartbroken', 'gloomy', 'melancholy', 'despair'],
  anger: ['angry', 'mad', 'furious', 'irritated', 'annoyed', 'frustrated', 'outraged', 'enraged', 'livid'],
  fear: ['afraid', 'scared', 'frightened', 'terrified', 'anxious', 'worried', 'nervous', 'apprehensive', 'panicked'],
  surprise: ['surprised', 'amazed', 'astonished', 'shocked', 'stunned', 'dumbfounded', 'bewildered', 'startled'],
  neutral: ['okay', 'fine', 'alright', 'neutral', 'indifferent', 'content', 'satisfied', 'calm', 'relaxed']
};

// Initialize the model
let model: tf.LayersModel | null = null;

// Load the TensorFlow.js model
async function loadModel() {
  if (!model) {
    // In a real app, you would load a pre-trained model here
    // model = await tf.loadLayersModel('/models/sentiment/model.json');
    
    // For now, we'll use a simple rule-based approach
    model = {
      predict: (input: tf.Tensor) => {
        // Mock implementation - in a real app, this would use the actual model
        const result = tf.tensor2d([[0.7, 0.3]]); // Mock positive sentiment
        return result;
      },
      // @ts-ignore - Mock model properties
      summary: () => console.log('Mock sentiment model loaded')
    } as tf.LayersModel;
  }
  return model;
}

// Preprocess text for sentiment analysis
function preprocessText(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')  // Remove punctuation
    .split(/\s+/);              // Split into words
}

// Analyze sentiment of a text string
export async function analyzeSentiment(text: string): Promise<{
  score: number;
  magnitude: number;
  emotions: Record<string, number>;
  keywords: string[];
}> {
  const words = preprocessText(text);
  
  // Simple word counting approach
  let positiveCount = 0;
  let negativeCount = 0;
  const emotionCounts: Record<string, number> = {};
  const keywords: Set<string> = new Set();
  
  // Count positive/negative words and emotions
  words.forEach(word => {
    if (POSITIVE_WORDS.includes(word)) {
      positiveCount++;
      keywords.add(word);
    } else if (NEGATIVE_WORDS.includes(word)) {
      negativeCount++;
      keywords.add(word);
    }
    
    // Check emotion categories
    for (const [emotion, emotionWords] of Object.entries(EMOTION_CATEGORIES)) {
      if (emotionWords.includes(word)) {
        emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
        keywords.add(word);
      }
    }
  });
  
  // Calculate sentiment score (-1 to 1)
  const totalWords = words.length || 1; // Avoid division by zero
  const sentimentScore = (positiveCount - negativeCount) / totalWords;
  
  // Calculate magnitude (0 to 1)
  const magnitude = Math.min(1, (positiveCount + negativeCount) / 10);
  
  // Normalize emotion scores
  const totalEmotionCount = Object.values(emotionCounts).reduce((sum, count) => sum + count, 1);
  const normalizedEmotions: Record<string, number> = {};
  for (const [emotion, count] of Object.entries(emotionCounts)) {
    normalizedEmotions[emotion] = count / totalEmotionCount;
  }
  
  return {
    score: Math.max(-1, Math.min(1, sentimentScore)), // Clamp between -1 and 1
    magnitude: Math.min(1, magnitude), // Clamp to max 1
    emotions: normalizedEmotions,
    keywords: Array.from(keywords)
  };
}

// Extract themes from text
export function extractThemes(text: string, numThemes: number = 3): string[] {
  // Simple implementation - in a real app, use more sophisticated NLP
  const words = preprocessText(text);
  const wordFreq: Record<string, number> = {};
  
  // Count word frequencies (excluding common words)
  const commonWords = new Set([
    'the', 'and', 'i', 'to', 'of', 'a', 'in', 'is', 'it', 'that', 'was', 'for', 'on', 'with', 'he', 'she',
    'as', 'at', 'by', 'this', 'but', 'from', 'they', 'will', 'would', 'what', 'so', 'be', 'are', 'or', 'an', 'if'
  ]);
  
  words.forEach(word => {
    if (word.length > 3 && !commonWords.has(word)) {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    }
  });
  
  // Sort by frequency and get top N
  return Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, numThemes)
    .map(([word]) => word);
}

// Track sentiment over time
export async function trackSentimentOverTime(entries: Array<{ content: string; timestamp: string }>) {
  const model = await loadModel();
  const analysis = [];
  
  for (const entry of entries) {
    const sentiment = await analyzeSentiment(entry.content);
    analysis.push({
      date: entry.timestamp,
      score: sentiment.score,
      magnitude: sentiment.magnitude,
      emotions: sentiment.emotions,
      keywords: sentiment.keywords
    });
  }
  
  return analysis;
}

// Generate insights from sentiment analysis
export function generateInsights(analysis: Array<{ date: string; score: number; emotions: Record<string, number> }>) {
  if (analysis.length === 0) return [];
  
  const insights: string[] = [];
  
  // Calculate average sentiment
  const avgSentiment = analysis.reduce((sum, item) => sum + item.score, 0) / analysis.length;
  
  // Add sentiment insight
  if (avgSentiment > 0.3) {
    insights.push("Your recent entries have been mostly positive overall.");
  } else if (avgSentiment < -0.3) {
    insights.push("Your recent entries have been more negative. Remember that it's okay to feel this way.");
  } else {
    insights.push("Your recent entries show a balanced range of emotions.");
  }
  
  // Check for emotion trends
  const emotionTotals: Record<string, number> = {};
  analysis.forEach(entry => {
    Object.entries(entry.emotions).forEach(([emotion, value]) => {
      emotionTotals[emotion] = (emotionTotals[emotion] || 0) + value;
    });
  });
  
  // Find most common emotion
  const mostCommonEmotion = Object.entries(emotionTotals)
    .sort((a, b) => b[1] - a[1])[0];
    
  if (mostCommonEmotion) {
    insights.push(`You've been feeling ${mostCommonEmotion[0]} in many of your recent entries.`);
  }
  
  return insights;
}
