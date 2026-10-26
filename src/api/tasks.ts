import { apiClient } from './client';
import {
  CreateTaskRequest,
  MoveTaskRequest,
  TaskItem,
  TaskStatus,
  UpdateTaskRequest,
} from '@/types/api';

function extractTaskArray(data: any): TaskItem[] {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.content)) return data.content;
  if (data && Array.isArray(data.tasks)) return data.tasks;
  if (data && typeof data === 'object') {
    const list: TaskItem[] = [];
    Object.values(data).forEach((val) => {
      if (Array.isArray(val)) {
        list.push(...(val as TaskItem[]));
      }
    });
    if (list.length > 0) return list;
  }
  return [];
}

export const tasksApi = {
  listTasks: async (): Promise<TaskItem[]> => {
    const res = await apiClient.get<any>('/task/');
    return extractTaskArray(res.data);
  },

  getBoard: async (): Promise<Record<TaskStatus, TaskItem[]> | TaskItem[]> => {
    const res = await apiClient.get<any>('/task/board');
    return res.data;
  },

  getTaskById: async (id: string): Promise<TaskItem> => {
    const res = await apiClient.get<TaskItem>(`/task/${id}`);
    return res.data;
  },

  createTask: async (data: CreateTaskRequest): Promise<TaskItem> => {
    const res = await apiClient.post<TaskItem>('/task/create', data);
    return res.data;
  },

  updateTask: async (id: string, data: UpdateTaskRequest): Promise<TaskItem> => {
    const res = await apiClient.put<TaskItem>(`/task/${id}`, data);
    return res.data;
  },

  deleteTask: async (id: string): Promise<void> => {
    await apiClient.delete(`/task/${id}`);
  },

  moveTask: async (id: string, data: MoveTaskRequest): Promise<any> => {
    const res = await apiClient.patch(`/task/${id}/move`, data);
    return res.data;
  },
};
