import { getToken } from "@/lib/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
  metadata?: Record<string, any>;
}

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  is_archived: boolean;
  message_count?: number;
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

export const getConversations = async (archived = false): Promise<Conversation[]> => {
  const token = await getToken();
  const response = await fetch(`${API_BASE_URL}/api/conversations/?archived=${archived}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch conversations');
  }

  return response.json();
};

export const getConversation = async (id: string): Promise<{ conversation: Conversation; messages: Message[] }> => {
  const token = await getToken();
  const response = await fetch(`${API_BASE_URL}/api/conversations/${id}/`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch conversation');
  }

  return response.json();
};

export const createConversation = async (data: CreateConversationData = {}): Promise<Conversation> => {
  const token = await getToken();
  const response = await fetch(`${API_BASE_URL}/api/conversations/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: data.title || 'New Conversation',
      ...(data.initialMessage && {
        messages: [{
          role: 'user',
          content: data.initialMessage,
        }]
      })
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to create conversation');
  }

  return response.json();
};

export const updateConversation = async (id: string, data: Partial<Conversation>): Promise<Conversation> => {
  const token = await getToken();
  const response = await fetch(`${API_BASE_URL}/api/conversations/${id}/`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to update conversation');
  }

  return response.json();
};

export const deleteConversation = async (id: string): Promise<void> => {
  const token = await getToken();
  const response = await fetch(`${API_BASE_URL}/api/conversations/${id}/`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to delete conversation');
  }
};

export const sendMessage = async (conversationId: string, content: string): Promise<Message> => {
  const token = await getToken();
  const response = await fetch(`${API_BASE_URL}/api/messages/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      conversation: conversationId,
      content,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to send message');
  }

  return response.json();
};

export const getMessages = async (conversationId: string): Promise<Message[]> => {
  const token = await getToken();
  const response = await fetch(`${API_BASE_URL}/api/messages/?conversation=${conversationId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch messages');
  }

  return response.json();
};
