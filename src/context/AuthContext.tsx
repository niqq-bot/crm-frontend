import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User } from '@/types/api';
import { authApi } from '@/api/auth';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasOrganization: boolean;
  organizationId: string | null;
  organizationName: string | null;
  login: (token: string, initialUser?: any) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('crm_token'));
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('crm_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCurrentUser = useCallback(async (): Promise<User | null> => {
    try {
      const me = await authApi.getMe();
      setUser(me);
      localStorage.setItem('crm_user', JSON.stringify(me));
      return me;
    } catch (err) {
      console.error('Failed to load authenticated user profile:', err);
      return null;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const initAuth = async () => {
      const storedToken = localStorage.getItem('crm_token');
      if (storedToken) {
        setToken(storedToken);
        try {
          await fetchCurrentUser();
        } catch (e) {
          console.error(e);
        }
      }
      if (isMounted) {
        setIsLoading(false);
      }
    };

    initAuth();
    return () => {
      isMounted = false;
    };
  }, [fetchCurrentUser]);

  const login = async (newToken: string, initialUser?: any) => {
    localStorage.setItem('crm_token', newToken);
    setToken(newToken);
    if (initialUser) {
      setUser(initialUser);
      localStorage.setItem('crm_user', JSON.stringify(initialUser));
    }
    await fetchCurrentUser();
  };

  const logout = () => {
    localStorage.removeItem('crm_token');
    localStorage.removeItem('crm_user');
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    return await fetchCurrentUser();
  };

  // Determine organization membership strictly
  const orgId =
    user?.organization?.id ||
    (user as any)?.orgId ||
    (user as any)?.organizationId ||
    null;

  const orgName = user?.organization?.name || null;
  const hasOrganization = Boolean(orgId);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: Boolean(token),
        hasOrganization,
        organizationId: orgId,
        organizationName: orgName,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
