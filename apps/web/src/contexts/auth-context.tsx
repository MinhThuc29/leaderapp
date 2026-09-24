'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AuthUser, LoginInput, LoginResponse } from '@leaderos/shared-types';
import { apiClient } from '@/lib/api-client';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginInput) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await apiClient<{ user: AuthUser }>('/auth/me');
      setUser(res.data.user);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  const login = async (credentials: LoginInput): Promise<void> => {
    const res = await apiClient<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    setUser(res.data.user);
  };

  const logout = async (): Promise<void> => {
    try {
      await apiClient<{ message: string }>('/auth/logout', {
        method: 'POST',
      });
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
