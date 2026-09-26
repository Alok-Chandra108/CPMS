import axiosInstance from './axiosInstance';

// Register
export const registerUser = (data) =>
  axiosInstance.post('/auth/register', data);

// Verify Email
export const verifyEmail = (data) =>
  axiosInstance.post('/auth/verify-email', data);

// Update Verify Email
export const updateVerifyEmail = (data) =>
  axiosInstance.put('/auth/update-verify-email', data);

// Resend OTP
export const resendOTP = (data) =>
  axiosInstance.post('/auth/resend-otp', data);

// Login
export const loginUser = (data) =>
  axiosInstance.post('/auth/login', data);

// Admin Login
export const loginAdmin = (data) =>
  axiosInstance.post('/auth/admin-login', data);

// Refresh Token - no need to send refreshToken in body, httpOnly cookie sent automatically
export const refreshToken = () =>
  axiosInstance.post('/auth/refresh-token');

// Logout
export const logoutUser = () =>
  axiosInstance.post('/auth/logout');

// Forgot Password
export const forgotPassword = (data) =>
  axiosInstance.post('/auth/forgot-password', data);

// Reset Password
export const resetPassword = (data) =>
  axiosInstance.post('/auth/reset-password', data);

// Get current user
export const getMe = () =>
  axiosInstance.get('/auth/me');

// Verify Reset Token
export const validateResetToken = (data) =>
  axiosInstance.post('/auth/validate-reset-token', data);

// Admin Change Password
export const adminChangePassword = (data) =>
  axiosInstance.post('/auth/admin-change-password', data);
