'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Loader2, Sparkles } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

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
    const container = document.querySelector('.chat-messages');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  };

  useEffect(() => {
    // Scroll to bottom when messages change
    scrollToBottom();
  }, [messages]);

  // Initial scroll to bottom when component mounts
  useEffect(() => {
    scrollToBottom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-6xl mx-auto w-full">
      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 chat-messages" style={{ scrollBehavior: 'smooth' }}>
        <AnimatePresence>
          {messages.length === 0 ? (
            <motion.div 
              className="h-full flex flex-col items-center justify-center text-center p-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <motion.div 
                className="bg-blue-100 dark:bg-blue-900/20 p-4 rounded-full mb-6"
                animate={{ 
                  boxShadow: [
                    '0 0 0 0px rgba(59, 130, 246, 0.1)',
                    '0 0 0 10px rgba(59, 130, 246, 0)',
                    '0 0 0 20px rgba(59, 130, 246, 0)'
                  ]
                }}
                transition={{ 
                  duration: 3,
                  repeat: Infinity,
                  repeatType: 'loop'
                }}
              >
                <Sparkles className="h-10 w-10 text-blue-600 dark:text-blue-400" />
              </motion.div>
              <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent mb-3">
                Welcome to Tranquil Chat
              </h2>
              <p className="text-slate-500 dark:text-slate-400 max-w-lg leading-relaxed">
                I'm here to listen and support you. Share what's on your mind, and let's have a meaningful conversation.
              </p>
            </motion.div>
          ) : (
            <AnimatePresence>
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  className={cn(
                    "flex",
                    message.role === 'user' ? 'justify-end' : 'justify-start',
                    "group"
                  )}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <motion.div
                    className={cn(
                      "max-w-3xl rounded-2xl px-4 py-3 relative overflow-hidden",
                      message.role === 'user'
                        ? 'bg-gradient-to-br from-blue-600 to-blue-500 text-white rounded-br-none shadow-lg'
                        : 'bg-white dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 rounded-bl-none border border-slate-100 dark:border-slate-700/50 shadow-sm',
                      "backdrop-blur-sm"
                    )}
                    whileHover={{ scale: 1.01 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                  >
                    {/* Message header */}
                    <div className="flex items-center space-x-2 mb-1.5">
                      {message.role === 'assistant' ? (
                        <motion.div 
                          className="p-1 rounded-full bg-blue-100 dark:bg-blue-900/30"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                        >
                          <Sparkles className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400" />
                        </motion.div>
                      ) : (
                        <div className="p-1 rounded-full bg-blue-500/20">
                          <User className="h-3.5 w-3.5 text-blue-100" />
                        </div>
                      )}
                      <span className="text-xs font-medium">
                        {message.role === 'assistant' ? 'Tranquil AI' : 'You'}
                      </span>
                      <span className="text-xs opacity-50 ml-auto">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    
                    {/* Message content */}
                    <motion.p 
                      className="whitespace-pre-wrap text-sm leading-relaxed"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.1 }}
                    >
                      {message.content}
                    </motion.p>
                    
                    {/* Decorative elements */}
                    {message.role === 'assistant' && (
                      <motion.div 
                        className="absolute -bottom-4 -right-4 h-16 w-16 rounded-full bg-blue-200/20 -z-10"
                        animate={{ 
                          scale: [1, 1.2, 1],
                          opacity: [0.3, 0.5, 0.3]
                        }}
                        transition={{ 
                          duration: 8,
                          repeat: Infinity,
                          repeatType: 'reverse'
                        }}
                      />
                    )}
                  </motion.div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Input area */}
      <motion.div 
        className="border-t border-slate-200 dark:border-slate-800 p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky bottom-0"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <form onSubmit={handleSubmit} className="flex space-x-3">
          <motion.div 
            className="relative flex-1"
            whileHover={{ scale: 1.005 }}
            whileFocus={{ scale: 1.01 }}
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Share your thoughts..."
              className={cn(
                "w-full rounded-full border-2 border-slate-200 dark:border-slate-700",
                "focus:border-blue-500 focus:ring-0 dark:bg-slate-800/80",
                "text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500",
                "pr-12 h-12 text-base shadow-sm transition-all duration-200"
              )}
              disabled={isLoading}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            {!input.trim() && (
              <motion.div 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                animate={{ opacity: [0.4, 0.7, 0.4] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Send className="h-5 w-5" />
              </motion.div>
            )}
          </motion.div>
          
          <Button
            type="submit"
            disabled={!input.trim() || isLoading}
            className={cn(
              "rounded-full h-12 w-12 p-0 flex items-center justify-center",
              "bg-gradient-to-br from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600",
              "text-white shadow-md hover:shadow-lg transition-all duration-200",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
            whilehover={{ scale: 1.05 }}
            whiletap={{ scale: 0.95 }}
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </form>
        
        <AnimatePresence>
          {error && (
            <motion.p 
              className="mt-3 text-sm text-red-500 dark:text-red-400 text-center"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
        
        <p className="text-xs text-center text-slate-400 dark:text-slate-500 mt-3">
          Tranquil AI is here to listen and support you
        </p>
      </motion.div>
    </div>
  );
}
