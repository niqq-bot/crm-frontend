import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { organizationsApi } from '@/api/organizations';
import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatDate } from '@/lib/utils';
import {
  Building2,
  Globe,
  MapPin,
  Users,
  ShieldCheck,
  Calendar,
  Phone,
} from 'lucide-react';

export const OrganizationSettingsPage: React.FC = () => {
  const { organizationId, organizationName } = useAuth();

  const { data: org, isLoading } = useQuery({
    queryKey: ['current-organization', organizationId],
    queryFn: () => (organizationId ? organizationsApi.getById(organizationId) : null),
    enabled: Boolean(organizationId),
  });

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          Organization Settings
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Workspace properties, security policies, and enterprise details
        </p>
      </div>

      <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300 text-xs">
        <ShieldCheck className="w-4 h-4 flex-shrink-0" />
        <span>
          Strict Organization Isolation: All leads, contacts, deals, tasks, and audit timelines are scoped exclusively to this organization.
        </span>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-base">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  {org?.name || organizationName || 'Current Organization'}
                </h2>
                <p className="text-xs text-muted-foreground">
                  Category: {org?.category || 'General Enterprise'}
                </p>
              </div>
            </div>
            <Badge variant="success">Active Workspace</Badge>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="space-y-3 py-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
              <div className="rounded-xl border border-border/60 p-4 space-y-3 bg-card">
                <h4 className="font-semibold text-foreground uppercase tracking-wider text-[10px] text-muted-foreground">
                  Workspace Identity
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-0.5 border-b border-border/40">
                    <span className="text-muted-foreground">Workspace ID</span>
                    <span className="font-mono text-muted-foreground text-[11px] truncate max-w-[150px]">
                      {org?.id || organizationId}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-0.5 border-b border-border/40">
                    <span className="text-muted-foreground">Category</span>
                    <span className="font-medium text-foreground">{org?.category || 'SaaS / Tech'}</span>
                  </div>
                  <div className="flex justify-between items-center py-0.5">
                    <span className="text-muted-foreground">Created Date</span>
                    <span className="text-muted-foreground">{formatDate(org?.createdAt)}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border/60 p-4 space-y-3 bg-card">
                <h4 className="font-semibold text-foreground uppercase tracking-wider text-[10px] text-muted-foreground">
                  Location & Web
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-0.5 border-b border-border/40">
                    <span className="text-muted-foreground">Country</span>
                    <span className="font-medium text-foreground">{org?.country || 'United States'}</span>
                  </div>
                  <div className="flex justify-between items-center py-0.5 border-b border-border/40">
                    <span className="text-muted-foreground">Website</span>
                    {org?.websiteUrl ? (
                      <a
                        href={org.websiteUrl.startsWith('http') ? org.websiteUrl : `https://${org.websiteUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline truncate max-w-[150px]"
                      >
                        {org.websiteUrl}
                      </a>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </div>
                  <div className="flex justify-between items-center py-0.5">
                    <span className="text-muted-foreground">Total Members</span>
                    <span className="font-medium text-foreground">
                      {org?.members?.length || 'Configured'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
