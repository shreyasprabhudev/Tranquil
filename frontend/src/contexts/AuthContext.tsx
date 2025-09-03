'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  username: string;
  isStaff: boolean;
  dateJoined: string;
}

interface AuthContextType {
  user: User | null;
  login: (identifier: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, username: string, password: string, password2: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
    try {
      const tokensStr = localStorage.getItem('authTokens');
      if (!tokensStr) {
        setLoading(false);
        return;
      }
      
      const tokens = JSON.parse(tokensStr);
      
      // Verify token is still valid
      const userResponse = await fetch('http://localhost:8000/api/user/me/', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokens.access}`,
          'Content-Type': 'application/json',
        },
      });

      if (userResponse.ok) {
        const userData = await userResponse.json();
        setUser({
          id: userData.id.toString(),
          email: userData.email,
          username: userData.username,
          isStaff: userData.is_staff,
          dateJoined: userData.date_joined,
        });
        setIsAuthenticated(true);
      } else {
        // Token is invalid, clear it
        localStorage.removeItem('authTokens');
      }
    } catch (err) {
      console.error('Auth check failed:', err);
      localStorage.removeItem('authTokens');
    } finally {
      setLoading(false);
    }
    };

    checkAuth();
  }, []);

  const clearError = () => setError(null);

  const login = async (usernameOrEmail: string, password: string) => {
    console.log('[Auth] Login attempt started');
    setError(null);
    setLoading(true);
    
    try {
      // Prepare login data - try with username_or_email first for backward compatibility
      const loginData = {
        username_or_email: usernameOrEmail,
        password: password
      };
      
      console.log('[Auth] Login data:', loginData);

      // Get auth tokens
      console.log('[Auth] Sending login request to /api/token/');
      const tokenResponse = await fetch('http://localhost:8000/api/token/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });

      const responseData = await tokenResponse.json();
      console.log('[Auth] Login response:', { status: tokenResponse.status, data: responseData });
      
      if (!tokenResponse.ok) {
        // Handle error response
        const errorMessage = responseData.detail || 
                           (responseData.non_field_errors ? responseData.non_field_errors[0] : null) ||
                           'Invalid username/email or password';
        throw new Error(errorMessage);
      }

      // Handle successful login
      const { access, refresh, user: userData } = responseData;
      
      if (!access || !refresh || !userData) {
        throw new Error('Invalid response from server');
      }

      // Store tokens
      localStorage.setItem('authTokens', JSON.stringify({ access, refresh }));

      // Set user data
      const user = {
        id: userData.id.toString(),
        email: userData.email,
        username: userData.username,
        isStaff: userData.is_staff || false,
        dateJoined: userData.date_joined || new Date().toISOString(),
      };
      
      setUser(user);
      setIsAuthenticated(true);
      router.push('/dashboard');
      return { success: true };
    } catch (err) {
      const error = err as Error;
      console.error('Login error:', error);
      setError(error.message || 'An unexpected error occurred during login');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, username: string, password: string, password2: string) => {
    console.log('[Auth] Registration started for:', { email, username });
    setError(null);
    setLoading(true);
    
    try {
      // Basic client-side validation
      if (!email || !username || !password || !password2) {
        const missingFields = [
          !email ? 'email' : '',
          !username ? 'username' : '',
          !password ? 'password' : '',
          !password2 ? 'password confirmation' : ''
        ].filter(Boolean);
        const errorMsg = `Missing required fields: ${missingFields.join(', ')}`;
        console.error('[Auth] Validation error:', errorMsg);
        throw new Error(errorMsg);
      }
      
      if (password !== password2) {
        console.error('[Auth] Passwords do not match');
        throw new Error('Passwords do not match');
      }
      
      if (password.length < 8) {
        console.error('[Auth] Password too short');
        throw new Error('Password must be at least 8 characters');
      }

      console.log('[Auth] Sending registration request...');
      const response = await fetch('http://localhost:8000/api/register/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: email.trim(),
          username: username.trim(),
          password,
          password2
        }),
      });

      console.log(`[Auth] Registration response status: ${response.status}`);
      
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
          // Handle different error response formats
          if (errorData.detail) {
            // Handle simple error message
            throw new Error(errorData.detail);
          } else if (errorData.errors) {
            // Handle validation errors object
            const firstErrorKey = Object.keys(errorData.errors)[0];
            const firstError = errorData.errors[firstErrorKey];
            throw new Error(Array.isArray(firstError) ? firstError[0] : firstError);
          } else {
            // Handle field-specific errors
            const errorFields = ['email', 'username', 'password', 'non_field_errors'];
            const errorMessage = errorFields
              .filter(field => errorData[field])
              .map(field => {
                const error = errorData[field];
                return Array.isArray(error) ? error[0] : error;
              })[0] || 'Registration failed';
            
            throw new Error(errorMessage);
          }
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
          throw new Error('Registration failed. Please try again.');
        }
      }

      // On successful registration, redirect to login page
      // instead of trying to auto-login
      router.push('/login?registered=true');
      return { success: true };
    } catch (err) {
      const error = err as Error;
      console.error('Registration error:', error);
      setError(error.message || 'An unexpected error occurred during registration');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('authTokens');
    setUser(null);
    setIsAuthenticated(false);
    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        isAuthenticated,
        loading,
        error,
        clearError
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};