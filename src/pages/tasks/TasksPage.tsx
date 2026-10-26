import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { tasksApi } from '@/api/tasks';
import { getErrorMessage } from '@/api/client';
import { TaskItem, TaskPriority, TaskStatus } from '@/types/api';
import { TASK_STATUS_CONFIG, TASK_PRIORITY_CONFIG } from '@/lib/constants';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Tabs } from '@/components/ui/Tabs';
import { TableContainer, TableHead, TableRow, TableHeaderCell, TableCell } from '@/components/ui/Table';
import { StatusSelect } from '@/components/ui/StatusSelect';
import { EmptyState } from '@/components/ui/EmptyState';
import { TableSkeleton, BoardSkeleton } from '@/components/ui/Skeleton';
import { TaskFormModal } from './TaskFormModal';
import { TaskDetailModal } from './TaskDetailModal';
import { toast } from 'sonner';
import {
  Plus,
  Search,
  LayoutList,
  Kanban,
  CheckSquare,
  Calendar,
  User,
  GripVertical,
  ArrowRight,
  Users,
  Target,
} from 'lucide-react';

const STATUS_ORDER: TaskStatus[] = [
  'NOT_STARTED',
  'IN_PROGRESS',
  'WAITING_FOR_INPUT',
  'COMPLETED',
  'DEFERRED',
];

