const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/User.model');
const Admin = require('../models/Admin.model');
const OTP = require('../models/OTP.model');
const generateOTP = require('../utils/generateOTP');
const ApiResponse = require('../utils/ApiResponse');
const { sendOTPEmail, sendResetEmail, sendAdminOTPEmail } = require('../services/email.service');
const { addToBlacklist, isBlacklisted } = require('../services/tokenBlacklist.service');
const { ROLES } = require('../constants/roles');
const { getValidatedFrontendUrl } = require('../utils/urlValidator');
const { logger } = require('../config/logger');

// Generate a dummy hash at module load time for timing-safe comparisons
// This prevents timing attacks that could reveal if an admin exists
const DUMMY_HASH = bcrypt.hashSync('dummy_password_for_timing_safety', 10);

const { EMAIL_REGEX } = require('../constants/validation');

/**
 * POST /api/auth/register
 * Register a new student account
 */
const register = async (req, res, next) => {
  try {

    const { fullName, email, usnNumber, department, yearOfStudy, password } = req.body;

    // Validate email format
    if (!email || !EMAIL_REGEX.test(email)) {
      return ApiResponse.error(res, 'Please provide a valid email address', 400);
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return ApiResponse.error(res, 'An account with this email already exists', 409);
    }

    // Check if USN record already exists
    const existingUSN = await User.findOne({ usnNumber: usnNumber.toUpperCase() });
    if (existingUSN) {
      return ApiResponse.error(res, 'This USN Number is already registered', 409);
    }

    // Create user
    const user = await User.create({
      fullName,
      email,
      usnNumber: usnNumber.toUpperCase(),
      department,
      yearOfStudy,
      password,
      role: ROLES.STUDENT,
      isVerified: false,
    });

    // Generate OTP
    const otp = generateOTP();

    // Atomic upsert: replace any existing OTP for this email with new one (prevents race condition)
    const otpRecord = await OTP.findOneAndUpdate(
      { email },
      {
        email,
        otp,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        attempts: 0,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Send OTP email
    try {
      await sendOTPEmail(fullName, email, otp);
    } catch (emailError) {
      // Delete the newly created user and OTP so they can try again
      await User.deleteOne({ _id: user._id });
      await OTP.deleteMany({ email });
      return ApiResponse.error(
        res,
        `Failed to send verification email: ${emailError.message}.`,
        500
      );
    }

    return ApiResponse.success(
      res,
      'Account created successfully. Please verify your email.',
      { email: user.email },
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/verify-email
 * Verify email with OTP
 */
const verifyEmail = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    // Validate email format
    if (!email || !EMAIL_REGEX.test(email)) {
      return ApiResponse.error(res, 'Please provide a valid email address', 400);
    }

    // Find OTP record
    const otpRecord = await OTP.findOne({ email });

    if (!otpRecord) {
      return ApiResponse.error(res, 'OTP not found or has expired. Please request a new one.', 400);
    }

    // Check if max attempts exceeded
    if (otpRecord.attempts >= 5) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return ApiResponse.error(res, 'Too many wrong attempts. Please request a new OTP.', 400);
    }

    // Check if expired
    if (otpRecord.expiresAt < new Date()) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return ApiResponse.error(res, 'OTP has expired. Please request a new one.', 400);
    }

    // Compare OTP
    const isMatch = await otpRecord.compareOTP(otp);

    if (!isMatch) {
      // Increment attempts
      otpRecord.attempts += 1;
      await otpRecord.save();
      return ApiResponse.error(res, 'Invalid OTP. Please try again.', 400);
    }

    // Update user as verified
    await User.findOneAndUpdate({ email }, { isVerified: true });

    // Delete OTP record
    await OTP.deleteOne({ _id: otpRecord._id });

    return ApiResponse.success(res, 'Email verified successfully. You can now log in.');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/resend-otp
 * Resend OTP for email verification
 */
const resendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Validate email format
    if (!email || !EMAIL_REGEX.test(email)) {
      return ApiResponse.error(res, 'Please provide a valid email address', 400);
    }

    // Check if user exists and is not verified
    const user = await User.findOne({ email });

    if (!user) {
      return ApiResponse.error(res, 'No account found with this email', 404);
    }

    if (user.isVerified) {
      return ApiResponse.error(res, 'Email is already verified', 400);
    }

    // Delete old OTP
    // Atomic upsert: replace any existing OTP for this email with new one (prevents race condition)
    const otp = generateOTP();

    const otpRecord = await OTP.findOneAndUpdate(
      { email },
      {
        email,
        otp,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        attempts: 0,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Send OTP email
    try {
      await sendOTPEmail(user.fullName, email, otp);
    } catch (emailError) {
      return ApiResponse.error(
        res,
        `Failed to resend OTP: ${emailError.message}.`,
        500
      );
    }

    return ApiResponse.success(res, 'OTP has been resent to your email.');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/login
 * Login with email and password
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate email format
    if (!email || !EMAIL_REGEX.test(email)) {
      return ApiResponse.error(res, 'Please provide a valid email address', 400);
    }

    const sanitizedEmail = email.trim().toLowerCase();

    // Find ONLY in user collection (Students/HR)
    const user = await User.findOne({ email: sanitizedEmail });

    if (!user) {
      logger.warn({ event: 'login_failed', email: sanitizedEmail, reason: 'user_not_found' }, 'Login failed: user not found');
      return ApiResponse.error(res, 'Incorrect email or password', 401);
    }

    // Check if verified
    if (!user.isVerified) {
      return ApiResponse.error(
        res,
        'Please verify your email before logging in.',
        403,
        { needsVerification: true, email: user.email }
      );
    }

    // Compare password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      logger.warn({ event: 'login_failed', email: sanitizedEmail, reason: 'invalid_password', userId: user._id }, 'Login failed: invalid password');
      return ApiResponse.error(res, 'Incorrect email or password', 401);
    }

    // Generate tokens
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // Store hashed refresh token
    const hashedRefreshToken = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    user.refreshToken = hashedRefreshToken;
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // Set refresh token in httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      partitioned: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    const payloadUser = {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      department: user.department,
      usnNumber: user.usnNumber,
      yearOfStudy: user.yearOfStudy,
    };

    logger.info({ event: 'login_success', userId: user._id, email: user.email, role: user.role }, 'User login successful');

    return ApiResponse.success(res, 'Login successful', {
      accessToken,
      refreshToken,
      user: payloadUser,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/admin-login
 * Validates admin credentials and logs in directly.
 */
const adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate email format
    if (!email || !EMAIL_REGEX.test(email)) {
      return ApiResponse.error(res, 'Please provide a valid email address', 400);
    }

    const sanitizedEmail = email.trim().toLowerCase();

    // Find ONLY in Admin collection
    const admin = await Admin.findOne({ email: sanitizedEmail });

    // Timing-safe: always compare even if admin not found (use dummy hash)
    // This prevents timing attacks that could reveal if an admin account exists
    let isMatch = false;
    if (admin) {
      isMatch = await admin.comparePassword(password);
    } else {
      // Use pre-generated dummy hash to ensure consistent timing
      await bcrypt.compare(password, DUMMY_HASH);
    }

    if (!admin || !isMatch) {
      logger.warn({ event: 'login_failed', email: sanitizedEmail, reason: admin ? 'invalid_password' : 'user_not_found', role: 'admin' }, 'Admin login failed');
      return ApiResponse.error(res, 'Incorrect email or password', 401);
    }

    // Generate tokens
    const accessToken = admin.generateAccessToken();
    const refreshToken = admin.generateRefreshToken();

    const hashedRefreshToken = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    admin.refreshToken = hashedRefreshToken;
    admin.lastLogin = new Date();
    await admin.save({ validateBeforeSave: false });

    // Set refresh token in httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      partitioned: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    const payloadAdmin = {
      _id: admin._id,
      fullName: admin.fullName,
      email: admin.email,
      role: admin.role,
      mustChangePassword: admin.mustChangePassword,
    };

    logger.info({ event: 'login_success', userId: admin._id, email: admin.email, role: admin.role }, 'Admin login successful');

    return ApiResponse.success(res, 'Admin login successful', {
      accessToken,
      refreshToken,
      user: payloadAdmin,
    });
  } catch (error) {
    next(error);
  }
};



/**
 * POST /api/auth/logout
 * Logout — clear refresh token
 */
const logout = async (req, res, next) => {
  try {
    // Extract refresh token (same logic as refreshTokenHandler)
    const token = req.body?.refreshToken || req.cookies?.refreshToken;

    // If token exists, blacklist it
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
        const tokenHash = crypto
          .createHash('sha256')
          .update(token)
          .digest('hex');

        // Add to blacklist with remaining TTL
        await addToBlacklist(tokenHash, decoded.exp);
      } catch (err) {
        // Token invalid/expired - ignore and continue with logout
        logger.warn({ err, message: 'Token verification failed during logout' }, 'Logout: token verification failed');
      }
    }

    // Clear refresh token from user document
    const user = await User.findByIdAndUpdate(req.user._id, {
      refreshToken: null,
    });

    if (!user) {
      await Admin.findByIdAndUpdate(req.user._id, {
        refreshToken: null,
      });
    }

    // Clear cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });

    return ApiResponse.success(res, 'Logged out successfully');
  } catch (error) {

    return ApiResponse.error(res, 'Logout failed', 500);
  }
};

