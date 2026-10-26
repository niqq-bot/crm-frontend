import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Check, ChevronDown, Loader2, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface EntityOption {
  id: string;
  label: string;
  subLabel?: string;
  badge?: string;
}

export interface EntitySelectProps {
  label?: string;
  value?: string | null;
  onChange: (value: string | undefined) => void;
  options: EntityOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  isLoading?: boolean;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  emptyText?: string;
}

export const EntitySelect: React.FC<EntitySelectProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select an item...',
  searchPlaceholder = 'Search...',
  isLoading = false,
  error,
  helperText,
  disabled = false,
  required = false,
  className,
  emptyText = 'No options found',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = useMemo(
    () => options.find((opt) => opt.id === value),
    [options, value]
  );

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const term = search.toLowerCase();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(term) ||
        (opt.subLabel && opt.subLabel.toLowerCase().includes(term))
    );
  }, [options, search]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (id: string) => {
    onChange(id);
    setIsOpen(false);
    setSearch('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(undefined);
  };

  return (
    <div className={cn('w-full space-y-1.5 text-left relative', className)} ref={containerRef}>
      {label && (
        <label className="block text-xs font-medium text-foreground/80 tracking-tight">
          {label}
          {required && <span className="text-destructive ml-0.5">*</span>}
        </label>
      )}

      {/* Select trigger button */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
        className={cn(
          'w-full h-9 rounded-md border border-input bg-card px-3 py-1.5 text-sm flex items-center justify-between transition-colors shadow-subtle cursor-pointer select-none',
          isOpen && 'border-primary ring-2 ring-primary/15',
          error && 'border-destructive ring-destructive/15',
          disabled && 'cursor-not-allowed opacity-50 bg-muted/40'
        )}
      >
        <div className="flex items-center gap-2 overflow-hidden flex-1 mr-2">
          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Loading options...</span>
            </div>
          ) : selectedOption ? (
            <div className="truncate flex items-center gap-2">
              <span className="font-medium text-foreground truncate">
                {selectedOption.label}
              </span>
              {selectedOption.subLabel && (
                <span className="text-xs text-muted-foreground truncate">
                  — {selectedOption.subLabel}
                </span>
              )}
            </div>
          ) : (
            <span className="text-muted-foreground/60 text-sm truncate">
              {placeholder}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {!required && selectedOption && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-0.5 text-muted-foreground hover:text-foreground rounded transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown
            className={cn(
              'w-4 h-4 text-muted-foreground transition-transform duration-200',
              isOpen && 'rotate-180'
            )}
          />
        </div>
      </div>

      {error && <p className="text-xs text-destructive font-medium">{error}</p>}
      {helperText && !error && (
        <p className="text-xs text-muted-foreground">{helperText}</p>
      )}

      {/* Dropdown panel */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full z-50 bg-popover text-popover-foreground border border-border rounded-lg shadow-elevated p-1 animate-in fade-in-50 zoom-in-95">
          {/* Search box inside dropdown */}
          <div className="flex items-center px-2 py-1.5 border-b border-border/60 mb-1">
            <Search className="w-3.5 h-3.5 text-muted-foreground mr-2 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="text-muted-foreground hover:text-foreground p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Options list */}
          <div className="max-h-56 overflow-y-auto space-y-0.5">
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-center text-xs text-muted-foreground">
                {emptyText}
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.id === value;
                return (
                  <div
                    key={opt.id}
                    onClick={() => handleSelect(opt.id)}
                    className={cn(
                      'flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs cursor-pointer transition-colors',
                      isSelected
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'hover:bg-muted text-foreground'
                    )}
                  >
                    <div className="flex flex-col truncate mr-2">
                      <span className="truncate">{opt.label}</span>
                      {opt.subLabel && (
                        <span className="text-[11px] text-muted-foreground truncate">
                          {opt.subLabel}
                        </span>
                      )}
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
