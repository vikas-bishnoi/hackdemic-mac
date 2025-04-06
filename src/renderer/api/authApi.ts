import { apiClient } from './axios';

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name: string;
}

export const authApi = {
  authenticate: async () => {
    const response = await apiClient.get('/auth/authenticate');
    return response.data;
  },
  login: async (formData: LoginCredentials) => {
    const response = await apiClient.post('/auth/login', formData);
    return response.data;
  },
  logout: async () => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  },
};
