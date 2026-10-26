import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '@/api/auth';
import { useAuth } from '@/context/AuthContext';
import { getErrorMessage } from '@/api/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from 'sonner';
import { ShieldCheck, ArrowRight, Lock, Mail } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const isSessionExpired = searchParams.get('session_expired') === 'true';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error('Please enter your email and password');
      return;
    }

    setIsLoading(true);
    try {
      const res = await authApi.login({ email: email.trim(), password });
      if (res.token) {
        await login(res.token, res.user);
        toast.success('Welcome back!');
        // Redirect will automatically be checked by ProtectedRoute (to /dashboard or /onboarding)
        navigate('/dashboard');
      } else {
        toast.error(res.message || 'Login failed. No token received.');
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-muted/20 selection:bg-primary/20">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-bold text-lg shadow-elevated mb-3">
            Q1
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Logic-Q1 CRM
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Enterprise pipeline management & sales intelligence
          </p>
        </div>

        {isSessionExpired && (
          <div className="mb-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300 text-xs text-center">
            Your session has expired. Please sign in again.
          </div>
        )}

        {/* Card */}
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-elevated">
          <div className="mb-6">
            <h2 className="text-base font-semibold text-foreground">Sign In</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Enter your credentials to access your organization workspace
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Work Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              required
              leftIcon={<Mail className="w-4 h-4" />}
            />

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-medium text-foreground/80 tracking-tight">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                leftIcon={<Lock className="w-4 h-4" />}
              />
            </div>

            <Button
              type="submit"
              className="w-full h-10 mt-2"
              isLoading={isLoading}
            >
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-border/60 text-center">
            <p className="text-xs text-muted-foreground">
              Don't have an account yet?{' '}
              <Link to="/register" className="font-semibold text-primary hover:underline">
                Create Account
              </Link>
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-1.5 mt-8 text-[11px] text-muted-foreground">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Encrypted with Spring Boot JWT Bearer authentication</span>
        </div>
      </div>
    </div>
  );
};
