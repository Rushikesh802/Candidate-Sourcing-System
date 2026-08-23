'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { fetchApi } from '@/lib/api';

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'candidate';
  first_name: string;
  last_name: string;
  mobile: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string, nextUrl?: string) => Promise<{ success: boolean; error?: string }>;
  register: (
    data: { first_name: string; last_name: string; email: string; mobile: string; password: string },
    nextUrl?: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  const refreshUser = async () => {
    try {
      const res = await fetchApi<User>('/api/v1/auth/me');
      if (res.data) {
        setUser(res.data);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string, nextUrl?: string) => {
    const res = await fetchApi<{ access_token: string; user: User }>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (res.error) {
      return { success: false, error: res.error.message || 'Login failed' };
    }

    if (res.data?.user) {
      setUser(res.data.user);
      if (nextUrl) {
        router.push(nextUrl);
      } else if (res.data.user.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/jobs');
      }
      return { success: true };
    }

    return { success: false, error: 'Unexpected error during login' };
  };

  const register = async (
    data: { first_name: string; last_name: string; email: string; mobile: string; password: string },
    nextUrl?: string
  ) => {
    const res = await fetchApi<{ access_token: string; user: User }>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (res.error) {
      return { success: false, error: res.error.message || 'Registration failed' };
    }

    if (res.data?.user) {
      setUser(res.data.user);
      if (nextUrl) {
        router.push(nextUrl);
      } else {
        router.push('/jobs');
      }
      return { success: true };
    }

    return { success: false, error: 'Unexpected error during registration' };
  };

  const logout = async () => {
    await fetchApi('/api/v1/auth/logout', { method: 'POST' });
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, refreshUser }}>
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
