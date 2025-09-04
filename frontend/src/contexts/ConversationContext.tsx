import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Conversation, Message as MessageType } from '@/lib/api/conversation';
import * as conversationAPI from '@/lib/api/conversation';

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

  // Load conversations on mount and when showArchived changes
  useEffect(() => {
    const loadConversations = async () => {
      try {
        setIsLoading(true);
        const data = await conversationAPI.getConversations(showArchived);
        setConversations(data);
        
        // If there's no current conversation and we have conversations, select the first one
        if (!currentConversation && data.length > 0) {
          await switchConversation(data[0].id);
        }
      } catch (err) {
        setError('Failed to load conversations');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadConversations();
  }, [showArchived]);

  // Load messages when current conversation changes
  useEffect(() => {
    const loadMessages = async () => {
      if (!currentConversation) return;
      
      try {
        setIsLoading(true);
        const messages = await conversationAPI.getMessages(currentConversation.id);
        setMessages(messages);
      } catch (err) {
        setError('Failed to load messages');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();
  }, [currentConversation?.id]);

  const createNewConversation = async (initialMessage?: string): Promise<Conversation> => {
    try {
      setIsLoading(true);
      const newConversation = await conversationAPI.createConversation({
        initialMessage,
      });
      
      setConversations(prev => [newConversation, ...prev]);
      setCurrentConversation(newConversation);
      
      if (initialMessage) {
        const newMessage = await conversationAPI.sendMessage(newConversation.id, initialMessage);
        setMessages([newMessage]);
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
    try {
      setIsLoading(true);
      const conversation = await conversationAPI.getConversation(conversationId);
      setCurrentConversation(conversation.conversation);
      setMessages(conversation.messages);
    } catch (err) {
      setError('Failed to switch conversation');
      console.error(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateCurrentConversation = async (updates: Partial<Conversation>) => {
    if (!currentConversation) return;
    
    try {
      const updatedConversation = await conversationAPI.updateConversation(
        currentConversation.id,
        updates
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
    try {
      await conversationAPI.deleteConversation(conversationId);
      
      setConversations(prev => prev.filter(conv => conv.id !== conversationId));
      
      if (currentConversation?.id === conversationId) {
        // Switch to another conversation or create a new one
        const otherConversations = conversations.filter(conv => conv.id !== conversationId);
        if (otherConversations.length > 0) {
          await switchConversation(otherConversations[0].id);
        } else {
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
    try {
      await conversationAPI.updateConversation(conversationId, {
        is_archived: archive,
      });
      
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
    if (!currentConversation) return;
    
    try {
      setIsSending(true);
      
      // Optimistically update UI
      const userMessage: MessageType = {
        id: `temp-${Date.now()}`,
        role: 'user',
        content,
        created_at: new Date().toISOString(),
      };
      
      setMessages(prev => [...prev, userMessage]);
      
      // Send to API
      const newMessage = await conversationAPI.sendMessage(currentConversation.id, content);
      
      // Update messages with the server response
      setMessages(prev => [
        ...prev.filter(m => !m.id.startsWith('temp')),
        newMessage,
      ]);
      
      // Update conversation's last message in the list
      setConversations(prev =>
        prev.map(conv =>
          conv.id === currentConversation.id
            ? {
                ...conv,
                last_message: {
                  content: newMessage.content,
                  role: newMessage.role,
                  created_at: newMessage.created_at,
                },
                updated_at: new Date().toISOString(),
              }
            : conv
        )
      );
    } catch (err) {
      setError('Failed to send message');
      console.error(err);
      // Remove the optimistic update on error
      setMessages(prev => prev.filter(m => !m.id.startsWith('temp')));
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
