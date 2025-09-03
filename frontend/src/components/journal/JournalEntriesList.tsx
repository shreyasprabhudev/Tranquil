'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Heart, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface JournalEntry {
  id: number;
  title: string;
  content: string;
  mood: string;
  entry_type: string;
  created_at: string;
  updated_at: string;
  is_private: boolean;
  tags: string[];
  word_count: number;
  sentiment_score: number | null;
}

interface JournalEntriesListProps {
  entries: JournalEntry[];
  loading: boolean;
  error: string | null;
  onDelete: (id: number) => void;
  token: string | null;
}

export function JournalEntriesList({ entries, loading, error, onDelete, token }: JournalEntriesListProps) {

  const handleDelete = async (id: number) => {
    if (!token) {
      console.error('No token available for delete operation');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this entry?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/api/entries/${id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete entry');
      }

      // Call the parent's onDelete handler to update the state
      onDelete(id);
    } catch (err) {
      console.error('Error deleting journal entry:', err);
      alert('Failed to delete entry. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-red-500">{error}</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4">📝</div>
        <h3 className="text-lg font-medium mb-2">No journal entries yet</h3>
        <p className="text-muted-foreground mb-4">Start by creating your first journal entry</p>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Entry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {entries.map((entry) => (
        <Card key={entry.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg">
                  {entry.title || 'Untitled Entry'}
                </CardTitle>
                <div className="flex items-center text-sm text-muted-foreground mt-1">
                  <span className="mr-4">
                    {format(new Date(entry.created_at), 'MMM d, yyyy')}
                  </span>
                  {entry.entry_type && (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-secondary text-secondary-foreground">
                      {entry.entry_type}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex space-x-1">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Edit className="h-4 w-4" />
                  <span className="sr-only">Edit</span>
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => handleDelete(entry.id)}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Delete</span>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="flex items-start">
              {entry.mood && (
                <div className="text-3xl mr-4">
                  {entry.mood}
                </div>
              )}
              <div className="flex-1">
                <p className="text-sm whitespace-pre-line">
                  {entry.content.length > 200
                    ? `${entry.content.substring(0, 200)}...`
                    : entry.content}
                </p>
                {entry.tags && entry.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {entry.tags.map((tag) => (
                      <span 
                        key={tag} 
                        className="px-2 py-0.5 text-xs rounded-full bg-secondary text-secondary-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
