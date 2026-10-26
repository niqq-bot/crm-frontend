import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { tasksApi } from '@/api/tasks';
import { usersApi } from '@/api/users';
import { contactsApi } from '@/api/contacts';
import { leadsApi } from '@/api/leads';
import { getErrorMessage } from '@/api/client';
import {
  CreateTaskRequest,
  TaskItem,
  TaskPriority,
  TaskStatus,
  UpdateTaskRequest,
} from '@/types/api';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { EntitySelect, EntityOption } from '@/components/ui/EntitySelect';
import { toast } from 'sonner';

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  task?: TaskItem | null;
  initialStatus?: TaskStatus;
  onSuccess: () => void;
}

export const TaskFormModal: React.FC<TaskFormModalProps> = ({
  isOpen,
  onClose,
  task,
  initialStatus,
  onSuccess,
}) => {
  const isEditing = Boolean(task);

  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('NOT_STARTED');
  const [priority, setPriority] = useState<TaskPriority>('NORMAL');
  const [dueDate, setDueDate] = useState('');
  const [reminderAt, setReminderAt] = useState('');
  const [sendNotificationEmail, setSendNotificationEmail] = useState(false);
  const [recurringActivity, setRecurringActivity] = useState(false);
  const [ownerId, setOwnerId] = useState<string | undefined>(undefined);
  const [relatedContactId, setRelatedContactId] = useState<string | undefined>(undefined);
  const [relatedLeadId, setRelatedLeadId] = useState<string | undefined>(undefined);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load users for owner select
  const { data: usersData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['users-for-tasks'],
    queryFn: () => usersApi.getUsers({ size: 100 }),
    enabled: isOpen,
  });

  const userOptions: EntityOption[] = (usersData?.content || []).map((u) => ({
    id: u.id,
    label: `${u.firstName} ${u.lastName}`.trim() || u.email,
    subLabel: u.email,
  }));

  // Load contacts for contact select
  const { data: contactsData = [], isLoading: isLoadingContacts } = useQuery({
    queryKey: ['contacts-for-tasks'],
    queryFn: contactsApi.getByOwner,
    enabled: isOpen,
  });

  const contactOptions: EntityOption[] = contactsData.map((c) => ({
    id: c.id,
    label: c.name,
    subLabel: c.email || c.title || undefined,
  }));

  // Load leads for lead select
  const { data: leadsData = [], isLoading: isLoadingLeads } = useQuery({
    queryKey: ['leads-for-tasks'],
    queryFn: leadsApi.listAllLeads,
    enabled: isOpen,
  });

  const leadOptions: EntityOption[] = leadsData.map((l) => ({
    id: l.id,
    label: `${l.firstName || ''} ${l.lastName || ''}`.trim() || l.company || 'Lead',
    subLabel: l.company ? `${l.company} — ${l.email || ''}` : l.email,
  }));

  useEffect(() => {
    if (task) {
      setSubject(task.subject || '');
      setDescription(task.description || '');
      setStatus(task.status || 'NOT_STARTED');
      setPriority(task.priority || 'NORMAL');
      setDueDate(task.dueDate || '');
      setReminderAt(task.reminderAt || '');
      setSendNotificationEmail(Boolean(task.sendNotificationEmail));
      setRecurringActivity(Boolean(task.recurringActivity));
      setOwnerId(task.ownerId);
      setRelatedContactId(task.relatedContactId);
      setRelatedLeadId(task.relatedLeadId);
    } else {
      setSubject('');
      setDescription('');
      setStatus(initialStatus || 'NOT_STARTED');
      setPriority('NORMAL');
      setDueDate('');
      setReminderAt('');
      setSendNotificationEmail(false);
      setRecurringActivity(false);
      setOwnerId(undefined);
      setRelatedContactId(undefined);
      setRelatedLeadId(undefined);
    }
  }, [task, initialStatus, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) {
      toast.error('Task subject is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateTaskRequest = {
        subject: subject.trim(),
        description: description.trim() || undefined,
        status,
        priority,
        dueDate: dueDate || undefined,
        reminderAt: reminderAt ? new Date(reminderAt).toISOString() : undefined,
        sendNotificationEmail,
        recurringActivity,
        ownerId: ownerId || undefined,
        relatedContactId: relatedContactId || undefined,
        relatedLeadId: relatedLeadId || undefined,
      };

      if (isEditing && task) {
        await tasksApi.updateTask(task.id, payload as UpdateTaskRequest);
        toast.success('Task updated successfully');
      } else {
        await tasksApi.createTask(payload);
        toast.success('Task created successfully');
      }

      onSuccess();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Task' : 'Create New Task'}
      description={
        isEditing
          ? 'Update task status, priority, assignments, and due dates'
          : 'Schedule a new CRM action item, call, or deliverable'
      }
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Follow up on contract amendments"
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as TaskStatus)}
          >
            <option value="NOT_STARTED">Not Started</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="WAITING_FOR_INPUT">Waiting for Input</option>
            <option value="COMPLETED">Completed</option>
            <option value="DEFERRED">Deferred</option>
          </Select>

          <Select
            label="Priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
          >
            <option value="LOWEST">Lowest</option>
            <option value="LOW">Low</option>
            <option value="NORMAL">Normal</option>
            <option value="HIGH">High</option>
            <option value="HIGHEST">Highest</option>
          </Select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Due Date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />

          <Input
            label="Reminder At"
            type="datetime-local"
            value={reminderAt ? reminderAt.substring(0, 16) : ''}
            onChange={(e) => setReminderAt(e.target.value)}
          />
        </div>

        {/* Searchable human-readable selectors */}
        <EntitySelect
          label="Assigned Owner"
          value={ownerId}
          onChange={setOwnerId}
          options={userOptions}
          isLoading={isLoadingUsers}
          placeholder="Assign to team member..."
          searchPlaceholder="Search team members..."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <EntitySelect
            label="Related Contact"
            value={relatedContactId}
            onChange={setRelatedContactId}
            options={contactOptions}
            isLoading={isLoadingContacts}
            placeholder="Link to contact (optional)..."
            searchPlaceholder="Search contact by name or email..."
          />

          <EntitySelect
            label="Related Lead"
            value={relatedLeadId}
            onChange={setRelatedLeadId}
            options={leadOptions}
            isLoading={isLoadingLeads}
            placeholder="Link to lead (optional)..."
            searchPlaceholder="Search leads by name or company..."
          />
        </div>

        <div className="space-y-1.5 text-left">
          <label className="block text-xs font-medium text-foreground/80 tracking-tight">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
            placeholder="Details, agendas, action requirements..."
          />
        </div>

        <div className="flex items-center gap-6 pt-1 text-xs">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={sendNotificationEmail}
              onChange={(e) => setSendNotificationEmail(e.target.checked)}
              className="rounded border-input text-primary focus:ring-primary"
            />
            <span className="text-foreground">Send notification email</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={recurringActivity}
              onChange={(e) => setRecurringActivity(e.target.checked)}
              className="rounded border-input text-primary focus:ring-primary"
            />
            <span className="text-foreground">Recurring activity</span>
          </label>
        </div>

        <div className="flex justify-end gap-2.5 pt-4 border-t border-border/80">
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {isEditing ? 'Save Changes' : 'Create Task'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
