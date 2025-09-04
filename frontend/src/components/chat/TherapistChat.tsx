'use client';

import { useState, useRef, useEffect, useContext } from 'react';
import { Send, User, Bot, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useAuth } from '@/contexts/AuthContext';

type Message = {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
};

export function TherapistChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { token } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message to the chat immediately
    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    
    // Check if we have a valid token
    if (!token) {
      setError('Not authenticated. Please log in again.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Add a temporary loading message
      const loadingMessage: Message = {
        id: 'loading-' + Date.now(),
        content: '...',
        role: 'assistant',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, loadingMessage]);

      // Call our Next.js API route which will forward the request to the backend
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ message: input }),
      });

      // Remove the loading message
      setMessages(prev => prev.filter(msg => msg.id !== loadingMessage.id));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to get response');
      }

      const data = await response.json();
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        role: 'assistant',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      const error = err as Error;
      console.error('Error:', error);
      setError(error.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-50 dark:bg-gray-900">
      {/* Error message */}
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p>{error}</p>
        </div>
      )}

      {/* Messages container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <Bot className="w-12 h-12 mb-4" />
            <h2 className="text-2xl font-semibold">How can I help you today?</h2>
            <p className="mt-2">I'm here to listen and support you.</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`flex max-w-3xl rounded-lg px-4 py-2 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-none'
                }`}
              >
                <div className="flex items-start space-x-2">
                  {message.role === 'assistant' && (
                    <Bot className="h-5 w-5 mt-1 text-blue-500 flex-shrink-0" />
                  )}
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  {message.role === 'user' && (
                    <User className="h-5 w-5 mt-1 text-blue-200 flex-shrink-0" />
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-gray-800 rounded-lg px-4 py-2 rounded-bl-none">
              <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <Input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 rounded-full"
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="icon"
            className="rounded-full"
            disabled={isLoading || !input.trim()}
          >
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </div>
    </div>
  );
}
