import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'subtle';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading = false, children, disabled, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 disabled:pointer-events-none disabled:opacity-50 select-none';

    const variants = {
      primary:
        'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm active:scale-[0.99]',
      secondary:
        'bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm active:scale-[0.99]',
      outline:
        'border border-border bg-card hover:bg-muted text-foreground shadow-sm active:scale-[0.99]',
      ghost:
        'hover:bg-muted text-foreground active:scale-[0.99]',
      destructive:
        'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm active:scale-[0.99]',
      subtle:
        'bg-muted/70 text-foreground hover:bg-muted',
    };

    const sizes = {
      sm: 'h-8 px-3 text-xs rounded-md gap-1.5',
      md: 'h-9 px-4 text-sm rounded-md gap-2',
      lg: 'h-10 px-5 text-sm rounded-lg gap-2',
      icon: 'h-8 w-8 rounded-md p-0',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin text-current" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
