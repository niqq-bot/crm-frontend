import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '@/api/auth';
import { useAuth } from '@/context/AuthContext';
import { getErrorMessage } from '@/api/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from 'sonner';
import { ArrowRight, Lock, Mail, User } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      const res = await authApi.register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
      });

      if (res.token) {
        await login(res.token, res.user);
        toast.success('Account created successfully!');
        navigate('/onboarding');
      } else {
        toast.success('Registration successful! Please sign in.');
        navigate('/login');
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-muted/20">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-bold text-lg shadow-elevated mb-3">
            Q1
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Get Started with Logic-Q1
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Create your account to launch your sales workspace
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-elevated">
          <div className="mb-6">
            <h2 className="text-base font-semibold text-foreground">Sign Up</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Enter your details to create an account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Rahul"
                required
                leftIcon={<User className="w-4 h-4" />}
              />
              <Input
                label="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Sharma"
                required
              />
            </div>

            <Input
              label="Work Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="rahul@company.com"
              required
              leftIcon={<Mail className="w-4 h-4" />}
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
              leftIcon={<Lock className="w-4 h-4" />}
            />

            <Button
              type="submit"
              className="w-full h-10 mt-2"
              isLoading={isLoading}
            >
              <span>Create Account</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-border/60 text-center">
            <p className="text-xs text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-primary hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
