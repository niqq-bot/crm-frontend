import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'md',
  footer,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidths = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Dialog Box */}
      <div
        className={cn(
          'relative w-full bg-card rounded-xl border border-border shadow-elevated z-10 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200',
          maxWidths[maxWidth]
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || description) && (
          <div className="flex items-start justify-between p-5 border-b border-border/80">
            <div className="space-y-1 pr-6">
              {title && (
                <h3 className="text-base font-semibold text-foreground tracking-tight">
                  {title}
                </h3>
              )}
              {description && (
                <p className="text-xs text-muted-foreground">{description}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-2.5 p-4 border-t border-border/80 bg-muted/30 rounded-b-xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
