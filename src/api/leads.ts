import { apiClient } from './client';
import {
  CreateLeadRequest,
  Lead,
  MailBody,
  UpdateLeadRequest,
} from '@/types/api';

export const leadsApi = {
  listAllLeads: async (): Promise<Lead[]> => {
    const res = await apiClient.get<any>('/api/leads');
    if (Array.isArray(res.data)) {
      return res.data;
    }
    if (res.data && Array.isArray(res.data.content)) {
      return res.data.content;
    }
    if (res.data && Array.isArray(res.data.leads)) {
      return res.data.leads;
    }
    if (res.data && typeof res.data === 'object') {
      const arrayVal = Object.values(res.data).find((val) => Array.isArray(val));
      if (arrayVal) return arrayVal as Lead[];
    }
    return [];
  },

  getLeadById: async (id: string): Promise<Lead> => {
    const res = await apiClient.get<Lead>(`/api/leads/${id}`);
    return res.data;
  },

  createLead: async (data: CreateLeadRequest): Promise<Lead> => {
    const res = await apiClient.post<Lead>('/api/leads', data);
    return res.data;
  },

  updateLead: async (data: UpdateLeadRequest): Promise<Lead> => {
    // Note: In OpenAPI, PUT is to /api/leads with body UpdateLeadRequest containing leadId
    const res = await apiClient.put<Lead>('/api/leads', data);
    return res.data;
  },

  deleteLead: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/leads/${id}`);
  },

  convertToContact: async (id: string): Promise<string> => {
    const res = await apiClient.post<string>(`/api/leads/${id}/convert-to-contact`);
    return res.data;
  },

  sendMail: async (data: MailBody): Promise<string> => {
    const res = await apiClient.post<string>('/api/leads/send-mail', data);
    return res.data;
  },
};
