'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

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
      if (result?.success) {
        // The AuthContext will handle the redirect
        return;
      } else {
        setError(result?.error || 'Login failed. Please check your credentials.');
      }
    } catch (error) {
      console.error('Login error:', error);
      const err = error as Error;
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          {successMessage && (
            <div className="mt-4 p-4 bg-green-50 text-green-700 rounded-md">
              {successMessage}
            </div>
          )}
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {(authError || error) && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded" role="alert">
              <p className="font-bold">Error</p>
              <p>{authError || error}</p>
            </div>
          )}
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="identifier" className="block text-sm font-medium text-gray-700 mb-1">
                Username or Email
              </label>
              <input
                id="identifier"
                name="identifier"
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Enter your username or email"
                autoComplete="username"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading || authLoading || !identifier.trim() || !password}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {isLoading || authLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                </div>
              ) : (
                'Sign in'
              )}
            </button>
            <div className="mt-4 text-center text-sm">
              <span className="text-gray-600">Don't have an account? </span>
              <Link href="/register" className="text-indigo-600 hover:underline">
                Register here
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}