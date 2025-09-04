const axios = require('axios');

const API_BASE_URL = 'http://localhost:8000/api';
const JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzU3MDkzMzE1LCJpYXQiOjE3NTcwMDY5MTUsImp0aSI6IjI4MTRhYWUwMTk4MjQ2ZWZhOTEzYjg2OTM3MTgzMDg2IiwidXNlcl9pZCI6IjIifQ.O_tAEFvavsRofUs7N9WJDgxZ1lXBnBDoWcKuGYfO_SM';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${JWT_TOKEN}`
  }
});

async function testEndpoints() {
  try {
    console.log('=== Testing Conversation API ===\n');

    // 1. Get all conversations
    console.log('1. Fetching all conversations...');
    const conversationsResponse = await api.get('/conversations/');
    console.log('Conversations:', JSON.stringify(conversationsResponse.data, null, 2));
    
    // 2. Create a new conversation
    console.log('\n2. Creating a new conversation...');
    const newConversation = await api.post('/conversations/', {
      title: 'Test Conversation',
      is_archived: false
    });
    console.log('New conversation:', JSON.stringify(newConversation.data, null, 2));
    
    const conversationId = newConversation.data.id;

    // 3. Add a message to the conversation
    console.log(`\n3. Adding a message to conversation ${conversationId}...`);
    const newMessage = await api.post('/messages/', {
      conversation: conversationId,
      content: 'This is a test message',
      role: 'user'
    });
    console.log('Message sent:', JSON.stringify(newMessage.data, null, 2));

    // 4. Get messages for the conversation
    console.log(`\n4. Getting messages for conversation ${conversationId}...`);
    const messagesResponse = await api.get(`/conversations/${conversationId}/messages/`);
    console.log('Messages:', JSON.stringify(messagesResponse.data, null, 2));

    // 5. Delete the conversation
    console.log(`\n5. Deleting conversation ${conversationId}...`);
    await api.delete(`/conversations/${conversationId}/`);
    console.log('Conversation deleted successfully');

  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      const error = err as any; // Type assertion to access AxiosError properties
      console.error('API Error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          data: error.config?.data
        }
      });
    } else if (err instanceof Error) {
      console.error('Unexpected error:', err.message);
    } else {
      console.error('Unknown error occurred');
    }
  }
}

// Run the tests
testEndpoints();
