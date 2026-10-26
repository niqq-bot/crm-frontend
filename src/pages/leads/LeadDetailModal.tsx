import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leadsApi } from '@/api/leads';
import { activityTimelineApi } from '@/api/activityTimeline';
import { getErrorMessage } from '@/api/client';
import { Lead, LeadStatus } from '@/types/api';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { StatusSelect } from '@/components/ui/StatusSelect';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ActivityFeed } from '@/components/common/ActivityFeed';
import { Input } from '@/components/ui/Input';
import { toast } from 'sonner';
import {
  Building2,
  Mail,
  Phone,
  Send,
  UserCheck,
  Calendar,
  Globe,
  Trash2,
  Edit2,
  MapPin,
  TrendingUp,
} from 'lucide-react';
import { LEAD_STATUS_CONFIG, LEAD_RATING_CONFIG } from '@/lib/constants';
import { formatCurrency, formatDate } from '@/lib/utils';

interface LeadDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
  onEdit: (lead: Lead) => void;
  onRefresh: () => void;
}

export const LeadDetailModal: React.FC<LeadDetailModalProps> = ({
  isOpen,
  onClose,
  lead,
  onEdit,
  onRefresh,
}) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'email'>('overview');

  // Delete confirm dialog
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Email form state
  const [emailSubject, setEmailSubject] = useState('');
  const [emailText, setEmailText] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Converting state
  const [isConverting, setIsConverting] = useState(false);

  // Activity timeline query for this lead
  const { data: timelineData, isLoading: isLoadingTimeline } = useQuery({
    queryKey: ['lead-timeline', lead?.id],
    queryFn: () => activityTimelineApi.getTimeline('LEAD', lead!.id),
    enabled: isOpen && Boolean(lead?.id),
  });

  // Dedicated status change mutation
  const statusMutation = useMutation({
    mutationFn: async (newStatus: LeadStatus) => {
      if (!lead) return;
      await leadsApi.updateLead({
        leadId: lead.id || lead.leadId || '',
        leadStatus: newStatus,
        firstName: lead.firstName,
        lastName: lead.lastName,
        company: lead.company,
        email: lead.email,
        ownerId: lead.ownerId,
      });
    },
    onSuccess: () => {
      toast.success('Lead status updated');
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      onRefresh();
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  if (!lead) return null;

  const leadName = `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || 'Unnamed Lead';
  const ratingConfig = lead.rating ? LEAD_RATING_CONFIG[lead.rating] : null;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await leadsApi.deleteLead(lead.id);
      toast.success('Lead deleted');
      setIsDeleteOpen(false);
      onClose();
      onRefresh();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleConvert = async () => {
    setIsConverting(true);
    try {
      await leadsApi.convertToContact(lead.id);
      toast.success('Lead converted to contact successfully!');
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      onClose();
      onRefresh();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsConverting(false);
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead.email) {
      toast.error('Lead does not have an email address');
      return;
    }
    if (!emailSubject.trim() || !emailText.trim()) {
      toast.error('Please enter subject and message');
      return;
    }
    setIsSendingEmail(true);
    try {
      await leadsApi.sendMail({
        to: lead.email,
        subject: emailSubject.trim(),
        text: emailText.trim(),
      });
      toast.success(`Email sent to ${lead.email}`);
      setEmailSubject('');
      setEmailText('');
      setActiveTab('overview');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSendingEmail(false);
    }
  };

  const statusOptions = Object.entries(LEAD_STATUS_CONFIG).map(([val, conf]) => ({
    value: val as LeadStatus,
    label: conf.label,
    color: conf.color,
    bg: conf.bg,
    border: conf.border,
  }));

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} maxWidth="3xl">
        {/* Header with Title and dedicated status changer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/80">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-foreground tracking-tight">
                {leadName}
              </h2>
              {ratingConfig && (
                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${ratingConfig.bg} ${ratingConfig.color}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${ratingConfig.dot}`} />
                  {ratingConfig.label} Rating
                </span>
              )}
            </div>
            {lead.company && (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5 font-medium">
                <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                <span>{lead.company}</span>
                {lead.title && <span>— {lead.title}</span>}
              </p>
            )}
          </div>

          {/* Dedicated Status Changer right in Header */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium">Status:</span>
            <StatusSelect<LeadStatus>
              value={lead.leadStatus}
              options={statusOptions}
              onChange={(newStatus) => statusMutation.mutateAsync(newStatus)}
              isLoading={statusMutation.isPending}
              size="sm"
            />
          </div>
        </div>

        {/* Tab navigation */}
        <div className="flex border-b border-border/80 gap-6 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`pb-2.5 transition-colors border-b-2 -mb-[1px] ${
              activeTab === 'overview'
                ? 'border-primary text-foreground font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('activity')}
            className={`pb-2.5 transition-colors border-b-2 -mb-[1px] ${
              activeTab === 'activity'
                ? 'border-primary text-foreground font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Activity Timeline
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('email')}
            className={`pb-2.5 transition-colors border-b-2 -mb-[1px] ${
              activeTab === 'email'
                ? 'border-primary text-foreground font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Send Email
          </button>
        </div>

        {/* Overview Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6 pt-2">
            {/* Quick action bar */}
            <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/40 rounded-xl border border-border/60">
              <Button
                size="sm"
                variant="outline"
                onClick={handleConvert}
                isLoading={isConverting}
                disabled={lead.leadStatus === 'CONVERTED'}
                className="gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>{lead.leadStatus === 'CONVERTED' ? 'Already Converted' : 'Convert to Contact'}</span>
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => setActiveTab('email')}
                className="gap-1.5 text-xs"
              >
                <Mail className="w-3.5 h-3.5 text-blue-500" />
                <span>Compose Mail</span>
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit(lead)}
                className="gap-1.5 text-xs ml-auto"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Lead</span>
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsDeleteOpen(true)}
                className="gap-1.5 text-xs text-rose-600 hover:bg-rose-50 border-rose-200 dark:border-rose-900"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>

            {/* Grid attributes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="rounded-xl border border-border/60 p-4 space-y-3 bg-card">
                <h4 className="font-semibold text-foreground uppercase tracking-wider text-[10px] text-muted-foreground">
                  Contact Information
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="text-foreground select-all">{lead.email || '—'}</span>
                  </div>
                  {lead.secondaryEmail && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="w-3.5 h-3.5 flex-shrink-0 opacity-60" />
                      <span className="text-foreground">{lead.secondaryEmail}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="text-foreground">{lead.phone || lead.mobile || '—'}</span>
                  </div>
                  {(lead.city || lead.country) && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="text-foreground">
                        {[lead.city, lead.state, lead.country].filter(Boolean).join(', ')}
                      </span>
                    </div>
                  )}
                  {lead.website && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Globe className="w-3.5 h-3.5 flex-shrink-0" />
                      <a
                        href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline truncate"
                      >
                        {lead.website}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-border/60 p-4 space-y-3 bg-card">
                <h4 className="font-semibold text-foreground uppercase tracking-wider text-[10px] text-muted-foreground">
                  Business & Owner
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-0.5 border-b border-border/40">
                    <span className="text-muted-foreground">Owner</span>
                    <span className="font-medium text-foreground">
                      {lead.owner
                        ? `${lead.owner.firstName} ${lead.owner.lastName}`
                        : lead.ownerId ? 'Assigned' : 'Unassigned'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-0.5 border-b border-border/40">
                    <span className="text-muted-foreground">Industry</span>
                    <span className="font-medium text-foreground">{lead.industry || '—'}</span>
                  </div>
                  <div className="flex justify-between items-center py-0.5 border-b border-border/40">
                    <span className="text-muted-foreground">Source</span>
                    <span className="font-medium text-foreground">{lead.leadSource || '—'}</span>
                  </div>
                  <div className="flex justify-between items-center py-0.5 border-b border-border/40">
                    <span className="text-muted-foreground">Est. Annual Revenue</span>
                    <span className="font-semibold text-foreground">
                      {formatCurrency(lead.annualRevenue)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-0.5">
                    <span className="text-muted-foreground">Created Date</span>
                    <span className="text-muted-foreground">
                      {formatDate(lead.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {lead.description && (
              <div className="rounded-xl border border-border/60 p-4 bg-muted/20 space-y-1.5">
                <h4 className="font-semibold text-foreground text-xs">Notes & Requirements</h4>
                <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {lead.description}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <div className="py-2">
            <ActivityFeed
              activities={timelineData || []}
              isLoading={isLoadingTimeline}
              emptyMessage="No activity events recorded for this lead yet"
            />
          </div>
        )}

        {/* Send Email Tab */}
        {activeTab === 'email' && (
          <form onSubmit={handleSendEmail} className="space-y-4 pt-2">
            <div className="p-3 bg-muted/30 rounded-lg text-xs space-y-1">
              <span className="text-muted-foreground">Recipient:</span>{' '}
              <span className="font-semibold text-foreground">{lead.email || 'No email registered'}</span>
            </div>

            <Input
              label="Subject"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              placeholder="Logic-Q1 Proposal & Product Discussion"
              required
            />

            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-medium text-foreground/80 tracking-tight">
                Message Body
              </label>
              <textarea
                value={emailText}
                onChange={(e) => setEmailText(e.target.value)}
                rows={5}
                required
                className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
                placeholder="Dear colleague..."
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setActiveTab('overview')}
              >
                Back
              </Button>
              <Button
                type="submit"
                size="sm"
                isLoading={isSendingEmail}
                disabled={!lead.email}
              >
                <Send className="w-3.5 h-3.5 mr-1.5" />
                <span>Send Email</span>
              </Button>
            </div>
          </form>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Lead"
        description={`Are you sure you want to delete "${leadName}"? This record will be permanently removed.`}
        confirmLabel="Delete Lead"
        isLoading={isDeleting}
      />
    </>
  );
};
