import axiosInstance from './axiosInstance';

// Get Current Profile
export const getMyProfile = () =>
  axiosInstance.get('/profile/me');

// Update Current Profile
export const updateMyProfile = (data) =>
  axiosInstance.put('/profile/me', data);

// Upload Resume
export const uploadResume = (formData) =>
  axiosInstance.post('/profile/resume', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

// Delete Resume
export const deleteResume = () =>
  axiosInstance.delete('/profile/resume');
