import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, leftIcon, rightIcon, id, ...props }, ref) => {
    const generatedId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label
            htmlFor={generatedId}
            className="block text-xs font-medium text-foreground/80 tracking-tight"
          >
            {label}
            {props.required && <span className="text-destructive ml-0.5">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 text-muted-foreground pointer-events-none flex items-center">
              {leftIcon}
            </div>
          )}
          <input
            id={generatedId}
            ref={ref}
            className={cn(
              'w-full h-9 rounded-md border border-input bg-card px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-50 shadow-subtle',
              leftIcon && 'pl-9',
              rightIcon && 'pr-9',
              error && 'border-destructive focus:border-destructive focus:ring-destructive/15',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 text-muted-foreground pointer-events-none flex items-center">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="text-xs text-destructive font-medium">{error}</p>}
        {helperText && !error && (
          <p className="text-xs text-muted-foreground">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
