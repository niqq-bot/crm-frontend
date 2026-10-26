import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '@/api/auth';
import { getErrorMessage } from '@/api/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, CheckCircle2, KeyRound, Mail } from 'lucide-react';

type Step = 'EMAIL' | 'OTP' | 'PASSWORD' | 'SUCCESS';

export const ForgotPasswordPage: React.FC = () => {
  const [step, setStep] = useState<Step>('EMAIL');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Step 1: Send verification mail
  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Please enter your email address');
      return;
    }
    setIsLoading(true);
    try {
      await authApi.verifyMail(email.trim());
      toast.success('Verification code sent to your email');
      setStep('OTP');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpNum = parseInt(otp.trim(), 10);
    if (isNaN(otpNum)) {
      toast.error('Please enter a valid numeric OTP code');
      return;
    }
    setIsLoading(true);
    try {
      await authApi.verifyOtp(email.trim(), otpNum);
      toast.success('OTP verified successfully!');
      setStep('PASSWORD');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (password !== repeatPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setIsLoading(true);
    try {
      await authApi.changePassword(email.trim(), { password, repeatPassword });
      toast.success('Password updated successfully!');
      setStep('SUCCESS');
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
            Password Recovery
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Reset your Logic-Q1 account access
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-elevated">
          {step === 'EMAIL' && (
            <form onSubmit={handleSendEmail} className="space-y-4">
              <div className="mb-4">
                <h2 className="text-base font-semibold text-foreground">Find Account</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Enter your registered email address to receive an OTP code.
                </p>
              </div>

              <Input
                label="Registered Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                required
                leftIcon={<Mail className="w-4 h-4" />}
              />

              <Button
                type="submit"
                className="w-full h-10 mt-2"
                isLoading={isLoading}
              >
                <span>Send Verification Code</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </form>
          )}

          {step === 'OTP' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="mb-4">
                <h2 className="text-base font-semibold text-foreground">Enter OTP Code</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Enter the numeric verification code sent to{' '}
                  <span className="font-semibold text-foreground">{email}</span>
                </p>
              </div>

              <Input
                label="One-Time Password (OTP)"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                required
                leftIcon={<KeyRound className="w-4 h-4" />}
              />

              <Button
                type="submit"
                className="w-full h-10 mt-2"
                isLoading={isLoading}
              >
                <span>Verify OTP</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>

              <button
                type="button"
                onClick={() => setStep('EMAIL')}
                className="w-full text-center text-xs text-muted-foreground hover:text-foreground mt-2"
              >
                Change email address
              </button>
            </form>
          )}

          {step === 'PASSWORD' && (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="mb-4">
                <h2 className="text-base font-semibold text-foreground">Set New Password</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Create a secure new password for your account.
                </p>
              </div>

              <Input
                label="New Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />

              <Input
                label="Confirm Password"
                type="password"
                value={repeatPassword}
                onChange={(e) => setRepeatPassword(e.target.value)}
                placeholder="••••••••"
                required
              />

              <Button
                type="submit"
                className="w-full h-10 mt-2"
                isLoading={isLoading}
              >
                <span>Update Password</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </form>
          )}

          {step === 'SUCCESS' && (
            <div className="text-center py-4 space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="text-base font-semibold text-foreground">Password Reset Complete</h2>
              <p className="text-xs text-muted-foreground">
                Your password has been reset successfully. You can now log in with your new credentials.
              </p>
              <Button
                type="button"
                className="w-full h-10 mt-2"
                onClick={() => navigate('/login')}
              >
                <span>Go to Sign In</span>
              </Button>
            </div>
          )}

          <div className="mt-6 pt-5 border-t border-border/60 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