/**
 * POST /api/auth/refresh-token
 * Refresh access token using the httpOnly cookie
 */
const refreshTokenHandler = async (req, res, next) => {
  try {
    // Accept refresh token from request body (cross-domain) or cookie (same-domain fallback)
    const token = req.body?.refreshToken || req.cookies?.refreshToken;

    if (!token) {
      return ApiResponse.error(res, 'Refresh token not found', 401);
    }

    // Verify JWT
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      return ApiResponse.error(res, 'Invalid or expired refresh token', 401);
    }

    // Check if token is blacklisted (revoked)
    const tokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const blacklisted = await isBlacklisted(tokenHash);
    if (blacklisted) {
      return ApiResponse.error(res, 'Token has been revoked', 401);
    }

    // Find user and compare stored hash
    let user = await User.findById(decoded.id);

    if (!user) {
      user = await Admin.findById(decoded.id);
    }

    if (!user || !user.refreshToken) {
      return ApiResponse.error(res, 'Invalid refresh token', 401);
    }

    if (tokenHash !== user.refreshToken) {
      return ApiResponse.error(res, 'Refresh token mismatch', 401);
    }

    // --- Token Rotation ---
    // Add old token to blacklist before issuing new ones
    await addToBlacklist(tokenHash, decoded.exp);

    // Issue new access token AND new refresh token (old one is invalidated)
    const newAccessToken = user.generateAccessToken();
    const newRefreshToken = user.generateRefreshToken();

    const newHashedRefreshToken = crypto
      .createHash('sha256')
      .update(newRefreshToken)
      .digest('hex');

    user.refreshToken = newHashedRefreshToken;
    await user.save({ validateBeforeSave: false });

    // Set new refresh token in cookie (same-domain fallback)
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      partitioned: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    let payloadUser = {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    };

    if (user.role === ROLES.STUDENT) {
      payloadUser = {
        ...payloadUser,
        department: user.department,
        usnNumber: user.usnNumber,
        yearOfStudy: user.yearOfStudy,
      };
    }

    return ApiResponse.success(res, 'Token refreshed', {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: payloadUser,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/forgot-password
 * Send password reset link
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Email format validation using shared regex
    if (!email || !EMAIL_REGEX.test(email)) {
      return ApiResponse.error(res, 'Please provide a valid email address', 400);
    }

    const sanitizedEmail = email.trim().toLowerCase();

    // ALWAYS return 200 — never confirm if email exists (security)
    const genericMessage = 'If an account with this email exists, a reset link has been sent.';

    let user = await Admin.findOne({ email: sanitizedEmail });

    if (!user) {
      user = await User.findOne({ email: sanitizedEmail });
    }

    if (!user) {
      return ApiResponse.success(res, genericMessage);
    }

    // Generate reset token
    const rawToken = crypto.randomBytes(32).toString('hex');

    // Hash and store token with expiry
    const hashedToken = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    await user.save({ validateBeforeSave: false });

    // Build reset URL
    const frontendUrl = getValidatedFrontendUrl();
    const resetURL = `${frontendUrl}/reset-password/${rawToken}`;



    // Send email
    try {
      await sendResetEmail(user.fullName, sanitizedEmail, resetURL);
    } catch (emailError) {
      return ApiResponse.error(
        res,
        `Failed to send password reset email: ${emailError.message}.`,
        500
      );
    }

    return ApiResponse.success(res, genericMessage);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/validate-reset-token
 * Check if a reset token is valid
 */
const validateResetToken = async (req, res, next) => {
  try {
    const { token } = req.body;

    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    let user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpiry: { $gt: Date.now() },
    });

    if (!user) {
      user = await Admin.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpiry: { $gt: Date.now() },
      });
    }

    if (!user) {
      return ApiResponse.error(res, 'Invalid or expired reset link', 400, { valid: false });
    }

    return ApiResponse.success(res, 'Token is valid', { valid: true, role: user.role });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/reset-password
 * Reset password using token
 */
const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user with valid token FIRST - before any modifications
    let user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpiry: { $gt: Date.now() },
    });

    if (!user) {
      user = await Admin.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpiry: { $gt: Date.now() },
      });
    }

    if (!user) {
      return ApiResponse.error(res, 'Invalid or expired reset link', 400);
    }

    // SECURITY FIX: Immediately invalidate the token to prevent replay attacks
    // This ensures one-time-use semantics - token is cleared BEFORE password update
    // If save fails, token remains valid; if save succeeds, token is permanently consumed
    user.resetPasswordToken = null;
    user.resetPasswordExpiry = null;

    // Update password (will be hashed by pre-save hook)
    user.password = newPassword;
    user.refreshToken = null; // Invalidate all sessions
    await user.save();

    return ApiResponse.success(res, 'Password updated successfully. You can now log in.');
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/auth/update-verify-email
 * Update email for unverified user and send new OTP
 */
