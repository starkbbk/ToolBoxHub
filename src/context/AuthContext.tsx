"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/api';
import { toast } from 'sonner';
import axios from 'axios';

interface User {
  id: string;
  name: string;
  email: string;
  profile_picture?: string;
  subscription_plan: string;
  subscription_status: string;
  usage: any;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: any) => Promise<void>;
  signup: (userData: any) => Promise<void>;
  logout: () => void;
  googleLogin: (token: string) => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      const response = await auth.me();
      if (response && (response.status === 'success' || response.success)) {
        setUser(response.data);
      } else {
        console.warn('Auth validation failed, clearing token');
        localStorage.removeItem('token');
        setUser(null);
      }
    } catch (error) {
      console.error('Auth verification error:', error);
      // Only clear token if it's a 401/403 or specific auth error
      // Don't clear on network errors to avoid aggressive logout
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        localStorage.removeItem('token');
        setUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: any) => {
    setIsLoading(true);
    try {
      const response = await auth.login(credentials);
      if (response.status === 'success' || response.success) {
        localStorage.setItem('token', response.data.access_token);
        await checkAuth();
        toast.success('Successfully logged in!');
        router.push('/');
      }
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (userData: any) => {
    setIsLoading(true);
    try {
      const response = await auth.signup(userData);
      if (response.status === 'success' || response.success) {
        toast.success('Account created! Please login.');
        router.push('/login');
      }
    } catch (error: any) {
      toast.error(error.message || 'Signup failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const googleLogin = async (token: string) => {
    setIsLoading(true);
    try {
      const response = await auth.google(token);
      console.log('Google Auth API Response:', response);
      if (response.status === 'success' || response.success) {
        localStorage.setItem('token', response.data.access_token);
        await checkAuth();
        console.log('User state set, redirecting...');
        toast.success('Logged in with Google!');
        router.push('/');
      }
    } catch (error: any) {
      toast.error(error.message || 'Google login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    toast.info('Logged out');
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, signup, logout, googleLogin, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
