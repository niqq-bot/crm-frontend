import React from 'react';
import { cn } from '@/lib/utils';

export function TableContainer({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'w-full overflow-x-auto rounded-xl border border-border bg-card shadow-subtle',
        className
      )}
      {...props}
    >
      <table className="w-full text-left border-collapse text-xs sm:text-sm">
        {children}
      </table>
    </div>
  );
}

export function TableHead({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={cn(
        'bg-muted/40 border-b border-border/80 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider select-none',
        className
      )}
      {...props}
    />
  );
}

export function TableRow({
  className,
  clickable = false,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement> & { clickable?: boolean }) {
  return (
    <tr
      className={cn(
        'border-b border-border/60 transition-colors last:border-0 hover:bg-muted/30',
        clickable && 'cursor-pointer',
        className
      )}
      {...props}
    />
  );
}

export function TableHeaderCell({
  className,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={cn('px-4 py-3 font-medium', className)} {...props} />;
}

export function TableCell({
  className,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn('px-4 py-3 align-middle text-foreground', className)} {...props} />;
}
