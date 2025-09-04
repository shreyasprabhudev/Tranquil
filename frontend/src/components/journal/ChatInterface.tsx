"use client";

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Send, RefreshCw, User, Bot } from 'lucide-react';

type Message = {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
};

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user, isAuthenticated } = useAuth();

  const getAuthHeader = async () => {
    const tokensStr = localStorage.getItem('authTokens');
    if (!tokensStr) throw new Error('Not authenticated');
    const tokens = JSON.parse(tokensStr);
    return {
      'Authorization': `Bearer ${tokens.access}`
    };
  };

  // Load conversation history on component mount
  useEffect(() => {
    const loadConversation = async () => {
      try {
        const headers = await getAuthHeader();
        const response = await fetch('/api/journal/conversation/', {
          headers,
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.conversation) {
            const formattedMessages = data.conversation
              .filter((msg: any) => msg.role !== 'system')
              .map((msg: any) => ({
                id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                content: msg.content,
                role: msg.role,
                timestamp: new Date(),
              }));
            setMessages(formattedMessages);
          }
        }
      } catch (error) {
        console.error('Failed to load conversation:', error);
      }
    };

    loadConversation();
  }, [getToken]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      content: input,
      role: 'user',
      timestamp: new Date(),
    };

    // Update UI with user message immediately
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const headers = await getAuthHeader();
      const response = await fetch('/api/journal/conversation/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify({ message: input }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        content: data.response,
        role: 'assistant',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      // Show error message to user
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        content: 'Sorry, I encountered an error. Please try again.',
        role: 'assistant',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearConversation = async () => {
    try {
      const headers = await getAuthHeader();
      await fetch('/api/journal/conversation/', {
        method: 'DELETE',
        headers,
      });
      setMessages([]);
    } catch (error) {
      console.error('Failed to clear conversation:', error);
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto h-[600px] flex flex-col">
      <CardHeader className="border-b">
        <div className="flex justify-between items-center">
          <CardTitle>Reflection Assistant</CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearConversation}
            disabled={messages.length === 0 || isLoading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            New Chat
          </Button>
        </div>
      </CardHeader>
      
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <p>Start a conversation with your reflection assistant.</p>
              <p className="text-sm mt-2">
                Try asking about your recent journal entries or share what's on your mind.
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div 
                key={message.id} 
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.role === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted'
                  }`}
                >
                  <div className="flex items-center mb-1">
                    {message.role === 'user' ? (
                      <User className="h-4 w-4 mr-2" />
                    ) : (
                      <Bot className="h-4 w-4 mr-2" />
                    )}
                    <span className="text-xs font-medium">
                      {message.role === 'user' ? 'You' : 'Assistant'}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      
      <CardFooter className="border-t p-4">
        <form onSubmit={handleSubmit} className="flex w-full space-x-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1"
            disabled={isLoading}
          />
          <Button type="submit" disabled={!input.trim() || isLoading}>
            {isLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
