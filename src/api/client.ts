import axios, { AxiosError } from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://3.85.210.31:8000';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for Bearer token (strips duplicate 'Bearer ' prefix if present)
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('crm_token');
    if (token && config.headers) {
      const cleanToken = token.startsWith('Bearer ') ? token.slice(7).trim() : token.trim();
      config.headers.Authorization = `Bearer ${cleanToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for token expiry and error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string; error?: string }>) => {
    if (error.response?.status === 401) {
      // Don't redirect if we are already on an auth page
      const path = window.location.pathname;
      const isAuthPage =
        path.startsWith('/login') ||
        path.startsWith('/register') ||
        path.startsWith('/forgot-password') ||
        path.startsWith('/reset-password') ||
        path.startsWith('/invite');

      if (!isAuthPage) {
        localStorage.removeItem('crm_token');
        localStorage.removeItem('crm_user');
        window.location.href = '/login?session_expired=true';
      }
    }
    return Promise.reject(error);
  }
);

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (typeof data === 'string' && data.length > 0) return data;
    if (typeof data === 'object' && data !== null) {
      if ('message' in data && typeof data.message === 'string') return data.message;
      if ('error' in data && typeof data.error === 'string') return data.error;
    }
    if (error.response?.statusText) {
      return `${error.response.status}: ${error.response.statusText}`;
    }
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}
