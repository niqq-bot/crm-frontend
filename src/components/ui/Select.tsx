import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options?: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, helperText, options, children, id, ...props }, ref) => {
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
          <select
            id={generatedId}
            ref={ref}
            className={cn(
              'w-full h-9 rounded-md border border-input bg-card px-3 pr-8 py-1.5 text-sm text-foreground transition-colors appearance-none focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-50 shadow-subtle cursor-pointer',
              error && 'border-destructive focus:border-destructive focus:ring-destructive/15',
              className
            )}
            {...props}
          >
            {options
              ? options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))
              : children}
          </select>
          <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-2.5 pointer-events-none" />
        </div>
        {error && <p className="text-xs text-destructive font-medium">{error}</p>}
        {helperText && !error && (
          <p className="text-xs text-muted-foreground">{helperText}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
