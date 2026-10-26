import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dealsApi } from '@/api/deals';
import { activityTimelineApi } from '@/api/activityTimeline';
import { getErrorMessage } from '@/api/client';
import { DealDto, DealStage } from '@/types/api';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ActivityFeed } from '@/components/common/ActivityFeed';
import { toast } from 'sonner';
import {
  DollarSign,
  Calendar,
  User,
  ArrowRight,
  TrendingUp,
  Percent,
  Edit2,
  Trash2,
  FileText,
  ShieldCheck,
} from 'lucide-react';
import { DEAL_STAGES } from '@/lib/constants';
import { formatCurrency, formatDate } from '@/lib/utils';

interface DealDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  deal: DealDto | null;
  onEdit: (deal: DealDto) => void;
  onRefresh: () => void;
}

export const DealDetailModal: React.FC<DealDetailModalProps> = ({
  isOpen,
  onClose,
  deal,
  onEdit,
  onRefresh,
}) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'overview' | 'activity'>('overview');
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Timeline query
  const { data: timelineData, isLoading: isLoadingTimeline } = useQuery({
    queryKey: ['deal-timeline', deal?.id],
    queryFn: () => activityTimelineApi.getTimeline('DEAL', deal!.id),
    enabled: isOpen && Boolean(deal?.id),
  });

  // Stage change mutation preserving full DTO
  const stageMutation = useMutation({
    mutationFn: async (newStage: DealStage) => {
      if (!deal) return;
      await dealsApi.updateDeal(deal.id, {
        dealName: deal.dealName,
        amount: deal.amount,
        expectedRevenue: deal.expectedRevenue,
        stage: newStage,
        type: deal.type,
        probability: deal.probability,
        nextStep: deal.nextStep,
        leadSource: deal.leadSource,
        campaignSource: deal.campaignSource,
        closingDate: deal.closingDate,
        description: deal.description,
        contactId: deal.contactId,
        ownerId: deal.ownerId,
      });
    },
    onSuccess: () => {
      toast.success('Deal stage updated');
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      onRefresh();
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  if (!deal) return null;

  const currentStageConfig = DEAL_STAGES.find((s) => s.id === deal.stage);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await dealsApi.deleteDeal(deal.id);
      toast.success('Deal deleted');
      setIsDeleteOpen(false);
      onClose();
      onRefresh();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} maxWidth="3xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/80">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-foreground tracking-tight">
                {deal.dealName}
              </h2>
              {deal.type && (
                <Badge variant="secondary" className="text-[11px]">
                  {deal.type.replace('_', ' ')}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Stage: <span className="font-semibold text-foreground">{currentStageConfig?.label || deal.stage}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit(deal)}
              className="gap-1.5 text-xs"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit</span>
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
        </div>

        {/* Stage Progression Bar (Interactive) */}
        <div className="py-2">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium mb-1.5">
            <span>Stage Progression</span>
            <span>Click any step to transition</span>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
            {DEAL_STAGES.map((s, idx) => {
              const currentIndex = DEAL_STAGES.findIndex((st) => st.id === deal.stage);
              const isPast = idx < currentIndex;
              const isCurrent = idx === currentIndex;

              return (
                <button
                  key={s.id}
                  type="button"
                  disabled={stageMutation.isPending}
                  onClick={() => stageMutation.mutate(s.id)}
                  className={`flex flex-col items-center justify-center p-2 rounded-lg text-center transition-all border ${
                    isCurrent
                      ? 'bg-primary text-primary-foreground border-primary font-bold shadow-subtle'
                      : isPast
                      ? 'bg-muted/80 text-foreground border-border/80 hover:bg-muted'
                      : 'bg-muted/20 text-muted-foreground border-border/40 hover:bg-muted/50'
                  }`}
                  title={`Move to ${s.label}`}
                >
                  <span className="text-[10px] font-semibold truncate w-full">
                    {s.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab switch */}
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
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6 pt-2">
            {/* Financial metrics callouts */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl border border-border/60 bg-card space-y-1">
                <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
                  Total Value
                </span>
                <p className="text-xl font-bold text-foreground">
                  {formatCurrency(deal.amount)}
                </p>
              </div>

              <div className="p-4 rounded-xl border border-border/60 bg-card space-y-1">
                <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
                  Win Probability
                </span>
                <p className="text-xl font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                  <span>{deal.probability ?? 0}%</span>
                </p>
              </div>

              <div className="p-4 rounded-xl border border-border/60 bg-card space-y-1">
                <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
                  Expected Revenue
                </span>
                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(deal.expectedRevenue)}
                </p>
              </div>
            </div>

            {/* Opportunity Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="rounded-xl border border-border/60 p-4 space-y-3 bg-card">
                <h4 className="font-semibold text-foreground uppercase tracking-wider text-[10px] text-muted-foreground">
                  Deal Parameters
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-0.5 border-b border-border/40">
                    <span className="text-muted-foreground">Next Step</span>
                    <span className="font-medium text-foreground text-right">{deal.nextStep || '—'}</span>
                  </div>
                  <div className="flex justify-between items-center py-0.5 border-b border-border/40">
                    <span className="text-muted-foreground">Target Close</span>
                    <span className="font-medium text-foreground">{formatDate(deal.closingDate)}</span>
                  </div>
                  <div className="flex justify-between items-center py-0.5 border-b border-border/40">
                    <span className="text-muted-foreground">Source</span>
                    <span className="font-medium text-foreground">{deal.leadSource || '—'}</span>
                  </div>
                  <div className="flex justify-between items-center py-0.5">
                    <span className="text-muted-foreground">Campaign</span>
                    <span className="font-medium text-foreground">{deal.campaignSource || '—'}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border/60 p-4 space-y-3 bg-card">
                <h4 className="font-semibold text-foreground uppercase tracking-wider text-[10px] text-muted-foreground">
                  Relationships
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-0.5 border-b border-border/40">
                    <span className="text-muted-foreground">Owner</span>
                    <span className="font-medium text-foreground">{deal.ownerName || 'Assigned'}</span>
                  </div>
                  <div className="flex justify-between items-center py-0.5 border-b border-border/40">
                    <span className="text-muted-foreground">Created At</span>
                    <span className="font-medium text-foreground">{formatDate(deal.createdAt)}</span>
                  </div>
                  <div className="flex justify-between items-center py-0.5">
                    <span className="text-muted-foreground">Associated Contact</span>
                    <span className="font-medium text-foreground">
                      {deal.contactId ? 'Linked Contact' : 'None'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {deal.description && (
              <div className="rounded-xl border border-border/60 p-4 bg-muted/20 space-y-1.5">
                <h4 className="font-semibold text-foreground text-xs">Opportunity Notes</h4>
                <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {deal.description}
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
              emptyMessage="No activity events recorded for this deal yet"
            />
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Deal"
        description={`Are you sure you want to delete "${deal.dealName}"? This action cannot be undone.`}
        confirmLabel="Delete Deal"
        isLoading={isDeleting}
      />
    </>
  );
};
