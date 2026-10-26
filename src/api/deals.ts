import { apiClient } from './client';
import { CreateDealDto, DealDto, UpdateDealDto } from '@/types/api';

export const dealsApi = {
  getAllDeals: async (): Promise<DealDto[]> => {
    const res = await apiClient.get<DealDto[]>('/api/deals');
    if (Array.isArray(res.data)) {
      return res.data;
    }
    if (res.data && Array.isArray((res.data as any).content)) {
      return (res.data as any).content;
    }
    return [];
  },

  getDealById: async (id: string): Promise<DealDto> => {
    const res = await apiClient.get<DealDto>(`/api/deals/${id}`);
    return res.data;
  },

  createDeal: async (data: CreateDealDto): Promise<DealDto> => {
    const res = await apiClient.post<DealDto>('/api/deals', data);
    return res.data;
  },

  updateDeal: async (id: string, data: UpdateDealDto): Promise<DealDto> => {
    const res = await apiClient.put<DealDto>(`/api/deals/${id}`, data);
    return res.data;
  },

  deleteDeal: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/deals/${id}`);
  },
};
