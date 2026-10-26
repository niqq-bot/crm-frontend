import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User } from '@/types/api';
import { authApi } from '@/api/auth';

export interface LoginResult {
  user: User | null;
  hasOrganization: boolean;
  organizationId: string | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasOrganization: boolean;
  organizationId: string | null;
  organizationName: string | null;
  login: (token: string, initialUser?: any) => Promise<LoginResult>;
  logout: () => void;
  refreshUser: () => Promise<User | null>;
}

export function extractOrganizationId(userObj: any): string | null {
  if (!userObj || typeof userObj !== 'object') return null;

  // 1. user.organization.id
  if (userObj.organization && typeof userObj.organization === 'object' && userObj.organization.id) {
    const id = String(userObj.organization.id).trim();
    if (id && id !== 'null' && id !== 'undefined') return id;
  }

  // 2. user.organization as string ID
  if (typeof userObj.organization === 'string') {
    const id = userObj.organization.trim();
    if (id && id !== 'null' && id !== 'undefined') return id;
  }

  // 3. user.orgId (from login response DTO)
  if (userObj.orgId) {
    const id = String(userObj.orgId).trim();
    if (id && id !== 'null' && id !== 'undefined') return id;
  }

  // 4. user.organizationId (from user response DTO)
  if (userObj.organizationId) {
    const id = String(userObj.organizationId).trim();
    if (id && id !== 'null' && id !== 'undefined') return id;
  }

  return null;
}

export function extractOrganizationName(userObj: any): string | null {
  if (!userObj || typeof userObj !== 'object') return null;
  if (userObj.organization && typeof userObj.organization === 'object' && userObj.organization.name) {
    return String(userObj.organization.name).trim();
  }
  if (userObj.organizationName) {
    return String(userObj.organizationName).trim();
  }
  return null;
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

  const login = async (newToken: string, initialUser?: any): Promise<LoginResult> => {
    localStorage.setItem('crm_token', newToken);
    setToken(newToken);

    let resolvedUser: User | null = null;
    if (initialUser) {
      setUser(initialUser);
      localStorage.setItem('crm_user', JSON.stringify(initialUser));
      resolvedUser = initialUser;
    }

    try {
      const me = await fetchCurrentUser();
      if (me) {
        resolvedUser = me;
      }
    } catch (e) {
      console.error('Error fetching /auth/me on login:', e);
    }

    const orgId = extractOrganizationId(resolvedUser) || (initialUser ? extractOrganizationId(initialUser) : null);
    const hasOrg = Boolean(orgId);

    return {
      user: resolvedUser,
      hasOrganization: hasOrg,
      organizationId: orgId,
    };
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
  const orgId = extractOrganizationId(user);
  const orgName = extractOrganizationName(user);
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
