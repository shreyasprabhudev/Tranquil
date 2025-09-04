import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { Conversation, Message as MessageType } from '@/lib/api/conversation';
import * as conversationAPI from '@/lib/api/conversation';
import { useAuth } from './AuthContext';

interface ConversationContextType {
  // Conversations
  conversations: Conversation[];
  currentConversation: Conversation | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  createNewConversation: (initialMessage?: string) => Promise<Conversation>;
  switchConversation: (conversationId: string) => Promise<void>;
  updateCurrentConversation: (updates: Partial<Conversation>) => Promise<void>;
  deleteConversation: (conversationId: string) => Promise<void>;
  archiveConversation: (conversationId: string, archive: boolean) => Promise<void>;
  
  // Messages
  messages: MessageType[];
  sendMessage: (content: string) => Promise<void>;
  isSending: boolean;
  
  // UI State
  showArchived: boolean;
  toggleShowArchived: () => void;
}

const ConversationContext = createContext<ConversationContextType | undefined>(undefined);

export const ConversationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const { token } = useAuth();

  // Cleanup function to abort any pending requests when component unmounts
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Load conversations from backend
  const loadConversations = async (signal?: AbortSignal) => {
    if (!token) return [];
    
    try {
      const data = await conversationAPI.getConversations(showArchived, token, signal);
      return data;
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('Load conversations was aborted');
        return [];
      }
      console.error('Failed to load conversations:', err);
      setError('Failed to load conversations');
      return [];
    }
  };

  // Load conversations and set initial conversation
  useEffect(() => {
    const initializeConversation = async () => {
      if (!token) return;
      
      try {
        setIsLoading(true);
        // Load all conversations
        const conversations = await loadConversations();
        setConversations(conversations);
        
        // If we have conversations, load the most recent one
        if (conversations.length > 0) {
          await switchConversation(conversations[0].id);
        } else {
          // If no conversations, create a new one
          await createNewConversation();
        }
      } catch (err) {
        setError('Failed to initialize conversations');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    initializeConversation();
  }, [token, showArchived]);

  const createNewConversation = async (initialMessage?: string): Promise<Conversation> => {
    if (!token) throw new Error('Not authenticated');
    
    try {
      setIsLoading(true);
      
      // Create a new conversation with the initial message if provided
      const newConversation = await conversationAPI.createConversation(
        { 
          title: initialMessage ? initialMessage.slice(0, 50) : 'New Conversation',
          initialMessage
        },
        token
      );
      
      // Update the conversations list with the new conversation
      setConversations(prev => [newConversation, ...(Array.isArray(prev) ? prev : [])]);
      
      // Set the new conversation as current
      setCurrentConversation(newConversation);
      
      // If there was an initial message, add it to the messages
      if (initialMessage) {
        try {
          const newMessage = await conversationAPI.sendMessage(newConversation.id, initialMessage, token);
          setMessages([newMessage]);
        } catch (error) {
          console.error('Failed to send initial message:', error);
          // Even if sending the message fails, we still have a valid conversation
          setMessages([]);
        }
      } else {
        setMessages([]);
      }
      
      return newConversation;
    } catch (err) {
      setError('Failed to create conversation');
      console.error(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const switchConversation = async (conversationId: string) => {
    if (!token) {
      console.error('Cannot switch conversation: No authentication token');
      return;
    }
    
    // Abort any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create a new AbortController for this request
    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    try {
      console.log(`Switching to conversation ${conversationId}...`);
      setIsLoading(true);
      setError(null);
      
      // Get the latest conversation data from the server with timeout
      const timeoutId = setTimeout(() => {
        controller.abort('Request timed out after 10 seconds');
      }, 10000);
      
      const { conversation, messages } = await conversationAPI.getConversation(
        conversationId, 
        token, 
        controller.signal
      );
      
      clearTimeout(timeoutId);
      
      // Check if the request was aborted after the fetch but before state updates
      if (controller.signal.aborted) {
        return;
      }
      
      console.log(`Received ${messages.length} messages for conversation ${conversationId}`);
      
      // Update the current conversation and messages
      setCurrentConversation(conversation);
      setMessages(messages);
      
      // Update the conversation in the list
      setConversations(prev => {
        const updated = prev.map(conv => 
          conv.id === conversationId ? conversation : conv
        );
        console.log(`Updated conversations list with ${updated.length} conversations`);
        return updated;
      });
      
    } catch (err) {
      // Don't set error state if the request was aborted
      if (err.name !== 'AbortError') {
        setError('Failed to switch conversation');
        console.error('Error switching conversation:', err);
      }
      throw err;
    } finally {
      // Only clear the loading state if this wasn't aborted for a new request
      if (abortControllerRef.current === controller) {
        setIsLoading(false);
      }
    }
  };

  const updateCurrentConversation = async (updates: Partial<Conversation>) => {
    if (!currentConversation || !token) return;
    
    try {
      const updatedConversation = await conversationAPI.updateConversation(
        currentConversation.id,
        updates,
        token
      );
      
      setCurrentConversation(updatedConversation);
      
      setConversations(prev =>
        prev.map(conv =>
          conv.id === updatedConversation.id ? updatedConversation : conv
        )
      );
    } catch (err) {
      setError('Failed to update conversation');
      console.error(err);
      throw err;
    }
  };

  const deleteConversation = async (conversationId: string) => {
    if (!token) return;
    
    try {
      // First delete the conversation from the server
      await conversationAPI.deleteConversation(conversationId, token);
      
      // Get fresh list of conversations from the server
      const updatedConversations = await conversationAPI.getConversations(showArchived, token);
      setConversations(updatedConversations);
      
      // If we deleted the current conversation, switch to another one or create a new one
      if (currentConversation?.id === conversationId) {
        const otherConversation = updatedConversations.find(conv => !conv.is_archived || showArchived);
        if (otherConversation) {
          await switchConversation(otherConversation.id);
        } else {
          // If no conversations left, create a new one
          await createNewConversation();
        }
      }
    } catch (err) {
      setError('Failed to delete conversation');
      console.error(err);
      throw err;
    }
  };

  const archiveConversation = async (conversationId: string, archive: boolean) => {
    if (!token) return;
    
    try {
      await conversationAPI.updateConversation(
        conversationId, 
        { is_archived: archive },
        token
      );
      
      setConversations(prev =>
        prev.map(conv =>
          conv.id === conversationId ? { ...conv, is_archived: archive } : conv
        )
      );
      
      // If we're archiving the current conversation, switch to another one
      if (currentConversation?.id === conversationId && archive) {
        const otherConversations = conversations.filter(conv => 
          conv.id !== conversationId && !conv.is_archived
        );
        
        if (otherConversations.length > 0) {
          await switchConversation(otherConversations[0].id);
        } else {
          // No other conversations, create a new one
          await createNewConversation();
        }
      }
    } catch (err) {
      setError(`Failed to ${archive ? 'archive' : 'unarchive'} conversation`);
      console.error(err);
      throw err;
    }
  };

  const sendMessage = async (content: string) => {
    console.log('sendMessage called with content:', content);
    if (!currentConversation || !token) {
      console.log('Cannot send message - missing conversation or token');
      return;
    }
    
    // Abort any existing send message request
    if (abortControllerRef.current) {
      console.log('Aborting previous message request');
      abortControllerRef.current.abort();
    }
    
    // Create a new AbortController for this request
    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    // Set a timeout to abort the request if it takes too long
    const timeoutId = setTimeout(() => {
      console.log('Message request timed out');
      controller.abort('Request timed out after 30 seconds');
    }, 30000);
    
    const userMessageId = `temp-user-${Date.now()}`;
    
    try {
      console.log('Setting isSending to true');
      setIsSending(true);
      setError(null);
      
      // Create user message
      console.log('Creating user message with ID:', userMessageId);
      const userMessage: MessageType = {
        id: userMessageId,
        role: 'user',
        content,
        created_at: new Date().toISOString(),
      };
      
      // Add typing indicator
      const typingIndicator: MessageType = {
        id: 'typing-indicator',
        role: 'assistant',
        content: '...',
        created_at: new Date().toISOString(),
        isLoading: true
      };
      
      // Add user message and typing indicator to UI immediately
      setMessages(prev => [...prev, userMessage, typingIndicator]);
      
      console.log('Sending message to server...');
      const { assistant_message, conversation: updatedConversation } = await conversationAPI.sendMessage(
        currentConversation.id,
        content,
        token,
        controller.signal
      );
      
      // Clear the timeout since the request completed
      clearTimeout(timeoutId);
      
      // Check if the request was aborted after the fetch but before state updates
      if (controller.signal.aborted) {
        console.log('Request was aborted after fetch');
        return;
      }
      
      console.log('Received assistant message:', assistant_message);
      
      // Update the conversation with the server response
      setCurrentConversation(updatedConversation);
      
      // Replace the temporary message with the one from the server
      setMessages(prev => {
        // Remove typing indicator and temporary user message
        const filtered = prev.filter(msg => 
          msg.id !== 'typing-indicator' && 
          !msg.id.startsWith('temp-')
        );
        
        // Add the final user message and assistant response
        return [
          ...filtered,
          {
            ...userMessage,
            id: `user-${Date.now()}` // Replace temp ID with a proper one
          },
          assistant_message
        ];
      });
      
      // Update the conversation in the list
      setConversations(prev => 
        prev.map(conv => 
          conv.id === updatedConversation.id ? updatedConversation : conv
        )
      );
      
    } catch (err) {
      // Don't show error if the request was aborted
      if (err.name !== 'AbortError') {
        console.error('Failed to send message:', err);
        setError('Failed to send message. Please try again.');
        
        // Remove the temporary messages and typing indicator on error
        setMessages(prev => 
          prev.filter(msg => 
            !msg.id.startsWith('temp-') && 
            msg.id !== 'typing-indicator'
          )
        );
      } else {
        console.log('Message sending was aborted');
      }
      
      // Re-throw the error so the UI can handle it if needed
      throw err;
    } finally {
      // Only clear the sending state if this wasn't aborted for a new request
      if (abortControllerRef.current === controller) {
        console.log('Clearing isSending state');
        setIsSending(false);
      }
      clearTimeout(timeoutId);
    }
  };

  const toggleShowArchived = () => {
    setShowArchived(prev => !prev);
  };

  return (
    <ConversationContext.Provider
      value={{
        conversations,
        currentConversation,
        isLoading,
        error,
        createNewConversation,
        switchConversation,
        updateCurrentConversation,
        deleteConversation,
        archiveConversation,
        messages,
        sendMessage,
        isSending,
        showArchived,
        toggleShowArchived,
      }}
    >
      {children}
    </ConversationContext.Provider>
  );
};

export const useConversation = (): ConversationContextType => {
  const context = useContext(ConversationContext);
  if (context === undefined) {
    throw new Error('useConversation must be used within a ConversationProvider');
  }
  return context;
};
