import { apiClient } from './client';
import { CreateOrganizationDto, Organization } from '@/types/api';

function extractOrgArray(data: any): Organization[] {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.content)) return data.content;
  if (data && typeof data === 'object') {
    const list = Object.values(data).find((v) => Array.isArray(v));
    if (list) return list as Organization[];
  }
  return [];
}

export const organizationsApi = {
  createOrganization: async (data: CreateOrganizationDto): Promise<Organization> => {
    const res = await apiClient.post<Organization>('/organization/create', data);
    return res.data;
  },

  getAll: async (): Promise<Organization[]> => {
    const res = await apiClient.get<any>('/organization/all');
    return extractOrgArray(res.data);
  },

  getById: async (id: string): Promise<Organization> => {
    const res = await apiClient.get<Organization>(`/organization/${id}`);
    return res.data;
  },
};
