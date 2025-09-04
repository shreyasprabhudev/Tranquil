import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

interface LLMServiceOptions {
  baseUrl?: string;
}

export class LLMService {
  private baseUrl: string;
  private getToken: () => Promise<string | null> = async () => null;

  constructor(options: LLMServiceOptions = {}) {
    this.baseUrl = options.baseUrl || 'http://localhost:8000';
  }

  setTokenGetter(getter: () => Promise<string | null>) {
    this.getToken = getter;
  }

  async generateResponse(prompt: string, signal?: AbortSignal): Promise<string> {
    const token = await this.getToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ message: prompt }),
        signal, // Pass the signal to fetch
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to process your message');
      }

      const data = await response.json();
      return data.response || "I'm here to listen. Could you tell me more about how you're feeling?";
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('LLM Service Error:', error);
        throw error;
      }
      return ''; // Return empty string for aborted requests
    }
  }

  static useLLMService() {
    const { token } = useAuth();
    const [llmService] = useState(() => {
      const service = new LLMService();
      service.setTokenGetter(async () => token);
      return service;
    });

    return llmService;
  }
}

export const useLLMService = LLMService.useLLMService;
