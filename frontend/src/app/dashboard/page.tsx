'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Plus } from 'lucide-react';

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
}

export default function DashboardPage() {
    const { user, token, isAuthenticated, loading } = useAuth();
    const router = useRouter();
    const [recentEntries, setRecentEntries] = useState<JournalEntry[]>([]);
    const [stats, setStats] = useState({
        totalEntries: 0,
        wordCount: 0,
        moodDistribution: {},
    });
    const [isLoading, setIsLoading] = useState(true);

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push('/login');
        } else if (isAuthenticated && token) {
            fetchDashboardData();
        }
    }, [isAuthenticated, loading, router, token]);

    const fetchDashboardData = async () => {
        try {
            setIsLoading(true);
            const [entriesResponse, statsResponse] = await Promise.all([
                fetch('http://localhost:8000/api/entries/recent/', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }),
                fetch('http://localhost:8000/api/entries/stats/', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }),
            ]);

            if (entriesResponse.ok) {
                const entriesData = await entriesResponse.json();
                setRecentEntries(entriesData.results || entriesData);
            }

            if (statsResponse.ok) {
                const statsData = await statsResponse.json();
                setStats({
                    totalEntries: statsData.total_entries || 0,
                    wordCount: statsData.total_word_count || 0,
                    moodDistribution: statsData.mood_distribution || {},
                });
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (loading || !isAuthenticated) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="py-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                                        <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </div>
                                    <div className="ml-5">
                                        <h3 className="text-lg leading-6 font-medium text-gray-900">Welcome back, {user?.username || 'User'}!</h3>
                                        <p className="mt-1 text-sm text-gray-500">
                                            Member since {user?.dateJoined ? new Date(user.dateJoined).toLocaleDateString() : 'recently'}
                                        </p>
                                    </div>
                                </div>
                                <Link
                                    href="/journal"
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    Go to Journal
                                </Link>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {/* Stats Cards */}
                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="px-4 py-5 sm:p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                        </svg>
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">Journal Entries</dt>
                                            <dd className="flex items-baseline">
                                                <div className="text-2xl font-semibold text-gray-900">
                                                    {isLoading ? '...' : stats.totalEntries}
                                                </div>
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white overflow-hidden shadow rounded-lg">
                                <div className="px-4 py-5 sm:p-6">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                                            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </div>
                                        <div className="ml-5 w-0 flex-1">
                                            <dl>
                                                <dt className="text-sm font-medium text-gray-500 truncate">Words Written</dt>
                                                <dd className="flex items-baseline">
                                                    <div className="text-2xl font-semibold text-gray-900">
                                                        {isLoading ? '...' : stats.wordCount.toLocaleString()}
                                                    </div>
                                                </dd>
                                            </dl>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white overflow-hidden shadow rounded-lg">
                                <div className="px-4 py-5 sm:p-6">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                                            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                            </svg>
                                        </div>
                                        <div className="ml-5 w-0 flex-1">
                                            <dl>
                                                <dt className="text-sm font-medium text-gray-500 truncate">Achievements</dt>
                                                <dd className="flex items-baseline">
                                                    <div className="text-2xl font-semibold text-gray-900">0/10</div>
                                                </dd>
                                            </dl>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-medium text-gray-900">Recent Entries</h2>
                                    <Link
                                        href="/journal"
                                        className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                                    >
                                        View all entries →
                                    </Link>
                                </div>

                                {isLoading ? (
                                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className="bg-white overflow-hidden shadow rounded-lg p-4 animate-pulse">
                                                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                                <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                                                <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
                                                <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                                            </div>
                                        ))}
                                    </div>
                                ) : recentEntries.length > 0 ? (
                                    <div className="space-y-6">
                                        <div className="bg-white shadow overflow-hidden sm:rounded-md">
                                            <ul className="divide-y divide-gray-200">
                                                {recentEntries.slice(0, 5).map((entry) => (
                                                    <li key={entry.id}>
                                                        <Link href={`/journal/entry/${entry.id}`} className="block hover:bg-gray-50">
                                                            <div className="px-4 py-4 sm:px-6">
                                                                <div className="flex items-center justify-between">
                                                                    <p className="text-sm font-medium text-indigo-600 truncate">
                                                                        {entry.title || 'Untitled Entry'}
                                                                    </p>
                                                                    <div className="ml-2 flex-shrink-0 flex">
                                                                        <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                                            {entry.entry_type || 'text'}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <div className="mt-2 sm:flex sm:justify-between">
                                                                    <div className="sm:flex">
                                                                        <p className="flex items-center text-sm text-gray-500">
                                                                            {entry.mood && <span className="text-xl mr-2">{entry.mood}</span>}
                                                                            {entry.content.length > 100
                                                                                ? `${entry.content.substring(0, 100)}...`
                                                                                : entry.content}
                                                                        </p>
                                                                    </div>
                                                                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                                                        <p>
                                                                            {format(new Date(entry.created_at), 'MMM d, yyyy')}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </Link>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        <div className="bg-white overflow-hidden shadow rounded-lg">
                                            <div className="px-4 py-5 sm:p-6">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                                                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                                        </svg>
                                                    </div>
                                                    <div className="ml-5 w-0 flex-1">
                                                        <dl>
                                                            <dt className="text-sm font-medium text-gray-500 truncate">Achievements</dt>
                                                            <dd className="flex items-baseline">
                                                                <div className="text-2xl font-semibold text-gray-900">0/10</div>
                                                            </dd>
                                                        </dl>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-12 bg-white rounded-lg shadow">
                                        <svg
                                            className="mx-auto h-12 w-12 text-gray-400"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={1}
                                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                            />
                                        </svg>
                                        <h3 className="mt-2 text-sm font-medium text-gray-900">No entries yet</h3>
                                        <p className="mt-1 text-sm text-gray-500">
                                            Get started by creating your first journal entry.
                                        </p>
                                        <div className="mt-6">
                                            <Link
                                                href="/journal/new"
                                                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                            >
                                                <Plus className="-ml-1 mr-2 h-5 w-5" />
                                                New Entry
                                            </Link>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}