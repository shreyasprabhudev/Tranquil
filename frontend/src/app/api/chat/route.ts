import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

interface JournalEntry {
  id: number;
  content: string;
  created_at: string;
  sentiment?: {
    score: number;
    label: string;
  };
}

export async function POST(req: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new NextResponse('Unauthorized - No token provided', { status: 401 });
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return new NextResponse('Unauthorized - Invalid token format', { status: 401 });
    }

    const { message } = await req.json();
    
    if (!message) {
      return new NextResponse('Message is required', { status: 400 });
    }

    // Fetch recent journal entries for context
    let journalContext = [];
    try {
      const entriesResponse = await fetch('http://localhost:8000/api/entries/recent/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (entriesResponse.ok) {
        const responseData = await entriesResponse.json();
        // Handle paginated response
        const entriesData = responseData.results || responseData;
        
        if (Array.isArray(entriesData)) {
          journalContext = entriesData.map((entry: any) => ({
            id: entry.id,
            content: entry.content,
            date: entry.created_at,
            sentiment: entry.sentiment?.label || 'neutral',
          }));
        }
      } else {
        console.error('Failed to fetch journal entries:', await entriesResponse.text());
      }
    } catch (error) {
      console.error('Error fetching journal entries:', error);
    }

    // Forward the request to the backend API with the token and journal context
    const response = await fetch('http://localhost:8000/api/conversation/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ 
        message,
        context: {
          journal_entries: journalContext,
          timestamp: new Date().toISOString(),
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Backend API error:', error);
      return NextResponse.json(
        { error: 'Failed to get response from AI' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Chat API error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
