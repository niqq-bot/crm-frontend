import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, hasOrganization, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground font-medium animate-pulse">
            Connecting to Logic-Q1 workspace...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If user is authenticated but not in any organization, redirect to /onboarding
  if (!hasOrganization && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  // If user already belongs to an organization and is trying to access /onboarding, redirect to /dashboard
  if (hasOrganization && location.pathname === '/onboarding') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
