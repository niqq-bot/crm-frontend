import React from 'react';
import {
  ActivityTimeline,
  ActionType,
} from '@/types/api';
import { ACTION_TYPE_CONFIG } from '@/lib/constants';
import { formatRelativeTime, formatDateTime } from '@/lib/utils';
import {
  Plus,
  Edit3,
  Trash2,
  LogIn,
  LogOut,
  Key,
  CheckCircle,
  Shield,
  ShieldOff,
  ArrowRightCircle,
  Activity,
  Clock,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';

interface ActivityFeedProps {
  activities: ActivityTimeline[];
  isLoading?: boolean;
  emptyMessage?: string;
}

const ACTION_ICONS: Record<ActionType, React.ReactNode> = {
  CREATE: <Plus className="w-3.5 h-3.5 text-emerald-500" />,
  UPDATE: <Edit3 className="w-3.5 h-3.5 text-blue-500" />,
  DELETE: <Trash2 className="w-3.5 h-3.5 text-rose-500" />,
  LOGIN: <LogIn className="w-3.5 h-3.5 text-cyan-500" />,
  LOGOUT: <LogOut className="w-3.5 h-3.5 text-zinc-500" />,
  PASSWORD_RESET: <Key className="w-3.5 h-3.5 text-amber-500" />,
  EMAIL_VERIFIED: <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />,
  ROLE_ASSIGNED: <Shield className="w-3.5 h-3.5 text-purple-500" />,
  ROLE_REMOVED: <ShieldOff className="w-3.5 h-3.5 text-orange-500" />,
  CONVERT: <ArrowRightCircle className="w-3.5 h-3.5 text-violet-500" />,
};

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  activities,
  isLoading = false,
  emptyMessage = 'No activity recorded yet',
}) => {
  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="w-7 h-7 rounded-full flex-shrink-0" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
        <Activity className="w-8 h-8 opacity-30 mb-2" />
        <p className="text-xs">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-[1px] before:bg-border/80">
      {activities.map((item) => {
        const icon = ACTION_ICONS[item.actionType] || (
          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
        );
        const config = ACTION_TYPE_CONFIG[item.actionType] || {
          label: item.actionType,
        };

        return (
          <div key={item.id} className="relative group">
            {/* Timeline node icon */}
            <div className="absolute -left-6 top-0 flex h-5 w-5 items-center justify-center rounded-full bg-card border border-border shadow-subtle group-hover:border-primary/50 transition-colors">
              {icon}
            </div>

            {/* Content card */}
            <div className="rounded-lg border border-border/60 bg-card p-3 shadow-subtle hover:border-border transition-all">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-semibold text-foreground">
                    {config.label}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    on {item.entityType
                      ? item.entityType.charAt(0).toUpperCase() +
                        item.entityType.slice(1).toLowerCase()
                      : 'Unknown'}
                  </span>
                </div>
                <time
                  dateTime={item.createdAt}
                  title={formatDateTime(item.createdAt)}
                  className="text-[10px] text-muted-foreground flex-shrink-0"
                >
                  {formatRelativeTime(item.createdAt)}
                </time>
              </div>

              {/* Field changes if present */}
              {item.changes && item.changes.length > 0 && (
                <div className="mt-2 pt-2 border-t border-border/40 space-y-1">
                  {item.changes.map((change, idx) => (
                    <div
                      key={idx}
                      className="text-[11px] text-muted-foreground flex items-center gap-1.5 flex-wrap"
                    >
                      <span className="font-mono font-medium text-foreground">
                        {change.fieldName}:
                      </span>
                      {change.oldValue && (
                        <span className="line-through text-muted-foreground/80">
                          {change.oldValue}
                        </span>
                      )}
                      <span>→</span>
                      <span className="font-medium text-foreground">
                        {change.newValue || 'empty'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
