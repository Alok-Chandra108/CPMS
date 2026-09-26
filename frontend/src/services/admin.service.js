import axiosInstance from '../api/axiosInstance';

export const getDashboardStats = async () => {
  const response = await axiosInstance.get('/admin/stats');
  return response.data;
};
