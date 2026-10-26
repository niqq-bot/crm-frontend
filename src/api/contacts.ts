import { apiClient } from './client';
import { Contact, CreateContactDto } from '@/types/api';

function extractContactsArray(data: any): Contact[] {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.content)) return data.content;
  if (data && Array.isArray(data.contacts)) return data.contacts;
  if (data && typeof data === 'object') {
    const found = Object.values(data).find((v) => Array.isArray(v));
    if (found) return found as Contact[];
  }
  return [];
}

export const contactsApi = {
  createContact: async (data: CreateContactDto): Promise<Contact> => {
    const res = await apiClient.post<Contact>('/contact/create', data);
    return res.data;
  },

  getContactById: async (id: string): Promise<Contact> => {
    const res = await apiClient.get<Contact>(`/contact/${id}`);
    return res.data;
  },

  updateContact: async (id: string, data: CreateContactDto): Promise<Contact> => {
    const res = await apiClient.put<Contact>(`/contact/${id}`, data);
    return res.data;
  },

  deleteContact: async (id: string): Promise<void> => {
    await apiClient.delete(`/contact/${id}`);
  },

  getByOwner: async (): Promise<Contact[]> => {
    const res = await apiClient.get<any>('/contact/owner/');
    return extractContactsArray(res.data);
  },

  getByOrganization: async (orgId: string): Promise<Contact[]> => {
    const res = await apiClient.get<any>(`/contact/org/${orgId}/`);
    return extractContactsArray(res.data);
  },

  importContacts: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post<string>('/contact/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  exportContacts: async (): Promise<Blob> => {
    const res = await apiClient.get('/contact/export', {
      responseType: 'blob',
    });
    return res.data;
  },
};
