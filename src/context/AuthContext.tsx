import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User } from '@/types/api';
import { authApi } from '@/api/auth';
import { usersApi } from '@/api/users';
import { organizationsApi } from '@/api/organizations';

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
  setOrganizationId: (id: string, name?: string) => void;
}

function unwrapResponse(data: any): any {
  if (!data) return null;
  if (data.data && typeof data.data === 'object' && !Array.isArray(data.data)) {
    return unwrapResponse(data.data);
  }
  if (data.user && typeof data.user === 'object' && !Array.isArray(data.user)) {
    return unwrapResponse(data.user);
  }
  if (data.result && typeof data.result === 'object' && !Array.isArray(data.result)) {
    return unwrapResponse(data.result);
  }
  return data;
}

export function extractOrganizationId(userObj: any): string | null {
  if (!userObj || typeof userObj !== 'object') {
    const cached = localStorage.getItem('crm_org_id');
    return cached && cached !== 'null' && cached !== 'undefined' && cached.trim() !== ''
      ? cached.trim()
      : null;
  }

  const target = unwrapResponse(userObj) || userObj;

  // 1. Direct orgId (from login response DTO / user DTO)
  if (target.orgId && String(target.orgId).trim() !== '' && String(target.orgId) !== 'null' && String(target.orgId) !== 'undefined') {
    return String(target.orgId).trim();
  }

  // 2. Direct organizationId (from UserResponse DTO)
  if (target.organizationId && String(target.organizationId).trim() !== '' && String(target.organizationId) !== 'null' && String(target.organizationId) !== 'undefined') {
    return String(target.organizationId).trim();
  }

  // 3. Organization entity object or string
  if (target.organization) {
    if (typeof target.organization === 'object') {
      const id = target.organization.id || target.organization.orgId || target.organization.organizationId || target.organization._id;
      if (id && String(id).trim() !== '' && String(id) !== 'null' && String(id) !== 'undefined') {
        return String(id).trim();
      }
      if (target.organization.name && String(target.organization.name).trim() !== '') {
        return String(target.organization.id || target.organization.name).trim();
      }
    } else if (typeof target.organization === 'string') {
      const id = target.organization.trim();
      if (id && id !== 'null' && id !== 'undefined' && id !== '{}' && id !== '[]') {
        return id;
      }
    }
  }

  // 4. target.org
  if (target.org) {
    if (typeof target.org === 'object') {
      const id = target.org.id || target.org.orgId || target.org.organizationId;
      if (id && String(id).trim() !== '' && String(id) !== 'null' && String(id) !== 'undefined') {
        return String(id).trim();
      }
    } else if (typeof target.org === 'string') {
      const id = target.org.trim();
      if (id && id !== 'null' && id !== 'undefined') return id;
    }
  }

  // 5. snake_case fields
  if (target.org_id && String(target.org_id).trim() !== '' && String(target.org_id) !== 'null') {
    return String(target.org_id).trim();
  }
  if (target.organization_id && String(target.organization_id).trim() !== '' && String(target.organization_id) !== 'null') {
    return String(target.organization_id).trim();
  }

  // 6. Role's organization
  if (target.role && typeof target.role === 'object') {
    const roleOrg = target.role.organization;
    if (roleOrg) {
      if (typeof roleOrg === 'object' && roleOrg.id) {
        return String(roleOrg.id).trim();
      } else if (typeof roleOrg === 'string' && roleOrg !== 'null') {
        return String(roleOrg).trim();
      }
    }
  }

  // 7. Check if onBoarded is true
  if (target.onBoarded === true || target.onboarded === true) {
    const cachedOrg = localStorage.getItem('crm_org_id');
    return cachedOrg || target.id || 'onboarded';
  }

  // 8. Stored crm_org_id in localStorage
  const storedOrg = localStorage.getItem('crm_org_id');
  if (storedOrg && storedOrg !== 'null' && storedOrg !== 'undefined' && storedOrg.trim() !== '') {
    return storedOrg.trim();
  }

  return null;
}

