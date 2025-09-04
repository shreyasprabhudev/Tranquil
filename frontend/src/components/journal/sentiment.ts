import * as tf from '@tensorflow/tfjs';

type EmotionType = 'joy' | 'gratitude' | 'love' | 'sadness' | 'anger' | 'fear' | 'surprise' | 'neutral';
type ThemeType = 'work' | 'relationships' | 'health' | 'personal_growth' | 'leisure' | 'challenges';

interface SentimentAnalysis {
  score: number;
  magnitude: number;
  primaryEmotion: EmotionType;
  secondaryEmotion?: EmotionType;
  emotions: Record<EmotionType, number>;
  themes: ThemeType[];
  keywords: string[];
  guidedQuestion: string;
}

interface ThemeKeywords {
  [key: string]: string[];
}

// Enhanced emotion categories with weights
const EMOTION_WEIGHTS: Record<EmotionType, { words: string[]; weight: number }> = {
  joy: {
    words: ['happy', 'joy', 'excited', 'delighted', 'thrilled', 'ecstatic', 'cheerful', 'blissful', 'jubilant', 'elated', 'yay', 'woohoo', 'awesome'],
    weight: 0.9
  },
  gratitude: {
    words: ['grateful', 'thankful', 'appreciative', 'blessed', 'fortunate', 'lucky', 'appreciate', 'thanks', 'thank you'],
    weight: 0.8
  },
  love: {
    words: ['love', 'loved', 'affection', 'caring', 'compassion', 'tenderness', 'warmth', 'devotion', 'passion', 'adore', 'cherish'],
    weight: 1.0
  },
  sadness: {
    words: ['sad', 'unhappy', 'depressed', 'miserable', 'sorrowful', 'heartbroken', 'gloomy', 'melancholy', 'despair', 'grief', 'sorrow'],
    weight: -0.9
  },
  anger: {
    words: ['angry', 'mad', 'furious', 'irritated', 'annoyed', 'frustrated', 'outraged', 'enraged', 'livid', 'fuming', 'rage'],
    weight: -0.8
  },
  fear: {
    words: ['afraid', 'scared', 'frightened', 'terrified', 'anxious', 'worried', 'nervous', 'apprehensive', 'panicked', 'dread', 'terror'],
    weight: -0.7
  },
  surprise: {
    words: ['surprised', 'amazed', 'astonished', 'shocked', 'stunned', 'dumbfounded', 'bewildered', 'startled', 'astounded'],
    weight: 0.5
  },
  neutral: {
    words: ['okay', 'fine', 'alright', 'neutral', 'indifferent', 'content', 'satisfied', 'calm', 'relaxed', 'meh', 'whatever'],
    weight: 0.1
  }
};

// Theme detection keywords
const THEME_KEYWORDS: ThemeKeywords = {
  work: ['work', 'job', 'meeting', 'deadline', 'project', 'colleague', 'boss', 'office', 'career', 'presentation'],
  relationships: ['friend', 'family', 'partner', 'spouse', 'mom', 'dad', 'sister', 'brother', 'relationship', 'date'],
  health: ['health', 'exercise', 'yoga', 'run', 'gym', 'diet', 'sleep', 'doctor', 'hospital', 'pain', 'sick'],
  personal_growth: ['learn', 'read', 'book', 'course', 'growth', 'improve', 'goal', 'resolution', 'habit'],
  leisure: ['movie', 'game', 'music', 'hobby', 'travel', 'vacation', 'weekend', 'party', 'fun', 'relax'],
  challenges: ['problem', 'issue', 'challenge', 'difficult', 'hard', 'struggle', 'obstacle', 'setback']
};

// Guided questions based on emotion and theme
const GUIDED_QUESTIONS = {
  joy: {
    default: "What made today particularly joyful for you?",
    work: "What aspects of your work brought you joy today?",
    relationships: "Who contributed to your happiness today and how?",
    personal_growth: "What personal achievement are you most proud of today?"
  },
  gratitude: {
    default: "What are you most grateful for today?",
    work: "What work-related accomplishment are you thankful for?",
    relationships: "Who made a positive impact on your day?",
    health: "What about your health are you grateful for today?"
  },
  sadness: {
    default: "What's been weighing on your mind lately?",
    work: "What work situation is causing you stress?",
    relationships: "Is there a relationship you'd like to improve?",
    challenges: "What challenge feels most overwhelming right now?"
  },
  anger: {
    default: "What triggered your frustration today?",
    work: "What work situation made you feel undervalued?",
    relationships: "Is there a conversation you need to have with someone?",
    challenges: "What obstacle is making you feel stuck?"
  },
  fear: {
    default: "What are you most concerned about right now?",
    work: "What work-related uncertainty is on your mind?",
    health: "What health concerns are you thinking about?",
    personal_growth: "What fear might be holding you back?"
  },
  neutral: {
    default: "How are you really feeling today?",
    work: "What would make your work more fulfilling?",
    leisure: "How do you like to spend your free time?",
    personal_growth: "What's something new you'd like to learn?"
  }
};

// Text processing utilities
function tokenizeText(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]|_/g, '')
    .split(/\s+/);
}

