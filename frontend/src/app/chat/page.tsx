'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { TherapistChat } from '@/components/chat/TherapistChat';

function ChatPage() {
    const { isAuthenticated, loading } = useAuth();
    const router = useRouter();

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, loading, router]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-slate-900 dark:to-slate-950">
                <div className="animate-pulse flex flex-col items-center space-y-4">
                    <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                        <div className="h-6 w-6 rounded-full bg-blue-200 dark:bg-blue-800 animate-ping"></div>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Loading your chat...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-slate-900 dark:to-slate-950">
            <TherapistChat />
        </div>
    );
}

export default function ProtectedChatPage() {
    return (
        <ProtectedRoute>
            <ChatPage />
        </ProtectedRoute>
    );
}
