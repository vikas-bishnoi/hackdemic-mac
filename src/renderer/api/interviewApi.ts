import { apiFormClient, apiClient } from './axios';

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface ImageType {
  image: Blob | File;
}

export const interviewApi = {
  getSolution: async (formData: ImageType) => {
    const response = await apiFormClient.post(
      '/interview/generate-solution',
      formData,
    );
    return response.data;
  },
  logout: async () => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  },
};
