'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      // Store the intended URL before redirecting
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/register') {
        sessionStorage.setItem('redirectAfterLogin', currentPath);
      }
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 text-blue-500 animate-spin mx-auto" />
          <p className="text-lg font-medium text-slate-700 dark:text-slate-300">Loading your session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will be redirected by the useEffect
  }

  return <>{children}</>;
}
