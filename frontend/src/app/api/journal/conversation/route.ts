import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';

export async function GET(req: Request) {
  try {
    const { getToken } = getAuth();
    const token = await getToken();
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/journal/conversation/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch conversation');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching conversation:', error);
    return NextResponse.json(
      { error: 'Failed to load conversation' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { getToken } = getAuth();
    const token = await getToken();
    const { message } = await req.json();
    
    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/journal/conversation/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      throw new Error('Failed to send message');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const { getToken } = getAuth();
    const token = await getToken();
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/journal/conversation/`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to clear conversation');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error clearing conversation:', error);
    return NextResponse.json(
      { error: 'Failed to clear conversation' },
      { status: 500 }
    );
  }
}
