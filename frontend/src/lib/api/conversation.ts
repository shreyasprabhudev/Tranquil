import { useAuth } from '@/contexts/AuthContext';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Helper function to get auth headers
const getAuthHeaders = (token: string | null) => ({
  'Content-Type': 'application/json',
  ...(token ? { 'Authorization': `Bearer ${token}` } : {})
});

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
  metadata?: Record<string, any>;
  conversation?: string;
}

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  is_archived: boolean;
  message_count: number;
  messages?: Message[]; // Add this line to include messages in the Conversation type
  last_message?: {
    content: string;
    role: string;
    created_at: string;
  };
}

interface CreateConversationData {
  title?: string;
  initialMessage?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export const getConversations = async (
  archived = false, 
  token: string | null, 
  signal?: AbortSignal
): Promise<Conversation[]> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/conversations/?archived=${archived}`,
      {
        headers: getAuthHeaders(token),
        signal,
        cache: 'no-store' // Prevent caching to always get fresh data
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Failed to fetch conversations:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      throw new Error(errorData.detail || 'Failed to fetch conversations');
    }

    const data: PaginatedResponse<Conversation> = await response.json();
    
    // Return the results array from the paginated response
    return Array.isArray(data?.results) ? data.results : [];
  } catch (error) {
    console.error('Error in getConversations:', error);
    // Return empty array on error to prevent crashes
    return [];
  }
};

/**
 * Fetches a conversation and all its messages
 */
export const getConversation = async (
  id: string,
  token: string | null,
  signal?: AbortSignal
): Promise<{ conversation: Conversation; messages: Message[] }> => {
  try {
    console.log(`Fetching conversation ${id}...`);
    
    // Get the conversation details
    const [conversationResponse, messagesResponse] = await Promise.all([
      fetch(`${API_BASE_URL}/api/conversations/${id}/`, {
        headers: getAuthHeaders(token),
        signal,
      }),
      fetch(`${API_BASE_URL}/api/conversations/${id}/messages/`, {
        headers: getAuthHeaders(token),
        signal,
      }),
    ]);

    if (!conversationResponse.ok) {
      const errorData = await conversationResponse.json().catch(() => ({}));
      throw new Error(errorData.detail || `Failed to fetch conversation: ${conversationResponse.status}`);
    }

    const conversation: Conversation = await conversationResponse.json();
    if (!conversation || typeof conversation !== 'object') {
      throw new Error('Invalid conversation data received from server');
    }

    console.log('Conversation data:', conversation);
    
    // First try to get messages from the conversation object if they're included
    let messages: Message[] = [];
    
    if (conversation.messages && Array.isArray(conversation.messages)) {
      console.log('Using messages from conversation object:', conversation.messages);
      messages = conversation.messages;
    } else {
      // Fall back to fetching messages separately if not included
      console.log('Fetching messages separately...');
      messages = await getMessages(id, token, signal);
    }

    console.log(`Returning ${messages.length} messages for conversation ${id}`);
    
    return {
      conversation,
      messages
    };
  } catch (error) {
    console.error('Error in getConversation:', error);
    throw error; // Re-throw to be handled by the caller
  }
};

export const createConversation = async (
  data: CreateConversationData = {},
  token: string | null,
  signal?: AbortSignal
): Promise<Conversation> => {
  try {
    // Prepare the request body
    const requestBody = {
      title: data.title || 'New Conversation',
      is_archived: false,
      initial_message: data.initialMessage,
    };

    const response = await fetch(`${API_BASE_URL}/api/conversations/`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      signal,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { detail: errorText };
      }
      
      console.error('Failed to create conversation:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
        requestBody
      });
      
      throw new Error(errorData.detail || 'Failed to create conversation');
    }

    const conversation = await response.json();
    
    // If there's an initial message, send it as a separate request
    if (data.initialMessage) {
      await sendMessage(conversation.id, data.initialMessage, token, signal);
      // Refetch the conversation to get the updated message count
      return getConversation(conversation.id, token, signal).then(res => res.conversation);
    }
    
    return conversation;
  } catch (error) {
    console.error('Error in createConversation:', error);
    throw error;
  }
};

export const updateConversation = async (
  id: string,
  data: Partial<Conversation>,
  token: string | null,
  signal?: AbortSignal
): Promise<Conversation> => {
  const response = await fetch(`${API_BASE_URL}/api/conversations/${id}/`, {
    method: 'PATCH',
    headers: getAuthHeaders(token),
    signal,
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to update conversation');
  }

  return response.json();
};

export const deleteConversation = async (
  id: string,
  token: string | null,
  signal?: AbortSignal
): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/conversations/${id}/`, {
    method: 'DELETE',
    headers: getAuthHeaders(token),
    signal,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('Failed to delete conversation:', {
      status: response.status,
      statusText: response.statusText,
      error: errorData
    });
    throw new Error(errorData.detail || 'Failed to delete conversation');
  }
};