export const TasksPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const [viewMode, setViewMode] = useState<'list' | 'board'>(() => {
    return (localStorage.getItem('crm_tasks_view') as 'list' | 'board') || 'list';
  });

  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(() => searchParams.get('action') === 'new');
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [detailTask, setDetailTask] = useState<TaskItem | null>(null);
  const [createStatus, setCreateStatus] = useState<TaskStatus>('NOT_STARTED');

  // Drag and drop state
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<TaskStatus | null>(null);

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedTask(null);
    if (searchParams.get('action') === 'new') {
      searchParams.delete('action');
      setSearchParams(searchParams);
    }
  };

  const handleSetViewMode = (mode: string) => {
    const v = mode as 'list' | 'board';
    setViewMode(v);
    localStorage.setItem('crm_tasks_view', v);
  };

  // Queries
  const { data: tasks = [], isLoading, refetch } = useQuery({
    queryKey: ['tasks'],
    queryFn: tasksApi.listTasks,
  });

  // Dedicated status change mutation using PATCH /task/{id}/move
  const moveTaskMutation = useMutation({
    mutationFn: async ({ taskId, newStatus }: { taskId: string; newStatus: TaskStatus }) => {
      await tasksApi.moveTask(taskId, { status: newStatus });
    },
    onMutate: async ({ taskId, newStatus }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      const previousTasks = queryClient.getQueryData<TaskItem[]>(['tasks']);
      if (previousTasks) {
        queryClient.setQueryData<TaskItem[]>(['tasks'], (old = []) =>
          old.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
        );
      }
      return { previousTasks };
    },
    onError: (err, _variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks'], context.previousTasks);
      }
      toast.error(`Failed to update status: ${getErrorMessage(err)}`);
    },
    onSuccess: () => {
      toast.success('Task status updated');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const subject = (task.subject || '').toLowerCase();
      const desc = (task.description || '').toLowerCase();
      const term = search.toLowerCase();

      const matchesSearch = !term || subject.includes(term) || desc.includes(term);
      const matchesPriority = priorityFilter === 'ALL' || task.priority === priorityFilter;
      const matchesStatus = statusFilter === 'ALL' || task.status === statusFilter;

      return matchesSearch && matchesPriority && matchesStatus;
    });
  }, [tasks, search, priorityFilter, statusFilter]);

  // Grouped for board view
  const boardColumns = useMemo(() => {
    const map: Record<TaskStatus, TaskItem[]> = {
      NOT_STARTED: [],
      IN_PROGRESS: [],
      WAITING_FOR_INPUT: [],
      COMPLETED: [],
      DEFERRED: [],
    };
    filteredTasks.forEach((t) => {
      if (map[t.status]) {
        map[t.status].push(t);
      } else {
        map.NOT_STARTED.push(t);
      }
    });
    return map;
  }, [filteredTasks]);

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, task: TaskItem) => {
    e.dataTransfer.setData('text/plain', task.id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggingTaskId(task.id);
  };

  const handleDragOver = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverStatus !== status) {
      setDragOverStatus(status);
    }
  };

  const handleDrop = (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    setDragOverStatus(null);
    const taskId = e.dataTransfer.getData('text/plain') || draggingTaskId;
    setDraggingTaskId(null);

    if (!taskId) return;

    const task = tasks.find((t) => t.id === taskId);
    if (task && task.status !== targetStatus) {
      moveTaskMutation.mutate({ taskId, newStatus: targetStatus });
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
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Tasks & Action Items
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Coordinate customer outreach, follow-ups, and deliverables
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Tabs
            tabs={[
              { id: 'list', label: 'List', icon: <LayoutList className="w-3.5 h-3.5" /> },
              { id: 'board', label: 'Board', icon: <Kanban className="w-3.5 h-3.5" /> },
            ]}
            activeTab={viewMode}
            onChange={handleSetViewMode}
          />

          <Button
            size="sm"
            onClick={() => {
              setCreateStatus('NOT_STARTED');
              setIsFormOpen(true);
            }}
            className="gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create Task</span>
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-card p-3 rounded-xl border border-border/70 shadow-subtle">
        <div className="w-full sm:w-72">
          <Input
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
            className="h-8 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-auto">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-8 text-xs py-0 w-36"
          >
            <option value="ALL">All Statuses</option>
            <option value="NOT_STARTED">Not Started</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="WAITING_FOR_INPUT">Waiting for Input</option>
            <option value="COMPLETED">Completed</option>
            <option value="DEFERRED">Deferred</option>
          </Select>

          <Select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="h-8 text-xs py-0 w-32"
          >
            <option value="ALL">All Priorities</option>
            <option value="HIGHEST">Highest</option>
            <option value="HIGH">High</option>
            <option value="NORMAL">Normal</option>
            <option value="LOW">Low</option>
            <option value="LOWEST">Lowest</option>
          </Select>
        </div>
      </div>

      {/* Main Content: List or Board */}
      {isLoading ? (
        viewMode === 'list' ? (
          <TableSkeleton rows={6} cols={6} />
        ) : (
          <BoardSkeleton columns={5} />
        )
      ) : filteredTasks.length === 0 ? (
        <EmptyState
          icon={<CheckSquare className="w-6 h-6 text-primary" />}
          title={search || statusFilter !== 'ALL' ? 'No matching tasks' : 'No tasks scheduled'}
          description={
            search || statusFilter !== 'ALL'
              ? 'Try modifying your search filter criteria'
              : 'Add your first task to plan sales follow-ups and operational action items.'
          }
          actionLabel="Create Task"
          onAction={() => setIsFormOpen(true)}
        />
      ) : viewMode === 'list' ? (
        /* TABLE LIST VIEW */
        <TableContainer>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Subject & Details</TableHeaderCell>
              <TableHeaderCell>Dedicated Status</TableHeaderCell>
              <TableHeaderCell>Priority</TableHeaderCell>
              <TableHeaderCell>Owner</TableHeaderCell>
              <TableHeaderCell>Due Date</TableHeaderCell>
              <TableHeaderCell>Related Entity</TableHeaderCell>
              <TableHeaderCell className="text-right">Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <tbody>
            {filteredTasks.map((task) => {
              const priorityConf =
                TASK_PRIORITY_CONFIG[task.priority] || TASK_PRIORITY_CONFIG.NORMAL;

              return (
                <TableRow
                  key={task.id}
                  clickable
                  onClick={() => setDetailTask(task)}
                >
                  <TableCell>
                    <div className="space-y-0.5 max-w-sm">
                      <p className="font-semibold text-foreground truncate hover:text-primary transition-colors">
                        {task.subject}
                      </p>
                      {task.description && (
                        <p className="text-[11px] text-muted-foreground truncate">
                          {task.description}
                        </p>
                      )}
                    </div>
                  </TableCell>

                  {/* MANDATORY DEDICATED STATUS CHANGE ACTION */}
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <StatusSelect<TaskStatus>
                      value={task.status}
                      options={statusOptions}
                      onChange={(newStatus) =>
                        moveTaskMutation.mutateAsync({ taskId: task.id, newStatus })
                      }
                      isLoading={
                        moveTaskMutation.isPending &&
                        moveTaskMutation.variables?.taskId === task.id
                      }
                    />
                  </TableCell>

                  <TableCell>
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${priorityConf.bg} ${priorityConf.color}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${priorityConf.dot}`} />
                      {priorityConf.label}
                    </span>
                  </TableCell>

                  <TableCell>
                    <span className="text-xs text-foreground font-medium truncate">
                      {task.owner
                        ? `${task.owner.firstName} ${task.owner.lastName}`
                        : task.ownerId ? 'Assigned' : 'Unassigned'}
                    </span>
                  </TableCell>

                  <TableCell>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(task.dueDate)}
                    </span>
                  </TableCell>

                  <TableCell>
                    {task.relatedContact ? (
                      <span className="inline-flex items-center gap-1 text-xs text-foreground truncate">
                        <Users className="w-3 h-3 text-muted-foreground" />
                        {task.relatedContact.name}
                      </span>
                    ) : task.relatedLead ? (
                      <span className="inline-flex items-center gap-1 text-xs text-foreground truncate">
                        <Target className="w-3 h-3 text-muted-foreground" />
                        {task.relatedLead.company || 'Lead'}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/60">—</span>
                    )}
                  </TableCell>

                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDetailTask(task)}
                      className="text-xs h-7 px-2"
                    >
                      <span>View</span>
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </tbody>
        </TableContainer>
      ) : (
        /* KANBAN BOARD VIEW */
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STATUS_ORDER.map((status) => {
            const conf = TASK_STATUS_CONFIG[status];
            const colTasks = boardColumns[status] || [];
            const isDragOver = dragOverStatus === status;

            return (
              <div
                key={status}
                onDragOver={(e) => handleDragOver(e, status)}
                onDrop={(e) => handleDrop(e, status)}
                className={`w-80 flex-shrink-0 rounded-xl border p-3 flex flex-col max-h-[calc(100vh-230px)] shadow-subtle transition-all duration-200 ${
                  isDragOver
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                    : 'border-border/70 bg-muted/20'
                }`}
              >
                {/* Header */}
                <div className="flex items-center justify-between pb-3 mb-2 border-b border-border/60">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${conf.bg.replace('bg-', 'bg-').split(' ')[0]}`} />
                    <span className="text-xs font-semibold text-foreground tracking-tight">
                      {conf.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-card border border-border/60 text-muted-foreground">
                      {colTasks.length}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setCreateStatus(status);
                        setIsFormOpen(true);
                      }}
                      className="text-muted-foreground hover:text-foreground p-0.5 rounded"
                      title="Add task in this column"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Cards Container */}
                <div className="space-y-2.5 overflow-y-auto flex-1 pr-1 min-h-[150px]">
                  {colTasks.length === 0 ? (
                    <div className="p-6 text-center text-xs text-muted-foreground/60 border border-dashed border-border/60 rounded-lg">
                      Drop tasks here
                    </div>
                  ) : (
                    colTasks.map((task) => {
                      const priorityConf =
                        TASK_PRIORITY_CONFIG[task.priority] || TASK_PRIORITY_CONFIG.NORMAL;
                      const isDragging = draggingTaskId === task.id;

                      return (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, task)}
                          onClick={() => setDetailTask(task)}
                          className={`bg-card border rounded-xl p-3 shadow-subtle hover:shadow-elevated transition-all cursor-grab active:cursor-grabbing space-y-2 group select-none ${
                            isDragging
                              ? 'opacity-40 border-dashed border-primary scale-95'
                              : 'border-border/80 hover:border-primary/50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-1.5">
                            <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 flex-1">
                              {task.subject}
                            </span>
                            <GripVertical className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-muted-foreground flex-shrink-0" />
                          </div>

                          {task.description && (
                            <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                              {task.description}
                            </p>
                          )}

                          <div className="flex items-center justify-between text-[11px]">
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.2 rounded-full ${priorityConf.bg} ${priorityConf.color}`}
                            >
                              <span className={`w-1 h-1 rounded-full ${priorityConf.dot}`} />
                              {priorityConf.label}
                            </span>

                            {task.dueDate && (
                              <span className="text-muted-foreground flex items-center gap-1 text-[10px]">
                                <Calendar className="w-3 h-3" />
                                {formatDate(task.dueDate)}
                              </span>
                            )}
                          </div>

                          {/* Footer with Owner & MANDATORY DEDICATED STATUS CHANGER */}
                          <div
                            className="pt-2 border-t border-border/50 flex items-center justify-between gap-1 text-[11px]"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="text-muted-foreground truncate max-w-[110px]">
                              {task.owner
                                ? `${task.owner.firstName} ${task.owner.lastName}`
                                : 'Assigned'}
                            </span>

                            <StatusSelect<TaskStatus>
                              value={task.status}
                              options={statusOptions}
                              onChange={(newStatus) =>
                                moveTaskMutation.mutateAsync({
                                  taskId: task.id,
                                  newStatus,
                                })
                              }
                              isLoading={
                                moveTaskMutation.isPending &&
                                moveTaskMutation.variables?.taskId === task.id
                              }
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <TaskFormModal
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        task={selectedTask}
        initialStatus={createStatus}
        onSuccess={() => refetch()}
      />

      <TaskDetailModal
        isOpen={Boolean(detailTask)}
        onClose={() => setDetailTask(null)}
        task={detailTask}
        onEdit={(t) => {
          setSelectedTask(t);
          setIsFormOpen(true);
        }}
        onRefresh={() => refetch()}
      />
    </div>
  );
};
