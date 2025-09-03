"use client";

import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function Home() {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Welcome to Tranquil
          </h1>
          
          <p className="text-xl text-gray-600 mb-10">
            Your personal journaling companion for mindfulness and self-reflection.
            Capture your thoughts, track your mood, and find your inner peace.
          </p>

          {isAuthenticated ? (
            <div className="space-y-6">
              <p className="text-lg text-gray-700">
                Welcome back, {user?.email}!
              </p>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Go to Dashboard
              </Link>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Create Account
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
