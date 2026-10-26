import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { organizationsApi } from '@/api/organizations';
import { useAuth } from '@/context/AuthContext';
import { getErrorMessage } from '@/api/client';
import { Organization } from '@/types/api';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { TableContainer, TableHead, TableRow, TableHeaderCell, TableCell } from '@/components/ui/Table';
import { EmptyState } from '@/components/ui/EmptyState';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { toast } from 'sonner';
import {
  Building2,
  Globe,
  Plus,
  Users,
  ShieldCheck,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';

export const OrganizationsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { organizationId } = useAuth();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Technology');
  const [country, setCountry] = useState('United States');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: orgs = [], isLoading, refetch } = useQuery({
    queryKey: ['organizations'],
    queryFn: organizationsApi.getAll,
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Organization name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      await organizationsApi.createOrganization({
        name: name.trim(),
        category,
        country,
        websiteUrl: websiteUrl.trim() || undefined,
      });
      toast.success('Organization created successfully');
      setIsCreateOpen(false);
      setName('');
      setWebsiteUrl('');
      refetch();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Organizations
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            View registered enterprise accounts and corporate workspaces
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => setIsCreateOpen(true)}
          className="gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New Organization</span>
        </Button>
      </div>

      {/* Info Alert */}
      <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300 text-xs">
        <ShieldCheck className="w-4 h-4 flex-shrink-0" />
        <span>
          Users belong strictly to a single organization workspace. Your active workspace is highlighted below.
        </span>
      </div>

      {/* Table Content */}
      {isLoading ? (
        <TableSkeleton rows={5} cols={5} />
      ) : orgs.length === 0 ? (
        <EmptyState
          icon={<Building2 className="w-6 h-6 text-primary" />}
          title="No organizations listed"
          description="Create your first organization record to initialize an enterprise workspace."
          actionLabel="New Organization"
          onAction={() => setIsCreateOpen(true)}
        />
      ) : (
        <TableContainer>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Organization</TableHeaderCell>
              <TableHeaderCell>Category</TableHeaderCell>
              <TableHeaderCell>Location</TableHeaderCell>
              <TableHeaderCell>Website</TableHeaderCell>
              <TableHeaderCell>Created</TableHeaderCell>
              <TableHeaderCell className="text-right">Status</TableHeaderCell>
            </TableRow>
          </TableHead>
          <tbody>
            {orgs.map((org) => {
              const isCurrent = org.id === organizationId;

              return (
                <TableRow key={org.id}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                        {org.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="space-y-0.5">
                        <span className="font-semibold text-foreground text-xs">
                          {org.name}
                        </span>
                        {isCurrent && (
                          <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                            <CheckCircle className="w-3 h-3" />
                            <span>Your Active Organization</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <span className="text-xs text-foreground font-medium">
                      {org.category || 'General'}
                    </span>
                  </TableCell>

                  <TableCell>
                    <span className="text-xs text-muted-foreground">
                      {[org.city, org.country].filter(Boolean).join(', ') || 'Global'}
                    </span>
                  </TableCell>

                  <TableCell>
                    {org.websiteUrl ? (
                      <a
                        href={org.websiteUrl.startsWith('http') ? org.websiteUrl : `https://${org.websiteUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                      >
                        <Globe className="w-3 h-3" />
                        <span className="truncate max-w-[150px]">{org.websiteUrl}</span>
                      </a>
                    ) : (
                      <span className="text-muted-foreground/60">—</span>
                    )}
                  </TableCell>

                  <TableCell>
                    <span className="text-[11px] text-muted-foreground">
                      {formatDate(org.createdAt)}
                    </span>
                  </TableCell>

                  <TableCell className="text-right">
                    {isCurrent ? (
                      <Badge variant="success">Current Org</Badge>
                    ) : (
                      <Badge variant="secondary">Member Org</Badge>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </tbody>
        </TableContainer>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Organization"
        description="Establish a new enterprise CRM organization workspace"
        maxWidth="md"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Organization Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Acme Technologies Ltd."
            required
            leftIcon={<Building2 className="w-4 h-4" />}
          />

          <Input
            label="Industry Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="SaaS / Cloud Infrastructure"
          />

          <Input
            label="Country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="United States"
          />

          <Input
            label="Website URL"
            type="url"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            placeholder="https://acme.com"
            leftIcon={<Globe className="w-4 h-4" />}
          />

          <div className="flex justify-end gap-2.5 pt-4 border-t border-border/80">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Create Organization
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
