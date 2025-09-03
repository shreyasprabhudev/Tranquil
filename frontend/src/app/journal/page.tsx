'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Plus, Search, BarChart3, RotateCw } from "lucide-react"
import { JournalEntriesList } from "@/components/journal/JournalEntriesList"
import { NewEntryForm } from "@/components/journal/NewEntryForm"
import { SentimentInsights } from "@/components/journal/SentimentInsights"
import { usePromptGenerator } from "@/components/journal/PromptGenerator"
import { useAuth } from '@/contexts/AuthContext';

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

type TabType = 'entries' | 'insights';

export default function JournalPage() {
  // State
  const [activeTab, setActiveTab] = useState<TabType>('entries');
  const [showNewEntryForm, setShowNewEntryForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  
  // Set token from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  // Fetch entries when token changes
  useEffect(() => {
    if (token) {
      fetchEntries();
    }
  }, [token]);
  
  // Initialize prompt generator
  const { 
    currentPrompt, 
    generatePrompt, 
    isLoading: isGeneratingPrompt 
  } = usePromptGenerator();
  
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
  const handleDeleteEntry = async (id: number) => {
    const entryToDelete = entries.find(entry => entry.id === id);
    if (!entryToDelete) return;
    
    try {
      const response = await fetch(`/api/journal/entries/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete entry');
      }
      
      // Update local state
      const deletedEntry = entries.find(entry => entry.id === id);
      if (deletedEntry) {
        setEntries(prev => prev.filter(entry => entry.id !== id));
        
        // Update stats
        setStats(prev => ({
          ...prev,
          total_entries: prev.total_entries - 1,
          total_words: Math.max(0, prev.total_words - (deletedEntry.word_count || 0)),
          mood_distribution: updateMoodDistribution(prev.mood_distribution, deletedEntry.mood, 'decrement'),
          type_distribution: prev.type_distribution.map(item => 
            item.entry_type === deletedEntry.entry_type 
              ? { ...item, count: Math.max(0, item.count - 1) } 
              : item
          )
        }));
      }
      
    } catch (err) {
      console.error('Error deleting entry:', err);
      setError('Failed to delete entry. Please try again.');
    }
  };
  
  const handleNewEntry = async (newEntry: Omit<JournalEntry, 'id' | 'created_at' | 'updated_at' | 'word_count'>) => {
    if (!token) return;
    
    try {
      const response = await fetch('http://localhost:8000/api/entries/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newEntry,
          word_count: newEntry.content.split(/\s+/).length,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create entry');
      }
      
      const createdEntry = await response.json();
      
      // Update local state
      setEntries(prev => [createdEntry, ...prev]);
      
      // Update stats
      setStats(prev => ({
        ...prev,
        total_entries: prev.total_entries + 1,
        total_words: prev.total_words + (createdEntry.word_count || 0),
        mood_distribution: updateMoodDistribution(prev.mood_distribution, createdEntry.mood, 'increment'),
        type_distribution: prev.type_distribution.some(item => item.entry_type === createdEntry.entry_type)
          ? prev.type_distribution.map(item => 
              item.entry_type === createdEntry.entry_type 
                ? { ...item, count: item.count + 1 } 
               : item
            )
          : [...prev.type_distribution, { entry_type: createdEntry.entry_type, count: 1 }]
      }));
      
      return createdEntry;
      
    } catch (err) {
      console.error('Error creating entry:', err);
      setError('Failed to create entry. Please try again.');
      throw err;
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

  // Fetch journal entries from API
  const fetchEntries = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/api/entries/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error:', errorData);
        throw new Error(`Failed to fetch journal entries: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('API Response:', data);
      
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
      setError('Failed to load journal entries. Please try again.');
      console.error('Error loading journal entries:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Effects
  useEffect(() => {
    // Get token from localStorage
    const tokens = localStorage.getItem('authTokens');
    const authToken = tokens ? JSON.parse(tokens).access : null;
    setToken(authToken);
    
    if (isAuthenticated && authToken) {
      fetchEntries();
    }
  }, [isAuthenticated]);
  
  // Generate a new prompt when the component mounts
  useEffect(() => {
    if (isAuthenticated && token) {
      generatePrompt({
        recentEntry: entries[0]?.content,
        timeOfDay: getTimeOfDay(),
      });
    }
  }, [isAuthenticated, token]);
  
  // Helper function to get time of day
  const getTimeOfDay = (): 'morning' | 'afternoon' | 'evening' => {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  };
  
  // Prepare entries for sentiment analysis
  const entriesForSentiment = entries.map(entry => ({
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
          <Button onClick={() => setShowNewEntryForm(true)}>
            <Plus className="mr-2 h-4 w-4" /> New Entry
          </Button>
        </div>
      </div>

      {/* New Entry Form Modal */}
      <NewEntryForm 
        open={showNewEntryForm}
        onClose={() => setShowNewEntryForm(false)} 
        onNewEntry={handleNewEntry}
      />

      {activeTab === 'entries' ? (
        <div className="space-y-6">
          {/* Sentiment Insights Card */}
          {!loading && entries.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Your Sentiment Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <SentimentInsights entries={entriesForSentiment} />
              </CardContent>
            </Card>
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
            
            {/* Prompt Suggestion */}
            {currentPrompt && (
              <div className="flex items-center gap-2 bg-muted/50 p-2 rounded-lg text-sm text-muted-foreground">
                <span className="font-medium">Prompt:</span>
                <span className="flex-1">{currentPrompt}</span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6"
                  onClick={() => generatePrompt({
                    recentEntry: entries[0]?.content,
                    timeOfDay: getTimeOfDay(),
                  })}
                  disabled={isGeneratingPrompt}
                >
                  <RotateCw className={`h-3.5 w-3.5 ${isGeneratingPrompt ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            )}
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
              {filteredEntries.length > 0 ? (
                <JournalEntriesList 
                  entries={filteredEntries} 
                  onDelete={handleDeleteEntry} 
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
