import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, extractOrganizationId } from '@/context/AuthContext';
import { organizationsApi } from '@/api/organizations';
import { getErrorMessage } from '@/api/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { toast } from 'sonner';
import { Building2, Globe, ArrowRight, ShieldCheck, Mail, LogOut } from 'lucide-react';

export const OnboardingPage: React.FC = () => {
  const { user, refreshUser, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'create' | 'invite'>('create');

  // Create organization state
  const [orgName, setOrgName] = useState('');
  const [category, setCategory] = useState('Technology');
  const [country, setCountry] = useState('United States');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Invite token state
  const [inviteToken, setInviteToken] = useState('');

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim()) {
      toast.error('Please enter an organization name');
      return;
    }

    setIsSubmitting(true);
    try {
      await organizationsApi.createOrganization({
        name: orgName.trim(),
        category,
        country,
        websiteUrl: websiteUrl.trim() || undefined,
      });

      // Refresh authenticated user to verify organization membership is updated
      const refreshedUser = await refreshUser();

      const newOrgId = extractOrganizationId(refreshedUser);

      if (newOrgId) {
        toast.success(`Welcome to ${orgName.trim()}! Workspace initialized.`);
        navigate('/dashboard');
      } else {
        toast.success('Organization created. Loading workspace...');
        // Small delay if backend membership is asynchronously linked
        setTimeout(async () => {
          await refreshUser();
          navigate('/dashboard');
        }, 1000);
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApplyInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteToken.trim()) {
      toast.error('Please enter your invitation token');
      return;
    }
    navigate(`/invite/${encodeURIComponent(inviteToken.trim())}`);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-muted/20">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-bold text-lg shadow-elevated mb-3">
            Q1
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Welcome, {user?.firstName || 'there'}!
          </h1>
          <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
            You are not currently associated with an organization. In Logic-Q1 CRM, each user belongs to exactly one organization workspace.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex rounded-xl bg-card border border-border p-1 mb-4 shadow-subtle">
          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'create'
                ? 'bg-primary text-primary-foreground shadow-subtle'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Create Organization</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('invite')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'invite'
                ? 'bg-primary text-primary-foreground shadow-subtle'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Have an Invitation?</span>
          </button>
        </div>

        {/* Main card */}
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-elevated">
          {activeTab === 'create' ? (
            <form onSubmit={handleCreateOrg} className="space-y-4">
              <div className="mb-4">
                <h2 className="text-base font-semibold text-foreground">
                  Create Your Organization Workspace
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  You'll be the primary administrator of this CRM workspace.
                </p>
              </div>

              <Input
                label="Organization Name"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="Acme Corporation"
                required
                leftIcon={<Building2 className="w-4 h-4" />}
              />

              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="Technology">Technology / SaaS</option>
                  <option value="Finance">Finance & Banking</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="E-Commerce">E-Commerce & Retail</option>
                  <option value="Professional Services">Professional Services</option>
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="Other">Other</option>
                </Select>

                <Input
                  label="Country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="United States"
                />
              </div>

              <Input
                label="Website URL (optional)"
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://example.com"
                leftIcon={<Globe className="w-4 h-4" />}
              />

              <Button
                type="submit"
                className="w-full h-10 mt-2"
                isLoading={isSubmitting}
              >
                <span>Initialize Workspace</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </form>
          ) : (
            <form onSubmit={handleApplyInvite} className="space-y-4">
              <div className="mb-4">
                <h2 className="text-base font-semibold text-foreground">
                  Enter Invitation Token
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  If an organization administrator sent you an invitation token, paste it below.
                </p>
              </div>

              <Input
                label="Invitation Token"
                value={inviteToken}
                onChange={(e) => setInviteToken(e.target.value)}
                placeholder="Paste token string here"
                required
                leftIcon={<Mail className="w-4 h-4" />}
              />

              <Button type="submit" className="w-full h-10 mt-2">
                <span>Validate & Join Workspace</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </form>
          )}

          <div className="mt-6 pt-5 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              1 Organization per User
            </span>
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-1 text-muted-foreground hover:text-destructive transition-colors font-medium"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