function detectThemes(text: string, tokens: string[]): ThemeType[] {
  const themes: ThemeType[] = [];
  const textLower = text.toLowerCase();
  
  (Object.keys(THEME_KEYWORDS) as ThemeType[]).forEach(theme => {
    if (THEME_KEYWORDS[theme].some(keyword => 
      textLower.includes(keyword) || tokens.includes(keyword)
    )) {
      themes.push(theme);
    }
  });
  
  return themes.length > 0 ? themes : ['personal_growth'];
}

function analyzeEmotions(tokens: string[]): Record<EmotionType, number> {
  const emotionScores: Record<EmotionType, number> = {
    joy: 0,
    gratitude: 0,
    love: 0,
    sadness: 0,
    anger: 0,
    fear: 0,
    surprise: 0,
    neutral: 0
  };

  tokens.forEach(token => {
    for (const [emotion, data] of Object.entries(EMOTION_WEIGHTS)) {
      if (data.words.includes(token)) {
        emotionScores[emotion as EmotionType] += data.weight;
      }
    }
  });

  // Normalize scores
  const total = Object.values(emotionScores).reduce((sum, score) => sum + Math.abs(score), 0) || 1;
  
  Object.keys(emotionScores).forEach(emotion => {
    emotionScores[emotion as EmotionType] /= total;
  });

  return emotionScores;
}

function getTopEmotions(emotions: Record<EmotionType, number>): { primary: EmotionType; secondary?: EmotionType } {
  const sorted = Object.entries(emotions)
    .sort(([, a], [, b]) => b - a)
    .filter(([_, score]) => score > 0);
  
  return {
    primary: sorted[0]?.[0] as EmotionType || 'neutral',
    secondary: sorted[1]?.[0] as EmotionType
  };
}

function generateGuidedQuestion(primaryEmotion: EmotionType, themes: ThemeType[]): string {
  const themeQuestions = GUIDED_QUESTIONS[primaryEmotion] || GUIDED_QUESTIONS.neutral;
  
  // Try to find a theme-specific question
  for (const theme of themes) {
    if (themeQuestions[theme]) {
      return themeQuestions[theme as keyof typeof themeQuestions] as string;
    }
  }
  
  // Fall back to default question for the emotion
  return themeQuestions.default || GUIDED_QUESTIONS.neutral.default;
}

function extractKeywords(tokens: string[], count: number = 5): string[] {
  const frequency: Record<string, number> = {};
  
  tokens.forEach(token => {
    if (token.length > 3) { // Only consider words longer than 3 characters
      frequency[token] = (frequency[token] || 0) + 1;
    }
  });
  
  return Object.entries(frequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, count)
    .map(([word]) => word);
}

// Main analysis function
export async function analyzeSentiment(text: string): Promise<SentimentAnalysis> {
  const tokens = tokenizeText(text);
  const themes = detectThemes(text, tokens);
  const emotions = analyzeEmotions(tokens);
  const { primary: primaryEmotion, secondary: secondaryEmotion } = getTopEmotions(emotions);
  const keywords = extractKeywords(tokens);
  
  // Calculate overall sentiment score (-1 to 1)
  const score = Math.max(-1, Math.min(1, 
    emotions.joy * 0.9 + 
    emotions.gratitude * 0.8 + 
    emotions.love * 1.0 + 
    emotions.sadness * -0.9 + 
    emotions.anger * -0.8 + 
    emotions.fear * -0.7 +
    emotions.surprise * 0.5 +
    emotions.neutral * 0.1
  ));
  
  // Calculate magnitude (0 to 1) based on emotional intensity
  const magnitude = Math.min(1, 
    Math.sqrt(
      Object.entries(emotions)
        .filter(([e]) => e !== 'neutral')
        .reduce((sum, [_, val]) => sum + val * val, 0)
    )
  );

  return {
    score,
    magnitude,
    primaryEmotion,
    secondaryEmotion,
    emotions,
    themes,
    keywords,
    guidedQuestion: generateGuidedQuestion(primaryEmotion, themes)
  };
}

// Generate a reflection summary based on multiple entries
export function generateReflectionSummary(entries: { content: string; createdAt: string }[]): string {
  if (entries.length === 0) return "No entries to reflect upon.";
  
  const allText = entries.map(e => e.content).join(' ');
  const tokens = tokenizeText(allText);
  const themes = detectThemes(allText, tokens);
  const emotions = analyzeEmotions(tokens);
  const { primary: primaryEmotion } = getTopEmotions(emotions);
  
  // Count theme occurrences
  const themeCounts = themes.reduce((acc, theme) => {
    acc[theme] = (acc[theme] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const topTheme = Object.entries(themeCounts)
    .sort(([, a], [, b]) => b - a)[0]?.[0] || 'your experiences';
  
  const emotionPhrases = {
    joy: 'joyful and positive',
    gratitude: 'grateful and appreciative',
    love: 'loving and connected',
    sadness: 'reflective and contemplative',
    anger: 'passionate and intense',
    fear: 'cautious and thoughtful',
    surprise: 'surprised and intrigued',
    neutral: 'balanced and centered'
  };
  
  return `Your recent entries show a ${emotionPhrases[primaryEmotion]} perspective, ` +
         `with a focus on ${topTheme}. ` +
         `Consider reflecting on how these themes connect to your overall well-being.`;
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
