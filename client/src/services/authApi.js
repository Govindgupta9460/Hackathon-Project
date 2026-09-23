import axiosInstance from '../api/axiosInstance';

export const authApi = {
  // POST /api/auth/register
  register: async (userData) => {
    const response = await axiosInstance.post('/auth/register', userData);
    return response.data;
  },

  // POST /api/auth/login
  login: async (credentials) => {
    const response = await axiosInstance.post('/auth/login', credentials);
    return response.data;
  },

  // GET /api/auth/me
  getProfile: async () => {
    const response = await axiosInstance.get('/auth/me');
    return response.data;
  }
};
