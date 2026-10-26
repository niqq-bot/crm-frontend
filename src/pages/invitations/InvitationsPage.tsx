import React, { useState } from 'react';
import { invitationsApi } from '@/api/invitations';
import { useAuth } from '@/context/AuthContext';
import { getErrorMessage } from '@/api/client';
import { ValidateOrganizationInviteResponse } from '@/types/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { toast } from 'sonner';
import {
  Mail,
  Send,
  Copy,
  Check,
  Shield,
  CheckCircle2,
  Clock,
  ArrowRight,
  ExternalLink,
  Search,
} from 'lucide-react';

// Standard role presets with readable labels and standard UUID mappings
const AVAILABLE_ROLES = [
{
id: '22222222-2222-2222-2222-222222222222',
label: 'Organization Admin',
description: 'Organization administration',
},
{
id: '33333333-3333-3333-3333-333333333333',
label: 'Member',
description: 'Standard organization membership',
},
];


export const InvitationsPage: React.FC = () => {
  const { user, organizationName } = useAuth();

  // Create invite form state
  const [email, setEmail] = useState('');
  const [roleId, setRoleId] = useState(AVAILABLE_ROLES[1].id);
  const [isSending, setIsSending] = useState(false);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Token validation tool state
  const [testToken, setTestToken] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidateOrganizationInviteResponse | null>(null);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Please enter the invitee email address');
      return;
    }

    setIsSending(true);
    try {
      const res = await invitationsApi.createInvite({
        email: email.trim(),
        roleId,
      });

      setGeneratedToken(res.token);
      toast.success('Invitation token created successfully!');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSending(false);
    }
  };

  const handleCopyLink = () => {
    if (!generatedToken) return;
    const inviteUrl = `${window.location.origin}/invite/${encodeURIComponent(generatedToken)}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    toast.success('Invitation link copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleValidateToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testToken.trim()) return;

    setIsValidating(true);
    setValidationResult(null);
    try {
      const res = await invitationsApi.validateInvite(testToken.trim());
      setValidationResult(res);
      toast.success('Token verified successfully');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          Organization Invitations
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Invite colleagues and sales executives to join {organizationName || 'your organization'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Create Invitation Form */}
        <div className="rounded-xl border border-border bg-card p-5 sm:p-6 shadow-subtle space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border/60">
            <Mail className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Send Workspace Invite</h2>
          </div>

          <form onSubmit={handleSendInvite} className="space-y-4">
            <Input
              label="Invitee Work Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@company.com"
              required
              leftIcon={<Mail className="w-4 h-4" />}
            />

            {/* Role dropdown with human readable labels */}
            <Select
              label="Assigned Workspace Role"
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
            >
              {AVAILABLE_ROLES.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label} — {r.description}
                </option>
              ))}
            </Select>

            <Button
              type="submit"
              className="w-full h-9 text-xs gap-1.5"
              isLoading={isSending}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Generate Invitation Link</span>
            </Button>
          </form>

          {/* Generated Link Box */}
          {generatedToken && (
            <div className="p-4 rounded-xl bg-muted/40 border border-border/80 space-y-2.5 animate-in fade-in-50">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Invitation Generated
                </span>
                <span className="text-[11px] text-muted-foreground font-mono truncate max-w-[120px]">
                  {generatedToken.substring(0, 12)}...
                </span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/invite/${encodeURIComponent(generatedToken)}`}
                  className="flex-1 h-8 rounded-md border border-input bg-card px-2.5 text-xs text-muted-foreground font-mono focus:outline-none"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyLink}
                  className="h-8 px-2.5 text-xs gap-1"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </Button>
              </div>

              <p className="text-[11px] text-muted-foreground">
                Share this secure URL with the recipient to complete their registration.
              </p>
            </div>
          )}
        </div>

        {/* Validate Token Inspector */}
        <div className="rounded-xl border border-border bg-card p-5 sm:p-6 shadow-subtle space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border/60">
            <Search className="w-4 h-4 text-blue-500" />
            <h2 className="text-sm font-semibold text-foreground">Inspect Invitation Token</h2>
          </div>

          <form onSubmit={handleValidateToken} className="space-y-4">
            <Input
              label="Invitation Token"
              value={testToken}
              onChange={(e) => setTestToken(e.target.value)}
              placeholder="Paste token to inspect validity"
              required
            />

            <Button
              type="submit"
              variant="outline"
              className="w-full h-9 text-xs gap-1.5"
              isLoading={isValidating}
            >
              <span>Validate Token Status</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </form>

          {validationResult && (
            <div className="p-4 rounded-xl border border-border/80 bg-muted/30 space-y-2 text-xs animate-in fade-in-50">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">
                  {validationResult.organizationName}
                </span>
                <Badge
                  variant={validationResult.status === 'PENDING' ? 'success' : 'secondary'}
                >
                  {validationResult.status}
                </Badge>
              </div>

              <div className="text-muted-foreground space-y-1 pt-1">
                <p>Email: <span className="font-medium text-foreground">{validationResult.email}</span></p>
                <p>Role: <span className="font-medium text-foreground">{validationResult.role}</span></p>
                {validationResult.expiresAt && (
                  <p className="flex items-center gap-1 text-[11px]">
                    <Clock className="w-3 h-3" />
                    Expires: {new Date(validationResult.expiresAt).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="rounded-lg p-3 bg-muted/20 border border-border/40 text-[11px] text-muted-foreground leading-relaxed">
            <Shield className="w-3.5 h-3.5 text-primary inline mr-1" />
            Invitations strictly enforce the one-organization boundary. Once accepted, the new member is registered directly under this organization.
          </div>
        </div>
      </div>
    </div>
  );
};
