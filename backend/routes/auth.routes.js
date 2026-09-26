const express = require('express');
const router = express.Router();
const {
  register,
  verifyEmail,
  resendOTP,
  updateVerifyEmail,
  login,
  adminLogin,
  logout,
  refreshTokenHandler,
  forgotPassword,
  validateResetToken,
  resetPassword,
  adminChangePassword,
} = require('../controllers/auth.controller');
const {
  registerValidation,
  loginValidation,
  verifyEmailValidation,
  resendOTPValidation,
  updateVerifyEmailValidation,
  forgotPasswordValidation,
  validateResetTokenValidation,
  resetPasswordValidation,
  adminChangePasswordValidation,
} = require('../validators/auth.validators');
const { verifyAccessToken } = require('../middleware/auth.middleware');
const { validateRequest } = require('../middleware/validateRequest.middleware');
const { loginLimiter, registerLimiter, sensitiveLimiter } = require('../middleware/rateLimiter');

// Public routes
router.post('/register', registerLimiter, registerValidation, validateRequest, register);
router.post('/verify-email', verifyEmailValidation, validateRequest, verifyEmail);
router.post('/resend-otp', sensitiveLimiter, resendOTPValidation, validateRequest, resendOTP);
router.put('/update-verify-email', sensitiveLimiter, updateVerifyEmailValidation, validateRequest, updateVerifyEmail);
router.post('/login', loginLimiter, loginValidation, validateRequest, login);
router.post('/admin-login', loginLimiter, loginValidation, validateRequest, adminLogin);
router.post('/refresh-token', loginLimiter, refreshTokenHandler);
router.post('/forgot-password', sensitiveLimiter, forgotPasswordValidation, validateRequest, forgotPassword);
router.post('/validate-reset-token', validateResetTokenValidation, validateRequest, validateResetToken);
router.post('/reset-password', sensitiveLimiter, resetPasswordValidation, validateRequest, resetPassword);

// Protected routes
router.post('/logout', verifyAccessToken, logout);
router.post('/admin-change-password', verifyAccessToken, adminChangePasswordValidation, validateRequest, adminChangePassword);

module.exports = router;
