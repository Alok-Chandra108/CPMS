import api from './axiosInstance';

export const applyToDrive = async (driveId) => {
  const response = await api.post(`/applications/apply/${driveId}`);
  return response.data;
};

export const getMyApplications = async () => {
  const response = await api.get('/applications/my-applications');
  return response.data;
};

// Admin Endpoints
export const getDriveApplications = async (driveId) => {
  const response = await api.get(`/applications/drive/${driveId}`);
  return response.data;
};

export const updateApplicationStatus = async (applicationId, data) => {
  const response = await api.patch(`/applications/${applicationId}/status`, data);
  return response.data;
};

export const updateBulkApplicationStatus = async (applicationIds, status, remarks) => {
  const response = await api.patch(`/applications/bulk-status`, { applicationIds, status, remarks });
  return response.data;
};

// ── ML Feature: Resume Diagnostic ATS ────────────────────────────────────────
export const analyzeResume = async (resumeFile, jobDescriptionText) => {
  // Security: File type validation on the client side before sending to server
  if (!resumeFile || resumeFile.type !== 'application/pdf') {
    throw new Error('Only PDF files are permitted for analysis.');
  }
  // Security: File size check (2MB limit to match backend)
  const MAX_SIZE = 2 * 1024 * 1024;
  if (resumeFile.size > MAX_SIZE) {
    throw new Error('File size must not exceed 2MB.');
  }

  const formData = new FormData();
  formData.append('resume', resumeFile);
  formData.append('jobDescriptionText', jobDescriptionText);

  // The axiosInstance automatically attaches JWT (Authorization header)
  // and CSRF token from the Redux store — no manual token handling needed.
  const response = await api.post('/applications/diagnostic', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};