export function extractOrganizationName(userObj: any): string | null {
  if (!userObj || typeof userObj !== 'object') {
    return localStorage.getItem('crm_org_name') || null;
  }
  const target = unwrapResponse(userObj) || userObj;
  if (target.organization && typeof target.organization === 'object' && target.organization.name) {
    return String(target.organization.name).trim();
  }
  if (target.organizationName) {
    return String(target.organizationName).trim();
  }
  if (target.orgName) {
    return String(target.orgName).trim();
  }
  return localStorage.getItem('crm_org_name') || null;
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
      const meRaw = await authApi.getMe();
      const me = unwrapResponse(meRaw) || meRaw;

      // Preserve previously cached user attributes (e.g. orgId from login)
      const cached = localStorage.getItem('crm_user');
      const cachedUser = cached ? JSON.parse(cached) : {};

      let resolved: any = {
        ...cachedUser,
        ...me,
        orgId: me?.orgId || cachedUser?.orgId || me?.organizationId || cachedUser?.organizationId || localStorage.getItem('crm_org_id'),
      };

      let orgId = extractOrganizationId(resolved);

      // If orgId is not yet resolved, query user details by ID
      const userId = resolved.id || cachedUser.id;
      if (!orgId && userId) {
        try {
          const userDetails = await usersApi.getUser(userId);
          if (userDetails) {
            resolved = { ...resolved, ...userDetails };
            orgId = extractOrganizationId(resolved);
          }
        } catch (e) {
          console.warn('Could not query user details by ID:', e);
        }
      }

      // If still not resolved, query organizations list to match adminId or member
      if (!orgId && userId) {
        try {
          const allOrgs = await organizationsApi.getAll();
          if (Array.isArray(allOrgs) && allOrgs.length > 0) {
            const foundOrg = allOrgs.find((org) => {
              const adminId = org.adminId?.id || (typeof org.adminId === 'string' ? org.adminId : null);
              if (adminId === userId) return true;
              if (Array.isArray(org.members)) {
                return org.members.some((m) => m.id === userId || (typeof m === 'string' && m === userId));
              }
              return false;
            });

            if (foundOrg) {
              resolved.organization = foundOrg;
              resolved.orgId = foundOrg.id;
              orgId = foundOrg.id;
              localStorage.setItem('crm_org_name', foundOrg.name);
            } else if (allOrgs.length === 1 && (resolved.onBoarded || allOrgs[0].id)) {
              resolved.organization = allOrgs[0];
              resolved.orgId = allOrgs[0].id;
              orgId = allOrgs[0].id;
              localStorage.setItem('crm_org_name', allOrgs[0].name);
            }
          }
        } catch (e) {
          console.warn('Could not query organizations:', e);
        }
      }

      setUser(resolved);
      localStorage.setItem('crm_user', JSON.stringify(resolved));
      if (orgId) {
        localStorage.setItem('crm_org_id', orgId);
      }

      return resolved;
    } catch (err) {
      console.error('Failed to load authenticated user profile:', err);
      const cached = localStorage.getItem('crm_user');
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch {
          return null;
        }
      }
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
    // Clean token string (remove redundant Bearer if present)
    const cleanToken = newToken.startsWith('Bearer ') ? newToken.substring(7).trim() : newToken.trim();
    localStorage.setItem('crm_token', cleanToken);
    setToken(cleanToken);

    let resolvedUser: any = null;
    if (initialUser) {
      const unwrappedInitial = unwrapResponse(initialUser) || initialUser;
      resolvedUser = unwrappedInitial;
      setUser(unwrappedInitial);
      localStorage.setItem('crm_user', JSON.stringify(unwrappedInitial));
      const initialOrgId = extractOrganizationId(unwrappedInitial);
      if (initialOrgId) {
        localStorage.setItem('crm_org_id', initialOrgId);
      }
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

    if (orgId) {
      localStorage.setItem('crm_org_id', orgId);
    }

    return {
      user: resolvedUser,
      hasOrganization: hasOrg,
      organizationId: orgId,
    };
  };

  const logout = () => {
    localStorage.removeItem('crm_token');
    localStorage.removeItem('crm_user');
    localStorage.removeItem('crm_org_id');
    localStorage.removeItem('crm_org_name');
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    return await fetchCurrentUser();
  };

  const setOrganizationId = (id: string, name?: string) => {
    const cleanId = id.trim();
    localStorage.setItem('crm_org_id', cleanId);
    if (name) {
      localStorage.setItem('crm_org_name', name.trim());
    }
    setUser((prev: any) => {
      const updated = {
        ...(prev || {}),
        orgId: cleanId,
        organizationId: cleanId,
        organization: {
          id: cleanId,
          name: name || prev?.organization?.name || localStorage.getItem('crm_org_name') || 'Organization Workspace',
        },
      };
      localStorage.setItem('crm_user', JSON.stringify(updated));
      return updated;
    });
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
        setOrganizationId,
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
