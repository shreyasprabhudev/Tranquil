'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Lock, Mail, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const { login, loading: authLoading, error: authError } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check for registration success
  useEffect(() => {
    if (searchParams.get('registered') === 'true') {
      setSuccessMessage('Registration successful! Please log in with your credentials.');
      // Clear the query parameter without refreshing
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!identifier.trim()) {
      setError('Please enter your username or email');
      return;
    }
    
    if (!password) {
      setError('Please enter your password');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const result = await login(identifier, password);
      if (result.success) {
        // Redirect to the intended URL or default to /chat
        const redirectTo = sessionStorage.getItem('redirectAfterLogin') || '/chat';
        sessionStorage.removeItem('redirectAfterLogin');
        router.push(redirectTo);
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (error) {
      const err = error as Error;
      setError(err.message || 'An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-900 p-4 sm:p-6">
      <motion.div 
        className="w-full max-w-md bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg rounded-2xl shadow-xl overflow-hidden border border-slate-200/70 dark:border-slate-700/30"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Decorative header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-center">
          <motion.div 
            className="inline-flex items-center justify-center p-3 bg-white/10 rounded-full mb-4"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring', damping: 10, stiffness: 100 }}
          >
            <Lock className="h-8 w-8 text-white" />
          </motion.div>
          <h1 className="text-2xl font-bold text-white">Welcome Back</h1>
          <p className="text-blue-100 mt-1">Sign in to continue to Tranquil</p>
          
          {successMessage && (
            <motion.div 
              className="mt-4 p-3 bg-white/10 text-white rounded-lg text-sm"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {successMessage}
            </motion.div>
          )}
        </div>
        
        <div className="p-6 sm:p-8">
          {(authError || error) && (
            <motion.div 
              className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 text-red-700 dark:text-red-200 rounded-lg"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              role="alert"
            >
              <p className="font-semibold">Something went wrong</p>
              <p className="text-sm">{authError || error}</p>
            </motion.div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <motion.div 
              className="space-y-1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <label htmlFor="identifier" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Username or Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="identifier"
                  name="identifier"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white/50 dark:bg-slate-700/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="username@example.com"
                  autoComplete="username"
                />
              </div>
            </motion.div>
            
            <motion.div 
              className="space-y-1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white/50 dark:bg-slate-700/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>
              <div className="flex items-center justify-end mt-1">
                <Link 
                  href="/forgot-password" 
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <button
                type="submit"
                disabled={isLoading || authLoading}
                className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-md hover:shadow-lg transition-all duration-200 ${
                  (isLoading || authLoading) ? 'opacity-80 cursor-not-allowed' : ''
                }`}
              >
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  <Lock className={`h-5 w-5 text-blue-300 group-hover:text-blue-200 transition-colors ${
                    (isLoading || authLoading) ? 'animate-pulse' : ''
                  }`} />
                </span>
                {isLoading || authLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </span>
                ) : 'Sign in to your account'}
              </button>
            </motion.div>
          </form>
          
          <motion.div 
            className="mt-6 relative"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                New to Tranquil?
              </span>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="mt-6"
          >
            <Link 
              href="/register" 
              className="w-full flex items-center justify-center px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
            >
              <Sparkles className="h-4 w-4 mr-2 text-blue-500" />
              Create your account
            </Link>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}