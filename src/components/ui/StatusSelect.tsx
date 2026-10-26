import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StatusOption<T extends string> {
  value: T;
  label: string;
  color?: string;
  bg?: string;
  border?: string;
}

export interface StatusSelectProps<T extends string> {
  value: T;
  options: StatusOption<T>[];
  onChange: (newValue: T) => void | Promise<void>;
  isLoading?: boolean;
  disabled?: boolean;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

export function StatusSelect<T extends string>({
  value,
  options,
  onChange,
  isLoading = false,
  disabled = false,
  size = 'xs',
  className,
}: StatusSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentOption = options.find((opt) => opt.value === value) || options[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = async (newValue: T, e: React.MouseEvent) => {
    e.stopPropagation();
    if (newValue === value) {
      setIsOpen(false);
      return;
    }
    setIsOpen(false);
    await onChange(newValue);
  };

  const sizes = {
    xs: 'text-[11px] px-2 py-0.5 gap-1 rounded-full font-medium',
    sm: 'text-xs px-2.5 py-1 gap-1.5 rounded-md font-medium',
    md: 'text-sm px-3 py-1.5 gap-2 rounded-md font-medium',
  };

  return (
    <div
      ref={containerRef}
      className={cn('relative inline-block text-left', className)}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        disabled={disabled || isLoading}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={cn(
          'inline-flex items-center border transition-all cursor-pointer shadow-subtle hover:brightness-95 active:scale-[0.98]',
          sizes[size],
          currentOption?.bg || 'bg-muted',
          currentOption?.color || 'text-foreground',
          currentOption?.border || 'border-border',
          (disabled || isLoading) && 'opacity-60 cursor-not-allowed'
        )}
      >
        {isLoading ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
        )}
        <span>{currentOption?.label || value}</span>
        <ChevronDown
          className={cn('w-3 h-3 opacity-60 transition-transform duration-200', isOpen && 'rotate-180')}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 z-50 min-w-[140px] bg-popover text-popover-foreground border border-border rounded-lg shadow-elevated p-1 animate-in fade-in-50 zoom-in-95">
          <div className="space-y-0.5">
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <div
                  key={opt.value}
                  onClick={(e) => handleSelect(opt.value, e)}
                  className={cn(
                    'flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs cursor-pointer transition-colors',
                    isSelected
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'hover:bg-muted text-foreground'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'w-1.5 h-1.5 rounded-full',
                        opt.bg ? 'bg-current' : 'bg-primary'
                      )}
                    />
                    <span>{opt.label}</span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-primary ml-2 flex-shrink-0" />}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
