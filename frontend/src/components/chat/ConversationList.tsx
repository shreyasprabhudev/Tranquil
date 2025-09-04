import React from 'react';
import { useConversation } from '@/contexts/ConversationContext';
import * as conversationAPI from '@/lib/api/conversation';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

export const ConversationList: React.FC = () => {
  const {
    conversations,
    currentConversation,
    isLoading,
    createNewConversation,
    switchConversation,
    deleteConversation,
    updateCurrentConversation,
  } = useConversation();

  const handleNewConversation = async () => {
    try {
      const newConversation = await createNewConversation();
      await switchConversation(newConversation.id);
    } catch (err) {
      console.error('Failed to create conversation:', err);
      alert('Failed to create a new conversation. Please try again.');
    }
  };

  const handleDelete = async (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) return;
    
    try {
      await deleteConversation(conversationId);
    } catch (err) {
      console.error('Failed to delete conversation:', err);
      alert('Failed to delete conversation. Please try again.');
    }
  };


  const handleConversationClick = async (conversationId: string) => {
    if (currentConversation?.id !== conversationId) {
      try {
        await switchConversation(conversationId);
      } catch (err) {
        console.error('Failed to switch conversation:', err);
        alert('Failed to load conversation. Please try again.');
      }
    }
  };

  // Ensure conversations is always treated as an array
  const safeConversations = Array.isArray(conversations) ? conversations : [];

  if (isLoading && safeConversations.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b">
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            disabled
          >
            <Plus className="h-4 w-4" />
            New Chat
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={handleNewConversation}
        >
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {safeConversations.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            No conversations yet
          </div>
        ) : (
          <div className="divide-y">
            {safeConversations.map((conversation) => (
              <div
                key={conversation.id}
                className={cn(
                  'p-4 hover:bg-accent cursor-pointer transition-colors',
                  currentConversation?.id === conversation.id && 'bg-accent'
                )}
                onClick={() => handleConversationClick(conversation.id)}
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {conversation.title || 'New Conversation'}
                    </div>
                    {conversation.last_message && (
                      <p className="text-sm text-muted-foreground truncate mt-1">
                        {conversation.last_message.content}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(conversation.updated_at), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                  
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      onClick={(e) => handleDelete(e, conversation.id)}
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
