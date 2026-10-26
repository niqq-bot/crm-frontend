import React from 'react';
import { cn } from '@/lib/utils';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: number | string;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className,
}) => {
  return (
    <div
      className={cn(
        'inline-flex items-center p-1 rounded-lg bg-muted/60 border border-border/60 text-muted-foreground',
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all select-none',
              isActive
                ? 'bg-card text-foreground shadow-subtle border border-border/40 font-semibold'
                : 'hover:text-foreground hover:bg-muted/40'
            )}
          >
            {tab.icon && <span className="w-3.5 h-3.5">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={cn(
                  'ml-1 text-[10px] px-1.5 py-0.2 rounded-full font-mono',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'bg-muted-foreground/20 text-muted-foreground'
                )}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
