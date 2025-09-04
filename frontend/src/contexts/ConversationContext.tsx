import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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

  const { token } = useAuth();

  // Load conversations from backend
  const loadConversations = async () => {
    if (!token) return [];
    
    try {
      const data = await conversationAPI.getConversations(showArchived, token);
      return data;
    } catch (err) {
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
    
    try {
      console.log(`Switching to conversation ${conversationId}...`);
      setIsLoading(true);
      
      // Get the latest conversation data from the server
      const { conversation, messages } = await conversationAPI.getConversation(conversationId, token);
      
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
      setError('Failed to switch conversation');
      console.error(err);
      throw err;
    } finally {
      setIsLoading(false);
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
    if (isSending) {
      console.log('Already sending a message, ignoring new request');
      return;
    }
    
    const userMessageId = `temp-user-${Date.now()}`;
    const assistantMessageId = `temp-assistant-${Date.now()}`;
    
    try {
      console.log('Setting isSending to true');
      setIsSending(true);
      
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
      setMessages(prev => {
        const currentMessages = Array.isArray(prev) ? [...prev] : [];
        // Remove any existing typing indicator
        const filteredMessages = currentMessages.filter(m => m.id !== 'typing-indicator');
        const newMessages = [...filteredMessages, userMessage, typingIndicator];
        console.log('Setting messages (1/3) - adding user message and typing indicator:', newMessages);
        return newMessages;
      });
      
      // Send message to the API
      console.log('Sending message to API...');
      const response = await conversationAPI.sendMessage(
        currentConversation.id, 
        content,
        token
      );
      
      console.log('API Response:', response);
      
      // Process the response from the API
      const { user_message, assistant_message, conversation: updatedConversation } = response;
      
      if (!updatedConversation) {
        throw new Error('No conversation data in response');
      }
      
      // Update the current conversation with the latest data
      setCurrentConversation(updatedConversation);
      
      // Update the conversation in the list
      setConversations(prev => 
        prev.map(conv => 
          conv.id === updatedConversation.id ? updatedConversation : conv
        )
      );
      
      // Create a default assistant message if none was provided
      const safeAssistantMessage = assistant_message || {
        id: `temp-assistant-${Date.now()}`,
        role: 'assistant' as const,
        content: 'I apologize, but I encountered an issue generating a response. Please try again.',
        created_at: new Date().toISOString(),
      };
      
      // Ensure we have a valid user message
      const safeUserMessage = user_message || {
        id: `temp-user-${Date.now()}`,
        role: 'user' as const,
        content: content,
        created_at: new Date().toISOString(),
      };
      
      // Update the messages in the UI
      setMessages(prev => {
        const currentMessages = Array.isArray(prev) ? [...prev] : [];
        // Remove typing indicator and any temporary messages
        const filteredMessages = currentMessages.filter(
          m => m.id !== 'typing-indicator' && 
               !m.id.startsWith('temp-')
        );
        
        // Add the user message and assistant response
        return [
          ...filteredMessages,
          safeUserMessage,
          safeAssistantMessage
        ];
      });
      
      return response;
    } catch (err) {
      console.error('Failed to send message:', err);
      setError('Failed to send message');
      
      // Revert the optimistic update on error
      setMessages(prev => {
        const currentMessages = Array.isArray(prev) ? prev : [];
        return currentMessages.filter(m => m.id !== userMessageId && m.id !== 'typing-indicator');
      });
      
      throw err;
    } finally {
      setIsSending(false);
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