export interface MessageResponse {
  user_message: Message;
  assistant_message: Message;
  conversation: Conversation;
}

export const sendMessage = async (
  conversationId: string,
  content: string,
  token: string | null,
  signal?: AbortSignal
): Promise<MessageResponse> => {
  try {
    console.log(`Sending message to conversation ${conversationId}:`, content);
    
    // First, send the message to the conversation
    const messageResponse = await fetch(
      `${API_BASE_URL}/api/conversation/`,
      {
        method: 'POST',
        headers: {
          ...getAuthHeaders(token),
          'Content-Type': 'application/json'
        },
        signal,
        body: JSON.stringify({ 
          message: content,
          conversation_id: conversationId,
          role: 'user'
        }),
      }
    );
    
    if (!messageResponse.ok) {
      const errorData = await messageResponse.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to send message');
    }
    
    const responseData = await messageResponse.json();
    console.log('API Response Data:', responseData);
    
    // Create a default assistant message if not provided
    const defaultAssistantMessage: Message = {
      id: `temp-assistant-${Date.now()}`,
      role: 'assistant',
      content: responseData.response || 'I apologize, but I encountered an issue generating a response. Please try again.',
      created_at: new Date().toISOString(),
    };
    
    // If we have a conversation in the response, use it
    if (responseData.conversation) {
      return {
        conversation: responseData.conversation,
        user_message: {
          id: `temp-user-${Date.now()}`,
          role: 'user',
          content: content,
          created_at: new Date().toISOString(),
        },
        assistant_message: defaultAssistantMessage
      };
    }
    
    // If we just have a response, create a minimal conversation object
    if (responseData.response) {
      const tempConversation: Conversation = {
        id: `temp-conversation-${Date.now()}`,
        title: content.slice(0, 50),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_archived: false,
        message_count: 2
      };
      
      return {
        conversation: tempConversation,
        user_message: {
          id: `temp-user-${Date.now()}`,
          role: 'user',
          content: content,
          created_at: new Date().toISOString(),
        },
        assistant_message: defaultAssistantMessage
      };
    }
    
    // Otherwise, fetch the updated conversation with messages
    const response = await fetch(
      `${API_BASE_URL}/api/conversations/${conversationId}/`,
      {
        headers: getAuthHeaders(token),
        signal,
        cache: 'no-store'
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Failed to fetch updated conversation:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      throw new Error(errorData.detail || 'Failed to fetch updated conversation');
    }
    
    // Get the updated conversation and messages
    const updatedConversation = await response.json();
    
    // Get the messages for the conversation
    const messagesResponse = await fetch(
      `${API_BASE_URL}/api/conversations/${conversationId}/messages/`,
      {
        headers: getAuthHeaders(token),
        signal,
        cache: 'no-store'
      }
    );
    
    if (!messagesResponse.ok) {
      const errorData = await messagesResponse.json().catch(() => ({}));
      console.error('Failed to fetch messages:', {
        status: messagesResponse.status,
        statusText: messagesResponse.statusText,
        error: errorData
      });
      throw new Error(errorData.detail || 'Failed to fetch messages');
    }
    
    const messages = await messagesResponse.json();
    
    // Find the last user message and assistant response
    const userMessages = messages.filter((m: Message) => m.role === 'user');
    const assistantMessages = messages.filter((m: Message) => m.role === 'assistant');
    
    const lastUserMessage = userMessages[userMessages.length - 1];
    const lastAssistantMessage = assistantMessages[assistantMessages.length - 1];
    
    return {
      user_message: lastUserMessage,
      assistant_message: lastAssistantMessage,
      conversation: updatedConversation
    };
  } catch (error) {
    console.error('Error in sendMessage:', error);
    throw error;
  }
};

/**
 * Fetches all messages for a conversation, handling pagination
 */
export const getMessages = async (
  conversationId: string,
  token: string | null,
  signal?: AbortSignal
): Promise<Message[]> => {
  try {
    let allMessages: Message[] = [];
    let nextUrl: string | null = `${API_BASE_URL}/api/conversations/${conversationId}/messages/`;
    
    // Keep fetching pages until there are no more
    while (nextUrl) {
      const response = await fetch(nextUrl, {
        headers: getAuthHeaders(token),
        signal,
        cache: 'no-store' // Prevent caching
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to fetch messages:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData.detail || 'Unknown error'
        });
        break;
      }

      const data: PaginatedResponse<Message> = await response.json();
      if (data?.results && Array.isArray(data.results)) {
        allMessages = [...allMessages, ...data.results];
      }
      
      // Check if there's a next page
      nextUrl = data.next;
      
      // If the next URL is relative, make it absolute
      if (nextUrl && !nextUrl.startsWith('http')) {
        const url = new URL(nextUrl, API_BASE_URL);
        nextUrl = url.toString();
      }
    }
    
    // Sort messages by creation date (oldest first)
    return allMessages.sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  } catch (error) {
    console.error('Error in getMessages:', error);
    throw error;
  }
};
