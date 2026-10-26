import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { activityTimelineApi } from '@/api/activityTimeline';
import { ActionType } from '@/types/api';
import { ActivityFeed } from '@/components/common/ActivityFeed';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { ChevronLeft, ChevronRight, Activity, Filter } from 'lucide-react';

export const ActivityPage: React.FC = () => {
  const [page, setPage] = useState(0);
  const [pageSize] = useState(30);
  const [actionFilter, setActionFilter] = useState<string>('ALL');

  const { data: pageData, isLoading } = useQuery({
    queryKey: ['org-activity-feed', page, pageSize],
    queryFn: () => activityTimelineApi.getOrganizationFeed(page, pageSize),
  });

  const rawActivities = pageData?.content || [];

  const filteredActivities = rawActivities.filter((item) => {
    if (actionFilter === 'ALL') return true;
    return item.actionType === actionFilter;
  });

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Activity Timeline
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Audit trail of system events, deal movements, and record updates across your workspace
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="h-8 text-xs py-0 w-36"
          >
            <option value="ALL">All Actions</option>
            <option value="CREATE">Created</option>
            <option value="UPDATE">Updated</option>
            <option value="DELETE">Deleted</option>
            <option value="LOGIN">Logins</option>
            <option value="CONVERT">Converted</option>
          </Select>
        </div>
      </div>

      {/* Main Feed Container */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-subtle">
        <ActivityFeed
          activities={filteredActivities}
          isLoading={isLoading}
          emptyMessage="No activity events recorded yet in this workspace."
        />

        {/* Pagination Bar */}
        {pageData && pageData.totalPages > 1 && (
          <div className="flex items-center justify-between pt-6 mt-6 border-t border-border/60 text-xs text-muted-foreground">
            <span>
              Page {page + 1} of {pageData.totalPages} ({pageData.totalElements} events)
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 0}
                onClick={() => setPage((p) => p - 1)}
                className="h-7 px-2"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= pageData.totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
                className="h-7 px-2"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
