import React from 'react';
import { Button } from './Button';
import { cn } from '@/lib/utils';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  secondaryAction?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
  secondaryAction,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-xl border border-dashed border-border bg-card/40 my-4',
        className
      )}
    >
      {icon && (
        <div className="w-12 h-12 rounded-xl bg-muted/80 flex items-center justify-center text-muted-foreground mb-4 ring-8 ring-muted/30">
          {icon}
        </div>
      )}
      <h3 className="text-sm font-semibold text-foreground tracking-tight">{title}</h3>
      <p className="text-xs text-muted-foreground mt-1 max-w-sm leading-relaxed">
        {description}
      </p>
      {(actionLabel || secondaryAction) && (
        <div className="flex items-center gap-3 mt-5">
          {actionLabel && onAction && (
            <Button size="sm" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
          {secondaryAction}
        </div>
      )}
    </div>
  );
};
