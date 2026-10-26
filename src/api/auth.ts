import { apiClient } from './client';
import {
  AuthResponse,
  RegisterInviteRequest,
  User,
} from '@/types/api';

export interface LoginParams {
  email: string;
  password?: string;
}

export interface RegisterParams {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
}

export interface ChangePasswordParams {
  password?: string;
  repeatPassword?: string;
}

export const authApi = {
  login: async (data: LoginParams): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>('/auth/login', data);
    return res.data;
  },

  register: async (data: RegisterParams): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>('/auth/register', data);
    return res.data;
  },

  getMe: async (): Promise<User> => {
    const res = await apiClient.get<User>('/auth/me');
    return res.data;
  },

  verifyMail: async (email: string): Promise<string> => {
    const res = await apiClient.post<string>(`/auth/forgotPassword/verifyMail/${encodeURIComponent(email)}`);
    return res.data;
  },

  verifyOtp: async (email: string, otp: number): Promise<string> => {
    const res = await apiClient.post<string>(
      `/auth/forgotPassword/verifyOTP/${encodeURIComponent(email)}/${otp}`
    );
    return res.data;
  },

  changePassword: async (email: string, data: ChangePasswordParams): Promise<string> => {
    const res = await apiClient.post<string>(
      `/auth/forgotPassword/changePassword/${encodeURIComponent(email)}`,
      data
    );
    return res.data;
  },

  registerInvite: async (
    token: string,
    data: RegisterInviteRequest
  ) => {
    const response = await apiClient.post(
      `/auth/register-invite/${encodeURIComponent(token)}`,
      data
    );

    return response.data;
  },
};
