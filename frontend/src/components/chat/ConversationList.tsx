import React from 'react';
import { useConversation } from '@/contexts/ConversationContext';
import { Button } from '@/components/ui/button';
import { Plus, Archive, Trash2, Pencil, ArchiveRestore } from 'lucide-react';
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
    archiveConversation,
    updateCurrentConversation,
    showArchived,
    toggleShowArchived,
  } = useConversation();

  const handleNewConversation = async () => {
    try {
      await createNewConversation();
    } catch (error) {
      console.error('Failed to create new conversation:', error);
    }
  };

  const handleDelete = async (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this conversation?')) {
      try {
        await deleteConversation(conversationId);
      } catch (error) {
        console.error('Failed to delete conversation:', error);
      }
    }
  };

  const handleArchive = async (e: React.MouseEvent, conversationId: string, isArchived: boolean) => {
    e.stopPropagation();
    try {
      await archiveConversation(conversationId, !isArchived);
    } catch (error) {
      console.error('Failed to update conversation:', error);
    }
  };

  const handleTitleEdit = async (e: React.FocusEvent<HTMLDivElement>, conversationId: string) => {
    const newTitle = e.currentTarget.textContent?.trim() || 'New Conversation';
    
    try {
      await updateCurrentConversation({ title: newTitle });
    } catch (error) {
      console.error('Failed to update conversation title:', error);
      // Revert the title in the UI if the update fails
      e.currentTarget.textContent = currentConversation?.title || 'New Conversation';
    }
  };

  if (isLoading && conversations.length === 0) {
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
        
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 mt-2 text-muted-foreground"
          onClick={toggleShowArchived}
        >
          {showArchived ? (
            <>
              <ArchiveRestore className="h-4 w-4" />
              Show Active
            </>
          ) : (
            <>
              <Archive className="h-4 w-4" />
              Show Archived
            </>
          )}
        </Button>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            {showArchived ? 'No archived conversations' : 'No conversations yet'}
          </div>
        ) : (
          <div className="divide-y">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                className={cn(
                  'p-4 hover:bg-accent cursor-pointer transition-colors',
                  currentConversation?.id === conversation.id && 'bg-accent'
                )}
                onClick={() => switchConversation(conversation.id)}
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div
                      className="font-medium truncate outline-none"
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => handleTitleEdit(e, conversation.id)}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {conversation.title}
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
                      className="h-6 w-6 text-muted-foreground hover:text-foreground"
                      onClick={(e) => handleArchive(e, conversation.id, conversation.is_archived)}
                      title={conversation.is_archived ? 'Restore' : 'Archive'}
                    >
                      {conversation.is_archived ? (
                        <ArchiveRestore className="h-3.5 w-3.5" />
                      ) : (
                        <Archive className="h-3.5 w-3.5" />
                      )}
                    </Button>
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
