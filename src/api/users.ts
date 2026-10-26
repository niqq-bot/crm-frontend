import { apiClient } from './client';
import { PageUserResponse, User, UserResponse } from '@/types/api';

export interface GetUsersParams {
  page?: number;
  size?: number;
  sort?: string[];
}

export const usersApi = {
  getUsers: async (params?: GetUsersParams): Promise<PageUserResponse> => {
    const res = await apiClient.get<PageUserResponse>('/api/users', {
      params: {
        page: params?.page ?? 0,
        size: params?.size ?? 50,
        sort: params?.sort,
      },
    });
    return res.data;
  },

  getUser: async (id: string): Promise<UserResponse> => {
    const res = await apiClient.get<UserResponse>(`/api/users/${id}`);
    return res.data;
  },

  updateUser: async (id: string, data: Partial<User>): Promise<UserResponse> => {
    const res = await apiClient.put<UserResponse>(`/api/users/${id}`, data);
    return res.data;
  },

  activateUser: async (id: string): Promise<void> => {
    await apiClient.patch(`/api/users/${id}/activate`);
  },

  deactivateUser: async (id: string): Promise<void> => {
    await apiClient.patch(`/api/users/${id}/deactivate`);
  },
};
