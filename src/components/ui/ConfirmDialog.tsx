import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle } from 'lucide-react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'destructive' | 'primary';
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'destructive',
  isLoading = false,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="sm">
      <div className="flex gap-4">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="space-y-1.5 pt-0.5">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {description}
          </p>
        </div>
      </div>
      <div className="flex justify-end gap-2.5 pt-4 mt-2 border-t border-border/80">
        <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
          {cancelLabel}
        </Button>
        <Button
          variant={variant}
          size="sm"
          onClick={onConfirm}
          isLoading={isLoading}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
};
