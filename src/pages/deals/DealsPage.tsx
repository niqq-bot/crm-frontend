import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { dealsApi } from '@/api/deals';
import { getErrorMessage } from '@/api/client';
import { DealDto, DealStage, UpdateDealDto } from '@/types/api';
import { DEAL_STAGES } from '@/lib/constants';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { EmptyState } from '@/components/ui/EmptyState';
import { BoardSkeleton } from '@/components/ui/Skeleton';
import { DealFormModal } from './DealFormModal';
import { DealDetailModal } from './DealDetailModal';
import { toast } from 'sonner';
import {
  Plus,
  Search,
  Layers,
  DollarSign,
  Calendar,
  User,
  GripVertical,
  ChevronDown,
  TrendingUp,
} from 'lucide-react';

export const DealsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  // Search and filter
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(() => searchParams.get('action') === 'new');
  const [selectedDeal, setSelectedDeal] = useState<DealDto | null>(null);
  const [detailDeal, setDetailDeal] = useState<DealDto | null>(null);
  const [createStage, setCreateStage] = useState<DealStage>('QUALIFICATION');

  // Drag and drop state
  const [draggingDealId, setDraggingDealId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<DealStage | null>(null);

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedDeal(null);
    if (searchParams.get('action') === 'new') {
      searchParams.delete('action');
      setSearchParams(searchParams);
    }
  };

  // TanStack Query
  const { data: deals = [], isLoading, refetch } = useQuery({
    queryKey: ['deals'],
    queryFn: dealsApi.getAllDeals,
  });

  // Stage change mutation (preserves other fields)
  const moveDealMutation = useMutation({
    mutationFn: async ({ deal, newStage }: { deal: DealDto; newStage: DealStage }) => {
      const payload: UpdateDealDto = {
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
      };
      return await dealsApi.updateDeal(deal.id, payload);
    },
    onMutate: async ({ deal, newStage }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['deals'] });
      const previousDeals = queryClient.getQueryData<DealDto[]>(['deals']);

      if (previousDeals) {
        queryClient.setQueryData<DealDto[]>(['deals'], (old = []) =>
          old.map((d) => (d.id === deal.id ? { ...d, stage: newStage } : d))
        );
      }
      return { previousDeals };
    },
    onError: (err, _variables, context) => {
      // Revert to original state if failed
      if (context?.previousDeals) {
        queryClient.setQueryData(['deals'], context.previousDeals);
      }
      toast.error(`Failed to move deal: ${getErrorMessage(err)}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
    },
  });

  // Filtered Deals
  const filteredDeals = useMemo(() => {
    return deals.filter((deal) => {
      const name = (deal.dealName || '').toLowerCase();
      const term = search.toLowerCase();
      const matchesSearch = !term || name.includes(term);
      const matchesType = typeFilter === 'ALL' || deal.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [deals, search, typeFilter]);

  // Grouped by stage
  const dealsByStage = useMemo(() => {
    const map: Record<DealStage, DealDto[]> = {
      QUALIFICATION: [],
      NEEDS_ANALYSIS: [],
      VALUE_PROPOSITION: [],
      IDENTIFY_DECISION_MAKERS: [],
      PROPOSAL_PRICE_QUOTE: [],
      NEGOTIATION_REVIEW: [],
      CLOSED_WON: [],
      CLOSED_LOST: [],
    };
    filteredDeals.forEach((deal) => {
      if (map[deal.stage]) {
        map[deal.stage].push(deal);
      } else {
        map.QUALIFICATION.push(deal);
      }
    });
    return map;
  }, [filteredDeals]);

  // Metrics summary
  const totalPipelineValue = useMemo(() => {
    return filteredDeals
      .filter((d) => d.stage !== 'CLOSED_LOST')
      .reduce((sum, d) => sum + (d.amount || 0), 0);
  }, [filteredDeals]);

  const totalExpectedRevenue = useMemo(() => {
    return filteredDeals
      .filter((d) => d.stage !== 'CLOSED_LOST')
      .reduce((sum, d) => sum + (d.expectedRevenue || 0), 0);
  }, [filteredDeals]);

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, deal: DealDto) => {
    e.dataTransfer.setData('text/plain', deal.id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggingDealId(deal.id);
  };

  const handleDragOver = (e: React.DragEvent, stage: DealStage) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverStage !== stage) {
      setDragOverStage(stage);
    }
  };

  const handleDrop = (e: React.DragEvent, targetStage: DealStage) => {
    e.preventDefault();
    setDragOverStage(null);
    const dealId = e.dataTransfer.getData('text/plain') || draggingDealId;
    setDraggingDealId(null);

    if (!dealId) return;

    const deal = deals.find((d) => d.id === dealId);
    if (deal && deal.stage !== targetStage) {
      moveDealMutation.mutate({ deal, newStage: targetStage });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Deals Pipeline
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Visualize deal flow, stage conversion, and forecast expected revenue
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => {
            setCreateStage('QUALIFICATION');
            setIsFormOpen(true);
          }}
          className="gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Create Deal</span>
        </Button>
      </div>

      {/* Pipeline Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-border/70 bg-card p-4 shadow-subtle flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Total Active Pipeline
            </p>
            <p className="text-xl font-bold text-foreground mt-1">
              {formatCurrency(totalPipelineValue)}
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="rounded-xl border border-border/70 bg-card p-4 shadow-subtle flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Weighted Expected Revenue
            </p>
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {formatCurrency(totalExpectedRevenue)}
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="rounded-xl border border-border/70 bg-card p-4 shadow-subtle flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Tracked Deals
            </p>
            <p className="text-xl font-bold text-foreground mt-1">
              {filteredDeals.length} Opportunities
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <Layers className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-card p-3 rounded-xl border border-border/70 shadow-subtle">
        <div className="w-full sm:w-72">
          <Input
            placeholder="Search deals..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
            className="h-8 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-auto">
          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-8 text-xs py-0 w-36"
          >
            <option value="ALL">All Deal Types</option>
            <option value="NEW_BUSINESS">New Business</option>
            <option value="EXISTING_BUSINESS">Existing Business</option>
            <option value="RENEWAL">Renewal</option>
            <option value="UPSELL">Upsell</option>
            <option value="CROSS_SELL">Cross-sell</option>
          </Select>
        </div>
      </div>

      {/* KANBAN BOARD ONLY (Strictly no table view) */}
      {isLoading ? (
        <BoardSkeleton columns={8} />
      ) : filteredDeals.length === 0 && !search && typeFilter === 'ALL' ? (
        <EmptyState
          icon={<Layers className="w-6 h-6 text-primary" />}
          title="No deals in your pipeline"
          description="Create your first deal to track opportunities across the 8-stage sales cycle."
          actionLabel="Create Deal"
          onAction={() => {
            setCreateStage('QUALIFICATION');
            setIsFormOpen(true);
          }}
        />
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-4 pt-1 snap-x">
          {DEAL_STAGES.map((col) => {
            const stageDeals = dealsByStage[col.id] || [];
            const stageTotal = stageDeals.reduce((sum, d) => sum + (d.amount || 0), 0);
            const isDragOver = dragOverStage === col.id;

            return (
              <div
                key={col.id}
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDrop={(e) => handleDrop(e, col.id)}
                className={`w-72 flex-shrink-0 flex flex-col rounded-xl border transition-all duration-200 snap-start ${
                  isDragOver
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                    : 'border-border/70 bg-muted/25'
                }`}
              >
                {/* Stage Header */}
                <div className="p-3 border-b border-border/60 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${col.barColor}`} />
                      <span className="text-xs font-semibold text-foreground tracking-tight">
                        {col.label}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-card border border-border/60 text-muted-foreground">
                      {stageDeals.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
                    <span>{formatCurrency(stageTotal, true)}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setCreateStage(col.id);
                        setIsFormOpen(true);
                      }}
                      className="text-muted-foreground hover:text-foreground p-0.5 rounded transition-colors"
                      title={`Add deal to ${col.label}`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Cards Container */}
                <div className="p-2 space-y-2.5 overflow-y-auto max-h-[calc(100vh-320px)] flex-1 min-h-[150px]">
                  {stageDeals.length === 0 ? (
                    <div className="h-28 flex items-center justify-center text-center text-xs text-muted-foreground/50 border border-dashed border-border/60 rounded-lg p-2">
                      Drop deals here
                    </div>
                  ) : (
                    stageDeals.map((deal) => {
                      const isDragging = draggingDealId === deal.id;

                      return (
                        <div
                          key={deal.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, deal)}
                          onClick={() => setDetailDeal(deal)}
                          className={`bg-card border rounded-xl p-3 shadow-subtle hover:shadow-elevated transition-all cursor-grab active:cursor-grabbing space-y-2 group select-none ${
                            isDragging
                              ? 'opacity-40 border-dashed border-primary scale-95'
                              : 'border-border/80 hover:border-primary/50'
                          }`}
                        >
                          {/* Card Title & Drag Handle */}
                          <div className="flex items-start justify-between gap-1.5">
                            <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 flex-1">
                              {deal.dealName}
                            </span>
                            <GripVertical className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-muted-foreground flex-shrink-0 mt-0.5" />
                          </div>

                          {/* Amounts */}
                          <div className="flex items-baseline justify-between text-xs">
                            <span className="font-bold text-foreground">
                              {formatCurrency(deal.amount)}
                            </span>
                            {deal.expectedRevenue !== undefined && (
                              <span className="text-[11px] text-muted-foreground" title="Expected Revenue">
                                Exp: {formatCurrency(deal.expectedRevenue, true)}
                              </span>
                            )}
                          </div>

                          {/* Probability Bar */}
                          <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-primary h-full rounded-full transition-all duration-300"
                              style={{ width: `${deal.probability ?? 50}%` }}
                            />
                          </div>

                          {/* Footer Details: Close date, owner, quick stage change */}
                          <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground">
                            <span className="flex items-center gap-1 truncate max-w-[110px]">
                              <User className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{deal.ownerName || 'Assigned'}</span>
                            </span>

                            {/* Quick Non-drag alternative menu */}
                            <div
                              className="relative"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <select
                                value={deal.stage}
                                onChange={(e) =>
                                  moveDealMutation.mutate({
                                    deal,
                                    newStage: e.target.value as DealStage,
                                  })
                                }
                                className="text-[10px] bg-muted/60 hover:bg-muted text-foreground border border-border/60 rounded px-1.5 py-0.5 cursor-pointer focus:outline-none"
                                title="Move to stage"
                              >
                                {DEAL_STAGES.map((s) => (
                                  <option key={s.id} value={s.id}>
                                    {s.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <DealFormModal
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        deal={selectedDeal}
        initialStage={createStage}
        onSuccess={() => refetch()}
      />

      <DealDetailModal
        isOpen={Boolean(detailDeal)}
        onClose={() => setDetailDeal(null)}
        deal={detailDeal}
        onEdit={(d) => {
          setSelectedDeal(d);
          setIsFormOpen(true);
        }}
        onRefresh={() => refetch()}
      />
    </div>
  );
};