const updateVerifyEmail = async (req, res, next) => {
  try {
    const { oldEmail, newEmail } = req.body;

    // Check if new email is already in use by a VERIFIED user
    const existingVerifiedUser = await User.findOne({ email: newEmail, isVerified: true });
    if (existingVerifiedUser) {
      return ApiResponse.error(res, 'An account with this email already exists and is verified', 409);
    }

    // Find the unverified user with old email
    const user = await User.findOne({ email: oldEmail, isVerified: false });
    if (!user) {
      return ApiResponse.error(res, 'Unverified account with the old email not found', 404);
    }

    // Update user's email
    user.email = newEmail;
    await user.save();

    // Delete any existing OTPs for both emails to save storage
    await OTP.deleteMany({ email: { $in: [oldEmail, newEmail] } });

    // Generate and send new OTP
    const otp = generateOTP();
    await OTP.create({
      email: newEmail,
      otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    try {
      await sendOTPEmail(user.fullName, newEmail, otp);
    } catch (emailError) {
      // Roll back: revert email so the user can retry
      user.email = oldEmail;
      await user.save();
      await OTP.deleteMany({ email: newEmail });
      return ApiResponse.error(
        res,
        `Failed to send verification email: ${emailError.message}. Please try again later.`,
        500
      );
    }

    return ApiResponse.success(res, 'Email updated and new OTP sent.', { email: newEmail });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/admin-change-password
 * Allows a logged-in admin (who has mustChangePassword: true) to change their password
 */
const adminChangePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Fetch fresh Admin document
    const admin = await Admin.findById(req.user._id);
    if (!admin) {
      return ApiResponse.error(res, 'Admin account not found', 404);
    }

    // Verify current password
    const isMatch = await admin.comparePassword(currentPassword);
    if (!isMatch) {
      return ApiResponse.error(res, 'Incorrect current password', 400);
    }

    // Make sure new password is not the same
    const isSame = await admin.comparePassword(newPassword);
    if (isSame) {
      return ApiResponse.error(res, 'New password must be different from current password', 400);
    }

    // Update password
    admin.password = newPassword;
    admin.mustChangePassword = false;
    admin.refreshToken = null; // Invalidate refresh token for security
    await admin.save();

    return ApiResponse.success(res, 'Password changed successfully. Please log in again.');
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};
