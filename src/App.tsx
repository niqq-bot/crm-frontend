import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';

// Auth Pages
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { InviteAcceptPage } from '@/pages/auth/InviteAcceptPage';

// Onboarding Page
import { OnboardingPage } from '@/pages/onboarding/OnboardingPage';

// App Pages
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { LeadsPage } from '@/pages/leads/LeadsPage';
import { ContactsPage } from '@/pages/contacts/ContactsPage';
import { DealsPage } from '@/pages/deals/DealsPage';
import { TasksPage } from '@/pages/tasks/TasksPage';
import { ActivityPage } from '@/pages/activity/ActivityPage';
import { OrganizationsPage } from '@/pages/organizations/OrganizationsPage';
import { UsersPage } from '@/pages/users/UsersPage';
import { InvitationsPage } from '@/pages/invitations/InvitationsPage';
import { ProfileSettingsPage } from '@/pages/settings/ProfileSettingsPage';
import { OrganizationSettingsPage } from '@/pages/settings/OrganizationSettingsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 30, // 30 seconds
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Authentication Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/invite/:token" element={<InviteAcceptPage />} />

              {/* Dedicated Organization Onboarding */}
              <Route
                path="/onboarding"
                element={
                  <ProtectedRoute>
                    <OnboardingPage />
                  </ProtectedRoute>
                }
              />

              {/* Protected Workspace CRM Routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="leads" element={<LeadsPage />} />
                <Route path="contacts" element={<ContactsPage />} />
                <Route path="deals" element={<DealsPage />} />
                <Route path="tasks" element={<TasksPage />} />
                <Route path="activity" element={<ActivityPage />} />

                {/* Manage */}
                <Route path="manage/organizations" element={<OrganizationsPage />} />
                <Route path="manage/users" element={<UsersPage />} />
                <Route path="manage/invitations" element={<InvitationsPage />} />

                {/* Settings */}
                <Route path="settings/profile" element={<ProfileSettingsPage />} />
                <Route path="settings/organization" element={<OrganizationSettingsPage />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </BrowserRouter>
          <Toaster richColors position="top-right" closeButton />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
