import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { leadsApi } from '@/api/leads';
import { getErrorMessage } from '@/api/client';
import { Lead, LeadRating, LeadStatus } from '@/types/api';
import { LEAD_STATUS_CONFIG, LEAD_RATING_CONFIG } from '@/lib/constants';
import { formatCurrency, formatDate, getInitials, getAvatarColor } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Tabs } from '@/components/ui/Tabs';
import { TableContainer, TableHead, TableRow, TableHeaderCell, TableCell } from '@/components/ui/Table';
import { StatusSelect } from '@/components/ui/StatusSelect';
import { EmptyState } from '@/components/ui/EmptyState';
import { TableSkeleton, BoardSkeleton } from '@/components/ui/Skeleton';
import { LeadFormModal } from './LeadFormModal';
import { LeadDetailModal } from './LeadDetailModal';
import { toast } from 'sonner';
import {
  Plus,
  Search,
  LayoutList,
  Kanban,
  Target,
  Building2,
  Mail,
  Phone,
  Flame,
  ArrowRight,
} from 'lucide-react';

const STATUS_ORDER: LeadStatus[] = ['NEW', 'CONTACTED', 'QUALIFIED', 'LOST', 'CONVERTED'];

export const LeadsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  // View state: 'list' | 'board'
  const [viewMode, setViewMode] = useState<'list' | 'board'>(() => {
    return (localStorage.getItem('crm_leads_view') as 'list' | 'board') || 'list';
  });

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [ratingFilter, setRatingFilter] = useState<string>('ALL');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(() => searchParams.get('action') === 'new');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [detailLead, setDetailLead] = useState<Lead | null>(null);

  // Clear query param on modal close
  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedLead(null);
    if (searchParams.get('action') === 'new') {
      searchParams.delete('action');
      setSearchParams(searchParams);
    }
  };

  const handleSetViewMode = (mode: string) => {
    const v = mode as 'list' | 'board';
    setViewMode(v);
    localStorage.setItem('crm_leads_view', v);
  };

  // TanStack Query
  const { data: leads = [], isLoading, refetch } = useQuery({
    queryKey: ['leads'],
    queryFn: leadsApi.listAllLeads,
  });

  // Dedicated status change mutation
  const statusMutation = useMutation({
    mutationFn: async ({ lead, newStatus }: { lead: Lead; newStatus: LeadStatus }) => {
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
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const name = `${lead.firstName || ''} ${lead.lastName || ''}`.toLowerCase();
      const company = (lead.company || '').toLowerCase();
      const email = (lead.email || '').toLowerCase();
      const term = search.toLowerCase();

      const matchesSearch = !term || name.includes(term) || company.includes(term) || email.includes(term);
      const matchesStatus = statusFilter === 'ALL' || lead.leadStatus === statusFilter;
      const matchesRating = ratingFilter === 'ALL' || lead.rating === ratingFilter;

      return matchesSearch && matchesStatus && matchesRating;
    });
  }, [leads, search, statusFilter, ratingFilter]);

  // Grouped for Board view
  const boardColumns = useMemo(() => {
    const cols: Record<LeadStatus, Lead[]> = {
      NEW: [],
      CONTACTED: [],
      QUALIFIED: [],
      LOST: [],
      CONVERTED: [],
    };
    filteredLeads.forEach((l) => {
      if (cols[l.leadStatus]) {
        cols[l.leadStatus].push(l);
      } else {
        cols.NEW.push(l);
      }
    });
    return cols;
  }, [filteredLeads]);

  const statusOptions = Object.entries(LEAD_STATUS_CONFIG).map(([val, conf]) => ({
    value: val as LeadStatus,
    label: conf.label,
    color: conf.color,
    bg: conf.bg,
    border: conf.border,
  }));

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Leads Directory
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Capture, qualify, and convert prospects through your sales pipeline
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Tabs
            tabs={[
              { id: 'list', label: 'List', icon: <LayoutList className="w-3.5 h-3.5" /> },
              { id: 'board', label: 'Board', icon: <Kanban className="w-3.5 h-3.5" /> },
            ]}
            activeTab={viewMode}
            onChange={handleSetViewMode}
          />

          <Button size="sm" onClick={() => setIsFormOpen(true)} className="gap-1.5 shadow-sm">
            <Plus className="w-4 h-4" />
            <span>Create Lead</span>
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-card p-3 rounded-xl border border-border/70 shadow-subtle">
        <div className="w-full sm:w-72">
          <Input
            placeholder="Search leads, companies, emails..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
            className="h-8 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-auto">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-8 text-xs py-0 w-36"
          >
            <option value="ALL">All Statuses</option>
            <option value="NEW">New</option>
            <option value="CONTACTED">Contacted</option>
            <option value="QUALIFIED">Qualified</option>
            <option value="CONVERTED">Converted</option>
            <option value="LOST">Lost</option>
          </Select>

          <Select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="h-8 text-xs py-0 w-32"
          >
            <option value="ALL">All Ratings</option>
            <option value="HOT">Hot 🔥</option>
            <option value="WARM">Warm ⚡</option>
            <option value="COLD">Cold ❄️</option>
          </Select>
        </div>
      </div>

      {/* Main Content: List or Board */}
      {isLoading ? (
        viewMode === 'list' ? (
          <TableSkeleton rows={6} cols={6} />
        ) : (
          <BoardSkeleton columns={5} />
        )
      ) : filteredLeads.length === 0 ? (
        <EmptyState
          icon={<Target className="w-6 h-6 text-primary" />}
          title={search || statusFilter !== 'ALL' ? 'No matching leads' : 'No leads found'}
          description={
            search || statusFilter !== 'ALL'
              ? 'Try modifying your search filter criteria'
              : 'Add your first prospective sales lead to start tracking engagement and conversion.'
          }
          actionLabel="Create Lead"
          onAction={() => setIsFormOpen(true)}
        />
      ) : viewMode === 'list' ? (
        /* TABLE LIST VIEW */
        <TableContainer>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Lead</TableHeaderCell>
              <TableHeaderCell>Company</TableHeaderCell>
              <TableHeaderCell>Dedicated Status</TableHeaderCell>
              <TableHeaderCell>Rating</TableHeaderCell>
              <TableHeaderCell>Owner</TableHeaderCell>
              <TableHeaderCell>Source</TableHeaderCell>
              <TableHeaderCell>Created</TableHeaderCell>
              <TableHeaderCell className="text-right">Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <tbody>
            {filteredLeads.map((lead) => {
              const fullName = `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || 'Unnamed';
              const ratingConf = lead.rating ? LEAD_RATING_CONFIG[lead.rating] : null;

              return (
                <TableRow
                  key={lead.id}
                  clickable
                  onClick={() => setDetailLead(lead)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold flex-shrink-0 ${getAvatarColor(
                          lead.email || fullName
                        )}`}
                      >
                        {getInitials(fullName, lead.email)}
                      </div>
                      <div className="truncate">
                        <div className="font-semibold text-foreground truncate hover:text-primary transition-colors">
                          {fullName}
                        </div>
                        {lead.email && (
                          <div className="text-[11px] text-muted-foreground truncate">
                            {lead.email}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    {lead.company ? (
                      <div className="font-medium text-foreground truncate flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                        <span>{lead.company}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground/60">—</span>
                    )}
                  </TableCell>

                  {/* MANDATORY DEDICATED STATUS CHANGE ACTION */}
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <StatusSelect<LeadStatus>
                      value={lead.leadStatus}
                      options={statusOptions}
                      onChange={(newStatus) => statusMutation.mutateAsync({ lead, newStatus })}
                      isLoading={statusMutation.isPending && statusMutation.variables?.lead.id === lead.id}
                    />
                  </TableCell>

                  <TableCell>
                    {ratingConf ? (
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${ratingConf.bg} ${ratingConf.color}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${ratingConf.dot}`} />
                        {ratingConf.label}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/60">—</span>
                    )}
                  </TableCell>

                  <TableCell>
                    <span className="text-xs text-foreground font-medium truncate">
                      {lead.owner
                        ? `${lead.owner.firstName} ${lead.owner.lastName}`
                        : lead.ownerId ? 'Assigned' : 'Unassigned'}
                    </span>
                  </TableCell>

                  <TableCell>
                    <span className="text-xs text-muted-foreground">
                      {lead.leadSource || '—'}
                    </span>
                  </TableCell>

                  <TableCell>
                    <span className="text-[11px] text-muted-foreground">
                      {formatDate(lead.createdAt)}
                    </span>
                  </TableCell>

                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDetailLead(lead)}
                      className="text-xs h-7 px-2"
                    >
                      <span>View</span>
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </tbody>
        </TableContainer>
      ) : (
        /* KANBAN BOARD VIEW */
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STATUS_ORDER.map((status) => {
            const conf = LEAD_STATUS_CONFIG[status];
            const columnLeads = boardColumns[status] || [];

            return (
              <div
                key={status}
                className="w-80 flex-shrink-0 bg-muted/20 border border-border/70 rounded-xl p-3 flex flex-col max-h-[calc(100vh-230px)] shadow-subtle"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 mb-2 border-b border-border/60">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${conf.bg.replace('bg-', 'bg-').split(' ')[0]}`} />
                    <span className="text-xs font-semibold text-foreground tracking-tight">
                      {conf.label}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-card border border-border/60 text-muted-foreground">
                    {columnLeads.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="space-y-2.5 overflow-y-auto flex-1 pr-1">
                  {columnLeads.length === 0 ? (
                    <div className="p-6 text-center text-xs text-muted-foreground/60 border border-dashed border-border/60 rounded-lg">
                      No leads in {conf.label}
                    </div>
                  ) : (
                    columnLeads.map((lead) => {
                      const fullName = `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || 'Unnamed';
                      const ratingConf = lead.rating ? LEAD_RATING_CONFIG[lead.rating] : null;

                      return (
                        <div
                          key={lead.id}
                          onClick={() => setDetailLead(lead)}
                          className="bg-card border border-border/80 hover:border-primary/50 rounded-xl p-3 shadow-subtle hover:shadow-elevated transition-all cursor-pointer space-y-2 group"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                              {fullName}
                            </span>
                            {ratingConf && (
                              <span
                                className={`text-[10px] font-medium px-1.5 py-0.2 rounded-full flex items-center gap-1 ${ratingConf.bg} ${ratingConf.color}`}
                              >
                                <span className={`w-1 h-1 rounded-full ${ratingConf.dot}`} />
                                {ratingConf.label}
                              </span>
                            )}
                          </div>

                          {lead.company && (
                            <p className="text-[11px] text-muted-foreground flex items-center gap-1 truncate">
                              <Building2 className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{lead.company}</span>
                            </p>
                          )}

                          {lead.email && (
                            <p className="text-[11px] text-muted-foreground flex items-center gap-1 truncate">
                              <Mail className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{lead.email}</span>
                            </p>
                          )}

                          {/* Card Footer with Owner & MANDATORY DEDICATED STATUS CHANGER */}
                          <div
                            className="pt-2 border-t border-border/50 flex items-center justify-between gap-1 text-[11px]"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="text-muted-foreground truncate max-w-[120px]">
                              {lead.owner
                                ? `${lead.owner.firstName} ${lead.owner.lastName}`
                                : 'Unassigned'}
                            </span>

                            <StatusSelect<LeadStatus>
                              value={lead.leadStatus}
                              options={statusOptions}
                              onChange={(newStatus) =>
                                statusMutation.mutateAsync({ lead, newStatus })
                              }
                              isLoading={
                                statusMutation.isPending &&
                                statusMutation.variables?.lead.id === lead.id
                              }
                            />
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
      <LeadFormModal
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        lead={selectedLead}
        onSuccess={() => refetch()}
      />

      <LeadDetailModal
        isOpen={Boolean(detailLead)}
        onClose={() => setDetailLead(null)}
        lead={detailLead}
        onEdit={(l) => {
          setSelectedLead(l);
          setIsFormOpen(true);
        }}
        onRefresh={() => refetch()}
      />
    </div>
  );
};
