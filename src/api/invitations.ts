import { apiClient } from './client';
import {
  CreateOrganizationInviteRequest,
  OrganizationInviteResponse,
  ValidateOrganizationInviteResponse,
} from '@/types/api';

export const invitationsApi = {
  createInvite: async (
    data: CreateOrganizationInviteRequest
  ): Promise<OrganizationInviteResponse> => {
    const res = await apiClient.post<OrganizationInviteResponse>(
      '/api/organization/invites',
      data
    );
    return res.data;
  },

  validateInvite: async (
    token: string
  ): Promise<ValidateOrganizationInviteResponse> => {
    const res = await apiClient.get<ValidateOrganizationInviteResponse>(
      `/api/organization/invites/${encodeURIComponent(token)}`
    );
    return res.data;
  },
};
