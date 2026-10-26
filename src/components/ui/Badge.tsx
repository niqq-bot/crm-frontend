import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'destructive' | 'success' | 'warning' | 'info';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  size = 'sm',
  children,
  ...props
}) => {
  const variants = {
    default: 'bg-primary/10 text-primary border-primary/20',
    secondary: 'bg-secondary text-secondary-foreground border-transparent',
    outline: 'border-border text-foreground bg-transparent',
    destructive: 'bg-destructive/10 text-destructive border-destructive/20',
    success: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
    info: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 font-medium rounded-full',
    md: 'text-xs px-2.5 py-1 font-medium rounded-md',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 border transition-colors select-none',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
