import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export function usePromptGenerator() {
  const { isAuthenticated } = useAuth();
  const [currentPrompt, setCurrentPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const generatePrompt = async (context?: {
    recentEntry?: string;
    timeOfDay?: 'morning' | 'afternoon' | 'evening';
    lastPromptId?: string;
  }) => {
    if (!isAuthenticated) {
      setError('User is not authenticated');
      return;
    }
    
    // Get token from localStorage
    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('Authentication token not found');
      return;
    }
    
    setIsLoading(true);
    setError(null);

    try {
      // First try to get a context-aware prompt
      const response = await fetch('/api/prompts/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          context: {
            recentEntry: context?.recentEntry || '',
            timeOfDay: getTimeOfDay(),
            lastPromptId: context?.lastPromptId,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate prompt');
      }

      const data = await response.json();
      setCurrentPrompt(data.prompt);
      return data.prompt;
    } catch (err) {
      console.error('Error generating prompt:', err);
      setError('Failed to generate prompt. Using a default prompt instead.');
      // Fallback to default prompts
      return getFallbackPrompt(context?.timeOfDay || getTimeOfDay());
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to get time of day
  const getTimeOfDay = (): 'morning' | 'afternoon' | 'evening' => {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  };

  // Fallback prompts if the API fails
  const getFallbackPrompt = (timeOfDay: string): string => {
    const prompts = {
      morning: [
        'What are you grateful for this morning?',
        'What would make today great?',
        'What are your intentions for today?',
      ],
      afternoon: [
        'How is your day going so far?',
        'What has been the highlight of your day?',
        'Is there anything on your mind that you\'d like to explore?',
      ],
      evening: [
        'What was the best part of your day?',
        'What did you learn today?',
        'Is there anything you\'d like to let go of before tomorrow?',
      ],
    };

    const timePrompts = prompts[timeOfDay as keyof typeof prompts] || [
      'How are you feeling right now?',
      'What\'s on your mind today?',
      'Is there anything you\'d like to reflect on?',
    ];

    return timePrompts[Math.floor(Math.random() * timePrompts.length)];
  };

  return {
    currentPrompt,
    generatePrompt,
    isLoading,
    error,
  };
}

// React component that uses the hook
export function PromptGenerator({
  onPromptGenerated,
  context,
}: {
  onPromptGenerated?: (prompt: string) => void;
  context?: any;
}) {
  const { currentPrompt, generatePrompt, isLoading, error } = usePromptGenerator();

  useEffect(() => {
    const loadPrompt = async () => {
      const prompt = await generatePrompt(context);
      if (prompt && onPromptGenerated) {
        onPromptGenerated(prompt);
      }
    };
    loadPrompt();
  }, [context]);

  if (isLoading) return <div className="text-muted-foreground">Generating a thoughtful prompt...</div>;
  if (error) return <div className="text-destructive">{error}</div>;

  return (
    <div className="mb-4 p-4 bg-muted/20 rounded-lg">
      <p className="font-medium text-foreground">{currentPrompt || 'How are you feeling today?'}</p>
      <button
        onClick={() => generatePrompt(context)}
        className="mt-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        disabled={isLoading}
      >
        {isLoading ? 'Generating...' : 'Get another prompt'}
      </button>
    </div>
  );
}
