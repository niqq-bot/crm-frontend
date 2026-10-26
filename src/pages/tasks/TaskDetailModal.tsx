import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '@/api/tasks';
import { getErrorMessage } from '@/api/client';
import { TaskItem, TaskStatus } from '@/types/api';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { StatusSelect } from '@/components/ui/StatusSelect';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { toast } from 'sonner';
import {
  Calendar,
  Clock,
  User,
  Trash2,
  Edit2,
  Bell,
  CheckCircle2,
  Users,
  Target,
} from 'lucide-react';
import { TASK_STATUS_CONFIG, TASK_PRIORITY_CONFIG } from '@/lib/constants';
import { formatDate, formatDateTime } from '@/lib/utils';

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: TaskItem | null;
  onEdit: (task: TaskItem) => void;
  onRefresh: () => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  isOpen,
  onClose,
  task,
  onEdit,
  onRefresh,
}) => {
  const queryClient = useQueryClient();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Dedicated status change mutation
  const statusMutation = useMutation({
    mutationFn: async (newStatus: TaskStatus) => {
      if (!task) return;
      await tasksApi.moveTask(task.id, { status: newStatus });
    },
    onSuccess: () => {
      toast.success('Task status updated');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks-board'] });
      onRefresh();
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  if (!task) return null;

  const priorityConf = TASK_PRIORITY_CONFIG[task.priority] || TASK_PRIORITY_CONFIG.NORMAL;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await tasksApi.deleteTask(task.id);
      toast.success('Task deleted');
      setIsDeleteOpen(false);
      onClose();
      onRefresh();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsDeleting(false);
    }
  };

  const statusOptions = Object.entries(TASK_STATUS_CONFIG).map(([val, conf]) => ({
    value: val as TaskStatus,
    label: conf.label,
    color: conf.color,
    bg: conf.bg,
    border: conf.border,
  }));

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} maxWidth="2xl">
        {/* Header with Title and dedicated status changer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/80">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-foreground tracking-tight">
                {task.subject}
              </h2>
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${priorityConf.bg} ${priorityConf.color}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${priorityConf.dot}`} />
                {priorityConf.label} Priority
              </span>
            </div>
            {task.dueDate && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>Due {formatDate(task.dueDate)}</span>
              </p>
            )}
          </div>

          {/* Dedicated Status Changer right in Header */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium">Status:</span>
            <StatusSelect<TaskStatus>
              value={task.status}
              options={statusOptions}
              onChange={(newStatus) => statusMutation.mutateAsync(newStatus)}
              isLoading={statusMutation.isPending}
              size="sm"
            />
          </div>
        </div>

        {/* Action bar */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEdit(task)}
            className="gap-1.5 text-xs"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit Task</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsDeleteOpen(true)}
            className="gap-1.5 text-xs text-rose-600 hover:bg-rose-50 border-rose-200 dark:border-rose-900"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </Button>
        </div>

        {/* Task Details */}
        <div className="space-y-4 pt-2">
          {task.description && (
            <div className="rounded-xl border border-border/60 p-4 bg-muted/20 space-y-1.5">
              <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider text-muted-foreground">
                Description
              </h4>
              <p className="text-xs text-foreground whitespace-pre-wrap leading-relaxed">
                {task.description}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="rounded-xl border border-border/60 p-4 space-y-3 bg-card">
              <h4 className="font-semibold text-foreground uppercase tracking-wider text-[10px] text-muted-foreground">
                Assignment & Dates
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center py-0.5 border-b border-border/40">
                  <span className="text-muted-foreground">Assignee</span>
                  <span className="font-medium text-foreground">
                    {task.owner
                      ? `${task.owner.firstName} ${task.owner.lastName}`
                      : task.ownerId ? 'Assigned' : 'Unassigned'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-0.5 border-b border-border/40">
                  <span className="text-muted-foreground">Due Date</span>
                  <span className="font-medium text-foreground">{formatDate(task.dueDate)}</span>
                </div>
                {task.reminderAt && (
                  <div className="flex justify-between items-center py-0.5">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Bell className="w-3 h-3 text-amber-500" />
                      Reminder
                    </span>
                    <span className="font-medium text-foreground">
                      {formatDateTime(task.reminderAt)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-border/60 p-4 space-y-3 bg-card">
              <h4 className="font-semibold text-foreground uppercase tracking-wider text-[10px] text-muted-foreground">
                Related Records
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center py-0.5 border-b border-border/40">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    Contact
                  </span>
                  <span className="font-medium text-foreground">
                    {task.relatedContact?.name || (task.relatedContactId ? 'Linked' : 'None')}
                  </span>
                </div>
                <div className="flex justify-between items-center py-0.5 border-b border-border/40">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Target className="w-3 h-3" />
                    Lead
                  </span>
                  <span className="font-medium text-foreground">
                    {task.relatedLead?.company || (task.relatedLeadId ? 'Linked' : 'None')}
                  </span>
                </div>
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-muted-foreground">Email Alert</span>
                  <span className="font-medium text-foreground">
                    {task.sendNotificationEmail ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Task"
        description={`Are you sure you want to delete "${task.subject}"?`}
        confirmLabel="Delete Task"
        isLoading={isDeleting}
      />
    </>
  );
};
