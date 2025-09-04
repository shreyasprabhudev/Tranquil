import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

// Helper to get the token from the Authorization header
const getTokenFromRequest = (req: NextRequest): string | null => {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.split(' ')[1];
};

// Helper to validate the token format
const validateToken = (token: string): boolean => {
  return typeof token === 'string' && token.length > 0;
};

// Get all conversations for the current user
export async function GET(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req);
    
    if (!token || !validateToken(token)) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized - Invalid or missing token' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/conversations/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to fetch conversations:', error);
      return NextResponse.json(
        { error: `Failed to fetch conversations: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load conversations' },
      { status: 500 }
    );
  }
}

// Create a new conversation or add a message to an existing one
export async function POST(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req);
    
    if (!token || !validateToken(token)) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized - Invalid or missing token' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { message, conversationId } = await req.json();
    
    if (!message) {
      return new NextResponse(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // If we have a conversation ID, add the message to it
    // Otherwise, create a new conversation
    const endpoint = conversationId 
      ? `${process.env.NEXT_PUBLIC_API_URL}/api/conversations/${conversationId}/messages/`
      : `${process.env.NEXT_PUBLIC_API_URL}/api/conversations/`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: message,
        role: 'user',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to send message:', error);
      return NextResponse.json(
        { error: `Failed to send message: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send message' },
      { status: 500 }
    );
  }
}

// Delete a conversation
export async function DELETE(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req);
    
    if (!token || !validateToken(token)) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized - Invalid or missing token' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const conversationId = url.searchParams.get('id');
    
    if (!conversationId) {
      return new NextResponse(
        JSON.stringify({ error: 'Conversation ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/conversations/${conversationId}/`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to delete conversation:', error);
      return NextResponse.json(
        { error: `Failed to delete conversation: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete conversation' },
      { status: 500 }
    );
  }
}
