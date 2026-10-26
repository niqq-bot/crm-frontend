import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { invitationsApi } from '@/api/invitations';
import { authApi } from '@/api/auth';
import { ValidateOrganizationInviteResponse } from '@/types/api';
import { getErrorMessage } from '@/api/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { toast } from 'sonner';
import { Building, Mail, Shield, CheckCircle, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';

export const InviteAcceptPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [inviteData, setInviteData] = useState<ValidateOrganizationInviteResponse | null>(null);
  const [isValidating, setIsValidating] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setValidationError('No invitation token provided');
      setIsValidating(false);
      return;
    }

    const validate = async () => {
      try {
        const data = await invitationsApi.validateInvite(token);
        setInviteData(data);
      } catch (err) {
        setValidationError(getErrorMessage(err));
      } finally {
        setIsValidating(false);
      }
    };

    validate();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (!firstName.trim() || !lastName.trim() || !password) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsSubmitting(true);
    try {
      await authApi.registerInvite({
        token,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        password,
      });

      toast.success('Invitation accepted successfully! Please sign in with your credentials.');
      navigate('/login');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
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
            Join Workspace
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Accept your invitation to Logic-Q1 CRM
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-elevated">
          {isValidating ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">Validating your invitation...</p>
            </div>
          ) : validationError ? (
            <div className="py-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h2 className="text-base font-semibold text-foreground">Invalid Invitation</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {validationError}
              </p>
              <Link to="/login">
                <Button variant="outline" size="sm" className="mt-2">
                  Return to Sign In
                </Button>
              </Link>
            </div>
          ) : (
            <div>
              {/* Invite summary header */}
              <div className="mb-6 rounded-xl border border-border bg-muted/30 p-4 space-y-2.5">
                <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
                  <Building className="w-4 h-4 text-primary" />
                  <span>{inviteData?.organizationName || 'Organization'}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" />
                    {inviteData?.email}
                  </span>
                  <Badge variant="secondary" className="flex items-center gap-1 text-[11px]">
                    <Shield className="w-3 h-3 text-primary" />
                    {inviteData?.role || 'Member'}
                  </Badge>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="First Name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Rahul"
                    required
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
                  label="Create Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                />

                <Button
                  type="submit"
                  className="w-full h-10 mt-2"
                  isLoading={isSubmitting}
                >
                  <CheckCircle className="w-4 h-4 mr-1.5" />
                  <span>Accept Invitation & Join</span>
                </Button>
              </form>
            </div>
          )}

          <div className="mt-6 pt-5 border-t border-border/60 text-center">
            <p className="text-xs text-muted-foreground">
              Already have an active account?{' '}
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
