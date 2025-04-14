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

export const screenshotApi = {
  getSolution: async (formData: ImageType) => {
    const response = await apiFormClient.post(
      '/screenshot/generate-solution',
      formData,
    );
    return response.data;
  },
};
