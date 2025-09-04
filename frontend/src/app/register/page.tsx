'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Sparkles } from 'lucide-react';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const { register, loading, error: authError } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Basic validation
    if (!username.trim()) {
      setError('Username is required');
      return;
    }
    
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    
    // Email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    if (!password) {
      setError('Password is required');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    // Password strength validation
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    
    if (!/(?=.*[a-z])(?=.*[0-9])/i.test(password)) {
      setError('Password must contain both letters and numbers');
      return;
    }
    
    try {
      const result = await register(username, email, password);
      if (result.success) {
        // Redirect to the intended URL or default to /chat
        const redirectTo = sessionStorage.getItem('redirectAfterLogin') || '/chat';
        sessionStorage.removeItem('redirectAfterLogin');
        router.push(redirectTo);
      } else {
        setError(result.error || 'Registration failed');
      }
    } catch (error) {
      const err = error as Error;
      setError(err.message || 'An error occurred during registration');
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
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-6 text-center">
          <motion.div 
            className="inline-flex items-center justify-center p-3 bg-white/10 rounded-full mb-4"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring', damping: 10, stiffness: 100 }}
          >
            <User className="h-8 w-8 text-white" />
          </motion.div>
          <h1 className="text-2xl font-bold text-white">Create Your Account</h1>
          <p className="text-blue-100 mt-1">Join Tranquil and start your journey</p>
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
              <label htmlFor="username" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white/50 dark:bg-slate-700/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="johndoe"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </motion.div>
            
            <motion.div 
              className="space-y-1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white/50 dark:bg-slate-700/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </motion.div>
            
            <motion.div 
              className="space-y-1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
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
                  autoComplete="new-password"
                  required
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white/50 dark:bg-slate-700/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Use at least 8 characters with a mix of letters and numbers</p>
            </motion.div>
            
            <motion.div 
              className="space-y-1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <label htmlFor="confirm-password" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="confirm-password"
                  name="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white/50 dark:bg-slate-700/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </motion.div>
            
            <motion.div
              className="pt-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <button
                type="submit"
                disabled={loading}
                className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-md hover:shadow-lg transition-all duration-200 ${
                  loading ? 'opacity-80 cursor-not-allowed' : ''
                }`}
              >
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  <User className={`h-5 w-5 text-indigo-300 group-hover:text-indigo-200 transition-colors ${
                    loading ? 'animate-pulse' : ''
                  }`} />
                </span>
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating account...
                  </span>
                ) : 'Create your account'}
              </button>
            </motion.div>
          </form>
          
          <motion.div 
            className="mt-6 relative"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
          >
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                Already have an account?
              </span>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-6"
          >
            <Link 
              href="/login" 
              className="w-full flex items-center justify-center px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
            >
              <Lock className="h-4 w-4 mr-2 text-blue-500" />
              Sign in to your account
            </Link>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
