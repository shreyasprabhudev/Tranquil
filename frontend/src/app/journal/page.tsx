'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Plus, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { JournalEntriesList } from "@/components/journal/JournalEntriesList"
import { NewEntryForm } from "@/components/journal/NewEntryForm"
import { SentimentInsights } from "@/components/journal/SentimentInsights"
import { BarChart3, Trash2 } from "lucide-react"

// Types
type JournalEntry = {
  id: number;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  mood?: string;
  word_count: number;
  entry_type: string;
  is_private: boolean;
};

type JournalStats = {
  total_entries: number;
  total_words: number;
  mood_distribution: { mood: string; count: number }[];
  type_distribution: { entry_type: string; count: number }[];
};

type TabType = 'entries' | 'insights' | 'chat';

function JournalPage() {
  // State
  const [activeTab, setActiveTab] = useState<TabType>('entries');
  const [showNewEntryForm, setShowNewEntryForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  
  // AbortController for cancelling in-flight requests
  const abortControllerRef = useRef<AbortController | null>(null);

  // Set token from localStorage on mount and set up cleanup
  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
      setToken(storedToken);
    }

    // Cleanup function to abort any pending requests
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Fetch entries when token changes
  useEffect(() => {
    if (!token) return;
    
    // Abort any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    const fetchData = async () => {
      try {
        await fetchEntries(controller.signal);
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Error fetching entries:', err);
          setError('Failed to load journal entries');
        }
      }
    };
    
    fetchData();
    
    return () => {
      controller.abort();
    };
  }, [token]);
  
  // Derived state
  const [stats, setStats] = useState<JournalStats>({
    total_entries: 0,
    total_words: 0,
    mood_distribution: [],
    type_distribution: []
  });

  // Filter entries based on search query
  const filteredEntries = entries.filter(entry => 
    entry.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handlers
  const handleDeleteAllEntries = async () => {
    if (!token) {
      alert('Authentication error. Please refresh the page and try again.');
      return;
    }
    
    if (!window.confirm('Are you sure you want to delete ALL journal entries? This cannot be undone.')) {
      return;
    }

    // Abort any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    setLoading(true);
    
    try {
      let allEntries: JournalEntry[] = [];
      let nextUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/entries/`;
      
      // Fetch all pages of entries
      while (nextUrl) {
        const response = await fetch(nextUrl, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (!response.ok) throw new Error('Failed to fetch entries');
        
        const data = await response.json();
        
        // Add the current page of entries to our list
        if (data.results) {
          allEntries = [...allEntries, ...data.results];
        } else if (Array.isArray(data)) {
          allEntries = [...allEntries, ...data];
        } else {
          allEntries = [...allEntries, data];
        }
        
        // Check for next page URL in the response
        nextUrl = data.next || '';
      }
      
      if (allEntries.length === 0) {
        toast.info('No entries to delete');
        return;
      }
      
      // Delete entries in batches to avoid overwhelming the server
      const BATCH_SIZE = 5;
      for (let i = 0; i < allEntries.length; i += BATCH_SIZE) {
        if (controller.signal.aborted) return;
        
        const batch = allEntries.slice(i, i + BATCH_SIZE);
        await Promise.all(batch.map((entry: JournalEntry) => 
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/entries/${entry.id}/`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            signal: controller.signal,
          }).then(response => {
            if (response.status === 401) {
              throw new Error('Authentication failed');
            }
            if (!response.ok) {
              throw new Error(`Failed to delete entry ${entry.id}`);
            }
            return response;
          })
        ));
        
        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      setEntries([]);
      
      // Reset stats
      const emptyStats = {
        total_entries: 0,
        total_words: 0,
        mood_distribution: [],
        type_distribution: []
      };
      setStats(emptyStats);
      
      // Refresh from server to ensure consistency
      await fetchEntries();
      
      toast.success(`Successfully deleted ${allEntries.length} entries`);
    } catch (err) {
      console.error('Error deleting entries:', err);
      toast.error('Failed to delete entries. Please try again.');
      // Refresh from server to recover from any partial deletions
      fetchEntries();
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEntry = async (id: number) => {
    if (!token) {
      console.error('No authentication token available');
      toast.error('Authentication error. Please refresh the page and try again.');
      return;
    }
    
    // Save the current state for potential rollback
    const previousEntries = [...entries];
    const previousStats = { ...stats };
    
    // Find the entry being deleted
    const deletedEntry = entries.find(entry => entry.id === id);
    if (!deletedEntry) {
      console.error('Entry not found for deletion:', id);
      return;
    }
    
    // Optimistically update the UI
    const updatedEntries = entries.filter(entry => entry.id !== id);
    setEntries(updatedEntries);
    
    // Update stats optimistically
    const updatedMoodDist = updateMoodDistribution(stats.mood_distribution, deletedEntry.mood, 'decrement');
    const updatedTypeDist = stats.type_distribution.map(item => 
      item.entry_type === deletedEntry.entry_type 
        ? { ...item, count: Math.max(0, item.count - 1) } 
        : item
    );
    
    const updatedStats = {
      ...stats,
      total_entries: Math.max(0, stats.total_entries - 1),
      total_words: Math.max(0, stats.total_words - (deletedEntry.word_count || 0)),
      mood_distribution: updatedMoodDist.filter(mood => mood.count > 0),
      type_distribution: updatedTypeDist.filter(type => type.count > 0)
    };
    setStats(updatedStats);
    
    // Create a new AbortController for this request
    const controller = new AbortController();
    
    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/entries/${id}/`;
      const response = await fetch(apiUrl, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });
      
      // Handle authentication errors
      if (response.status === 401) {
        console.error('Authentication failed, refreshing page...');
        window.location.reload();
        return;
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to delete entry');
      }
      
      // Show success message
      toast.success('Entry deleted successfully', {
        duration: 3000,
      });
      
    } catch (err) {
      // Don't revert if the request was aborted (component unmounted)
      if (err.name === 'AbortError') return;
      
      // Revert to previous state on error
      setEntries(previousEntries);
      setStats(previousStats);
      
      console.error('Error deleting entry:', err);
      toast.error(err.message || 'Failed to delete entry. Please try again.', {
        duration: 5000,
      });
    } finally {
      // Clean up the AbortController
      controller.abort();
    }
  };
  
  const handleUpdateEntry = async (id: number, updatedData: Partial<JournalEntry>) => {
    if (!token) return;
    
    // Save the current state for potential rollback
    const previousEntries = [...entries];
    const previousStats = { ...stats };
    
    // Optimistically update the UI
    const updatedEntries = entries.map(entry => 
      entry.id === id ? { ...entry, ...updatedData, updated_at: new Date().toISOString() } : entry
    );
    setEntries(updatedEntries);
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/entries/${id}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const updatedEntry = await response.json();
      
      // Update the entry with the server response
      setEntries(prevEntries => 
        prevEntries.map(entry => 
          entry.id === id ? { ...entry, ...updatedEntry } : entry
        )
      );
      
      toast.success('Entry updated successfully');
      return updatedEntry;
      
    } catch (err) {
      console.error('Error updating entry:', err);
      // If the API call fails, revert to the previous state
      setEntries(previousEntries);
      setStats(previousStats);
      toast.error('Failed to update entry. Please try again.');
      throw err;
    }
  };
  
  const handleNewEntry = async (entryData: Omit<JournalEntry, 'id' | 'created_at' | 'updated_at'>) => {
    if (!token) return;
    
    try {
      const now = new Date().toISOString();
      let savedEntry: JournalEntry;

      if (editingEntry) {
        // Update existing entry
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/entries/${editingEntry.id}/`,
          {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ...entryData,
              updated_at: now,
            }),
          }
        );

        if (!response.ok) throw new Error('Failed to update entry');
        
        savedEntry = await response.json();
        
        setEntries(prevEntries => 
          prevEntries.map(entry => 
            entry.id === editingEntry.id ? { ...entry, ...savedEntry } : entry
          )
        );
        setEditingEntry(null);
      } else {
        // Create new entry
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/entries/`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ...entryData,
              created_at: now,
              updated_at: now,
            }),
          }
        );

        if (!response.ok) throw new Error('Failed to create entry');
        
        savedEntry = await response.json();
        setEntries(prevEntries => [savedEntry, ...prevEntries]);
      }
      
      toast.success(`Entry ${editingEntry ? 'updated' : 'created'} successfully`);
    } catch (error) {
      console.error('Error saving entry:', error);
      toast.error(`Failed to ${editingEntry ? 'update' : 'create'} entry. Please try again.`);
      throw error;
    } finally {
      setShowNewEntryForm(false);
    }
  };

  // Helper functions
  const updateMoodDistribution = (
    currentDistribution: { mood: string; count: number }[],
    mood: string = 'neutral',
    action: 'increment' | 'decrement' = 'increment'
  ) => {
    const moodIndex = currentDistribution.findIndex(m => m.mood === mood);
    const newDistribution = [...currentDistribution];
    
    if (moodIndex >= 0) {
      newDistribution[moodIndex] = {
        ...newDistribution[moodIndex],
        count: action === 'increment' 
          ? newDistribution[moodIndex].count + 1 
          : Math.max(0, newDistribution[moodIndex].count - 1)
      };
    } else if (action === 'increment') {
      newDistribution.push({ mood, count: 1 });
    }
    
    return newDistribution;
  };

  // Fetch journal entries from API with request cancellation support
  const fetchEntries = async (signal?: AbortSignal) => {
    if (!token) {
      console.error('No authentication token available');
      setError('Authentication required. Please sign in again.');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/entries/`;
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        signal,
      });
      
      // Check if the request was aborted
      if (signal?.aborted) return;
      
      // Handle authentication errors
      if (response.status === 401) {
        console.error('Authentication failed, refreshing page...');
        window.location.reload();
        return;
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to fetch journal entries: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Check again if the request was aborted after getting the data
      if (signal?.aborted) return;
      
      // Handle different response formats
      const entries = Array.isArray(data) ? data : data.results || data.entries || [];
      setEntries(entries);
      
      // Calculate stats
      const moodCounts = entries.reduce((acc: Record<string, number>, entry: JournalEntry) => {
        const mood = entry.mood || 'neutral';
        acc[mood] = (acc[mood] || 0) + 1;
        return acc;
      }, {});
      
      const typeCounts = entries.reduce((acc: Record<string, number>, entry: JournalEntry) => {
        const type = entry.entry_type || 'journal';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {});
      
      setStats({
        total_entries: entries.length,
        total_words: entries.reduce((sum: number, entry: JournalEntry) => sum + (entry.word_count || 0), 0),
        mood_distribution: Object.entries(moodCounts).map(([mood, count]) => ({ mood, count: count as number })),
        type_distribution: Object.entries(typeCounts).map(([entry_type, count]) => ({ entry_type, count: count as number }))
      });
      
    } catch (err) {
      // Don't show error if the request was aborted
      if (err.name === 'AbortError') return;
      
      console.error('Error loading journal entries:', err);
      setError(err.message || 'Failed to load journal entries. Please try again.');
      
      // Show error toast
      toast.error(err.message || 'Failed to load journal entries', {
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Effects
  useEffect(() => {
    // Get token from localStorage
    const getTokenFromStorage = () => {
      try {
        const tokens = localStorage.getItem('authTokens');
        if (!tokens) return null;
        
        const parsedTokens = JSON.parse(tokens);
        const authToken = parsedTokens?.access || null;
        
        // If we have a token in state that's different from storage, update it
        if (authToken && authToken !== token) {
          setToken(authToken);
        }
        
        return authToken;
      } catch (err) {
        console.error('Error parsing auth tokens:', err);
        return null;
      }
    };
    
    const authToken = getTokenFromStorage();
    
    // Only fetch entries if we have a valid token and the user is authenticated
    if (isAuthenticated && authToken) {
      // Abort any existing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      const controller = new AbortController();
      abortControllerRef.current = controller;
      
      const fetchData = async () => {
        try {
          await fetchEntries(controller.signal);
        } catch (err) {
          if (err.name !== 'AbortError') {
            console.error('Error fetching entries:', err);
            setError('Failed to load journal entries');
          }
        }
      };
      
      fetchData();
      
      return () => {
        controller.abort();
      };
    } else if (!isAuthenticated) {
      // If user is not authenticated, clear the entries
      setEntries([]);
      setError('Please sign in to view your journal entries');
    }
  }, [isAuthenticated, token]);


  
  // Helper function to get time of day
  const getTimeOfDay = (): 'morning' | 'afternoon' | 'evening' => {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  };
  
  // Prepare entries for sentiment analysis (using only the 10 most recent entries)
  const entriesForSentiment = entries
    .slice(0, 10)
    .map(entry => ({
      content: entry.content,
      timestamp: entry.created_at
    }));

  if (loading && entries.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 border rounded-lg">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Journal</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setActiveTab(activeTab === 'entries' ? 'insights' : 'entries')}
            className="gap-2"
          >
            {activeTab === 'entries' ? (
              <>
                <BarChart3 className="h-4 w-4" />
                View Insights
              </>
            ) : (
              <span>← Back to Entries</span>
            )}
          </Button>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleDeleteAllEntries} disabled={loading}>
              <Trash2 className="mr-2 h-4 w-4" />
              {loading ? 'Deleting...' : 'Delete All Entries'}
            </Button>
            <Button onClick={() => setShowNewEntryForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Entry
            </Button>
          </div>
        </div>
      </div>

      {/* New Entry Form Modal */}
      <NewEntryForm 
        open={showNewEntryForm}
        onClose={() => {
          setShowNewEntryForm(false);
          setEditingEntry(null);
        }}
        onNewEntry={handleNewEntry}
        initialData={editingEntry || undefined}
      />

      {activeTab === 'entries' ? (
        <div className="space-y-6">
          {/* Sentiment Insights Card */}
          {!loading && entries.length > 0 && (
            <SentimentInsights 
              entries={entriesForSentiment} 
              className="w-full"
            />
          )}
          <div className="flex flex-col md:flex-row gap-4 w-full">
            {/* Search Bar */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search entries..."
                className="pl-9 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[1, 2].map((i) => (
                  <div key={i} className="rounded-lg border p-4">
                    <div className="h-8 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <h3 className="font-medium">Loading your journal...</h3>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="h-4 bg-muted rounded w-1/3" />
                    <div className="h-4 bg-muted rounded w-8" />
                  </div>
                ))}
              </div>
            </div>
          ) : error ? (
            // Error State
            <Card>
              <CardContent className="pt-6 text-destructive">
                <p>{error}</p>
              </CardContent>
            </Card>
          ) : (
            // Main Content
            <div className="space-y-6">
              <div className="flex-1 overflow-auto">
                {filteredEntries.length > 0 ? (
                  <JournalEntriesList 
                    entries={filteredEntries} 
                    onDelete={handleDeleteEntry}
                    onUpdate={handleUpdateEntry}
                    loading={loading}
                    error={error}
                  />
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">
                      {searchQuery 
                        ? 'No entries match your search.' 
                        : 'No entries yet. Start by creating your first journal entry.'
                      }
                    </p>
                    {!searchQuery && (
                      <Button 
                        className="mt-4" 
                        onClick={() => setShowNewEntryForm(true)}
                      >
                        <Plus className="mr-2 h-4 w-4" /> New Entry
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Stats Section */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-lg border p-4">
                        <div className="text-2xl font-bold">{stats.total_entries}</div>
                        <div className="text-sm text-muted-foreground">Total Entries</div>
                      </div>
                      <div className="rounded-lg border p-4">
                        <div className="text-2xl font-bold">{stats.total_words.toLocaleString()}</div>
                        <div className="text-sm text-muted-foreground">Words Written</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="font-medium">Mood Distribution</h3>
                      <div className="space-y-1">
                        {stats.mood_distribution.length > 0 ? (
                          stats.mood_distribution.map(({ mood, count }) => (
                            <div key={mood} className="flex items-center justify-between">
                              <span>{mood}</span>
                              <span className="text-muted-foreground">
                                {count} {count === 1 ? 'entry' : 'entries'}
                              </span>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">No mood data available</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => setShowNewEntryForm(true)}
                    >
                      <Plus className="mr-2 h-4 w-4" /> New Entry
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => {
                        setSearchQuery('');
                        // In a real app, you might want to implement a daily reflection feature
                      }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mr-2 h-4 w-4"
                      >
                        <path d="M12 2v4" />
                        <path d="m16.24 7.76 2.83-2.83" />
                        <path d="M18 12h4" />
                        <path d="m18 16-2.8 3" />
                        <path d="M12 18v4" />
                        <path d="m4.93 19.07 2.83-2.83" />
                        <path d="M2 12h4" />
                        <path d="m4.93 4.93 2.83 2.83" />
                      </svg>
                      Daily Reflection
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      ) : (
        // Insights Tab
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Journal Insights</CardTitle>
              <p className="text-sm text-muted-foreground">
                View your journaling patterns and statistics
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-2">Word Count</h3>
                  <div className="text-4xl font-bold">{stats.total_words.toLocaleString()}</div>
                  <p className="text-sm text-muted-foreground">
                    Total words written across {stats.total_entries} entries
                  </p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Mood Distribution</h3>
                  <div className="space-y-2">
                    {stats.mood_distribution.length > 0 ? (
                      stats.mood_distribution.map(({ mood, count }) => (
                        <div key={mood} className="flex items-center justify-between">
                          <span className="capitalize">{mood}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">
                              {count} {count === 1 ? 'entry' : 'entries'}
                            </span>
                            <div 
                              className="h-2 bg-primary rounded-full" 
                              style={{ width: `${(count / stats.total_entries) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No mood data available</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default function ProtectedJournalPage() {
  return (
    <ProtectedRoute>
      <JournalPage />
    </ProtectedRoute>
  );
}
