'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Plus, Search } from "lucide-react"
import { JournalEntriesList } from "@/components/journal/JournalEntriesList"
import { NewEntryForm } from "@/components/journal/NewEntryForm"
import { useAuth } from '@/contexts/AuthContext';

interface MoodStat {
  mood: string;
  count: number;
}

interface JournalStats {
  total_entries: number;
  total_words: number;
  mood_distribution: MoodStat[];
  type_distribution: Array<{ entry_type: string; count: number }>;
}

export default function JournalPage() {
  console.log('JournalPage component rendering...');
  const [stats, setStats] = useState<JournalStats>({
    total_entries: 0,
    total_words: 0,
    mood_distribution: [],
    type_distribution: []
  });
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const handleDeleteEntry = (id: number) => {
    setEntries(entries.filter(entry => entry.id !== id));
    // Update stats to reflect the deletion
    setStats(prev => ({
      ...prev,
      total_entries: Math.max(0, prev.total_entries - 1),
      // Note: We don't update word count here as we don't have the word count of the deleted entry
    }));
  };
  const { isAuthenticated } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  
  useEffect(() => {
    // Get token directly from localStorage to ensure we have it
    const tokens = localStorage.getItem('authTokens');
    const authToken = tokens ? JSON.parse(tokens).access : null;
    setToken(authToken);
    console.log('Auth state - isAuthenticated:', isAuthenticated, 'token exists:', !!authToken);
  }, [isAuthenticated]);

  useEffect(() => {
    console.log('useEffect running, token:', token ? 'exists' : 'missing');
    
    const fetchData = async () => {
      if (!token) {
        console.log('No token available, skipping fetch');
        return;
      }
      
      console.log('Fetching journal data...');
      try {
        // Fetch stats
        const statsResponse = await fetch('http://localhost:8000/api/entries/stats/', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!statsResponse.ok) {
          throw new Error('Failed to fetch journal stats');
        }

        const statsData = await statsResponse.json();
        console.log('Stats data received:', statsData);
        setStats({
          total_entries: statsData.total_entries || 0,
          total_words: statsData.total_words || 0,
          mood_distribution: statsData.mood_distribution || [],
          type_distribution: statsData.type_distribution || []
        });

        // Fetch entries
        const entriesResponse = await fetch('http://localhost:8000/api/entries/', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!entriesResponse.ok) {
          throw new Error('Failed to fetch journal entries');
        }

        const entriesData = await entriesResponse.json();
        console.log('Entries data received:', entriesData);
        // Handle both paginated and non-paginated responses
        setEntries(entriesData.results || entriesData);
      } catch (err) {
        console.error('Error fetching journal data:', err);
        setError('Failed to load journal data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);
  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Left side - Journal Entries List */}
        <div className="w-full md:w-1/2 lg:w-2/3">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">My Journal</h1>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search entries..."
                  className="pl-8 w-[200px] md:w-[300px]"
                />
              </div>
              <NewEntryForm />
            </div>
          </div>
          
          <JournalEntriesList 
            entries={entries} 
            loading={loading} 
            error={error} 
            onDelete={handleDeleteEntry}
            token={token}
          />
        </div>
        
        {/* Right side - Stats and Quick Actions */}
        <div className="w-full md:w-1/2 lg:w-1/3 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Journal Stats</CardTitle>
              <CardDescription>Your journaling activity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {[1, 2].map((i) => (
                      <div key={i} className="rounded-lg border p-4">
                        <div className="h-8 bg-muted rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-muted rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-medium">Mood Distribution</h3>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="h-4 bg-muted rounded w-1/3"></div>
                        <div className="h-4 bg-muted rounded w-8"></div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : error ? (
                <div className="text-destructive text-sm">{error}</div>
              ) : (
                <>
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
                      {stats.mood_distribution.map(({ mood, count }) => (
                        <div key={mood} className="flex items-center justify-between">
                          <span>{mood}</span>
                          <span className="text-muted-foreground">
                            {count} {count === 1 ? 'entry' : 'entries'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
              </CardContent>
            </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Plus className="mr-2 h-4 w-4" /> New Entry
              </Button>
              <Button variant="outline" className="w-full justify-start">
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
              <Button variant="outline" className="w-full justify-start">
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
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                  <path d="m15 5 3 3" />
                </svg>
                Write a Note
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
