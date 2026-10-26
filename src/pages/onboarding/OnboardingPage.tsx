import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth, extractOrganizationId } from '@/context/AuthContext';
import { organizationsApi } from '@/api/organizations';
import { getErrorMessage } from '@/api/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { toast } from 'sonner';
import {
  Building2,
  Globe,
  ArrowRight,
  ShieldCheck,
  Mail,
  LogOut,
  RefreshCw,
  Link as LinkIcon,
  CheckCircle2,
} from 'lucide-react';

export const OnboardingPage: React.FC = () => {
  const { user, hasOrganization, refreshUser, setOrganizationId, logout } = useAuth();
  const navigate = useNavigate();

  // If user already has an organization, redirect directly to dashboard
  useEffect(() => {
    if (hasOrganization) {
      navigate('/dashboard', { replace: true });
    }
  }, [hasOrganization, navigate]);

  const [activeTab, setActiveTab] = useState<'create' | 'existing' | 'invite'>('create');

  // Create organization state
  const [orgName, setOrgName] = useState('');
  const [category, setCategory] = useState('Technology');
  const [country, setCountry] = useState('United States');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Existing organization manual ID / selection state
  const [manualOrgId, setManualOrgId] = useState('');
  const [selectedExistingOrgId, setSelectedExistingOrgId] = useState('');
  const [isCheckingOrg, setIsCheckingOrg] = useState(false);

  // Invite token state
  const [inviteToken, setInviteToken] = useState('');

  // Fetch all existing organizations in backend to let user link easily if already created
  const { data: existingOrgs = [], refetch: refetchOrgs } = useQuery({
    queryKey: ['onboarding-existing-orgs'],
    queryFn: organizationsApi.getAll,
  });

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim()) {
      toast.error('Please enter an organization name');
      return;
    }

    setIsSubmitting(true);
    try {
      const createdOrg = await organizationsApi.createOrganization({
        name: orgName.trim(),
        category,
        country,
        websiteUrl: websiteUrl.trim() || undefined,
      });

      // If createdOrg returns an object with ID, store it
      if (createdOrg && createdOrg.id) {
        setOrganizationId(createdOrg.id, createdOrg.name || orgName.trim());
      }

      // Refresh authenticated user to verify organization membership is updated
      const refreshedUser = await refreshUser();
      const newOrgId = extractOrganizationId(refreshedUser) || createdOrg?.id;

      if (newOrgId) {
        setOrganizationId(newOrgId, orgName.trim());
        toast.success(`Welcome to ${orgName.trim()}! Workspace initialized.`);
        navigate('/dashboard', { replace: true });
      } else {
        toast.success('Organization created. Loading workspace...');
        setTimeout(async () => {
          await refreshUser();
          navigate('/dashboard', { replace: true });
        }, 1000);
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConnectExisting = (e: React.FormEvent) => {
    e.preventDefault();
    const targetId = manualOrgId.trim() || selectedExistingOrgId;
    if (!targetId) {
      toast.error('Please enter or select an organization ID');
      return;
    }

    const matchedOrg = existingOrgs.find((o) => o.id === targetId);
    const orgLabel = matchedOrg?.name || 'My Organization';

    setOrganizationId(targetId, orgLabel);
    toast.success(`Connected to ${orgLabel}! Navigating to dashboard...`);
    navigate('/dashboard', { replace: true });
  };

  const handleRefreshAndCheck = async () => {
    setIsCheckingOrg(true);
    try {
      await refetchOrgs();
      const refreshed = await refreshUser();
      const orgId = extractOrganizationId(refreshed);

      if (orgId) {
        toast.success('Organization detected! Entering dashboard...');
        navigate('/dashboard', { replace: true });
      } else if (existingOrgs.length > 0) {
        // If organizations exist, notify user they can select one
        setActiveTab('existing');
        toast.info(`Found ${existingOrgs.length} existing organization(s). Select your workspace.`);
      } else {
        toast.info('No active organization detected for this user. Please create one below.');
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsCheckingOrg(false);
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
            You are not currently linked to an active organization session. Choose an option below to access your CRM workspace.
          </p>

          <div className="mt-3 flex items-center justify-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRefreshAndCheck}
              isLoading={isCheckingOrg}
              className="h-7 text-xs gap-1.5 text-primary border-primary/30 hover:bg-primary/5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Check My Organization Status</span>
            </Button>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex rounded-xl bg-card border border-border p-1 mb-4 shadow-subtle">
          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'create'
                ? 'bg-primary text-primary-foreground shadow-subtle'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Create New</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('existing')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'existing'
                ? 'bg-primary text-primary-foreground shadow-subtle'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>Existing Org</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('invite')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'invite'
                ? 'bg-primary text-primary-foreground shadow-subtle'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Invite Token</span>
          </button>
        </div>

        {/* Main card */}
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-elevated">
          {activeTab === 'create' && (
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
          )}

          {activeTab === 'existing' && (
            <form onSubmit={handleConnectExisting} className="space-y-4">
              <div className="mb-4">
                <h2 className="text-base font-semibold text-foreground">
                  Connect to Your Existing Organization
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Select your existing workspace or enter your Organization ID to proceed directly to the dashboard.
                </p>
              </div>

              {existingOrgs.length > 0 && (
                <div className="space-y-1.5 text-left">
                  <label className="block text-xs font-medium text-foreground/80 tracking-tight">
                    Select from Registered Organizations ({existingOrgs.length} available)
                  </label>
                  <select
                    value={selectedExistingOrgId}
                    onChange={(e) => {
                      setSelectedExistingOrgId(e.target.value);
                      if (e.target.value) setManualOrgId(e.target.value);
                    }}
                    className="w-full h-9 rounded-md border border-input bg-card px-3 py-1.5 text-xs text-foreground cursor-pointer focus:border-primary focus:ring-2 focus:ring-primary/15"
                  >
                    <option value="">-- Choose an existing organization --</option>
                    {existingOrgs.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name} ({org.category || 'General'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <Input
                  label="Or Enter Organization ID (UUID)"
                  value={manualOrgId}
                  onChange={(e) => setManualOrgId(e.target.value)}
                  placeholder="e.g. 19b4e785-3b7d-4bad-9bdd-2b0d7b3dcb6d"
                  leftIcon={<Building2 className="w-4 h-4" />}
                />
                <p className="text-[11px] text-muted-foreground">
                  Paste the ID of your existing organization to immediately proceed to the dashboard.
                </p>
              </div>

              <Button type="submit" className="w-full h-10 mt-2">
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                <span>Connect & Proceed to Dashboard</span>
              </Button>
            </form>
          )}

          {activeTab === 'invite' && (
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
