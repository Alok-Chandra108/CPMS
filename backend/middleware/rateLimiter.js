const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const jwt = require('jsonwebtoken');

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Key generator for authenticated routes.
 *
 * Uses the authenticated user ID (from req.user or verified Authorization Bearer token).
 * Falls back to normalized client IP if unauthenticated.
 *
 * This resolves the "Campus Wi-Fi / Shared IP" trap:
 * Many students behind the same college NAT gateway share a single public IP.
 * Keying on user ID guarantees that students in the same lab do not share quotas.
 */
const getAuthenticatedKey = (req) => {
  // 1. If user object is already populated by auth middleware (verifyAccessToken)
  if (req.user && (req.user.id || req.user._id)) {
    return `user:${req.user.id || req.user._id}`;
  }

  // 2. If Bearer token is provided in Authorization header (e.g. global apiLimiter mounted before route auth)
  if (req.headers && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    const token = req.headers.authorization.split(' ')[1];
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        if (decoded && (decoded.id || decoded._id)) {
          return `user:${decoded.id || decoded._id}`;
        }
      } catch {
        // Expired or invalid tokens safely fall back to IP-based rate limiting
      }
    }
  }

  // 3. Fallback to client IP (handles IPv4 and IPv6 subnets correctly)
  return `ip:${ipKeyGenerator(req.ip || '127.0.0.1')}`;
};

/**
 * Key generator for public authentication routes (login, register, password reset).
 *
 * Combines client IP with normalized identifier (email, USN/roll number).
 *
 * Solves two problems:
 * 1. Prevents campus Wi-Fi lockouts: 50 students on the same IP logging into their own accounts
 *    have independent counters (e.g., "login:103.20.10.5:student1@mite.ac.in").
 * 2. Brute-force protection: Targeted guessing against a specific account from that IP
 *    is strictly throttled once the threshold is reached.
 */
const getPublicAuthKey = (prefix = 'auth') => {
  return (req) => {
    const rawIdentifier =
      req.body?.email ||
      req.body?.usnNumber ||
      req.body?.rollNumber ||
      req.body?.oldEmail ||
      '';

    const clientIp = ipKeyGenerator(req.ip || '127.0.0.1');

    if (typeof rawIdentifier === 'string' && rawIdentifier.trim().length > 0) {
      const normalizedIdentifier = rawIdentifier.trim().toLowerCase().slice(0, 100);
      return `${prefix}:${clientIp}:${normalizedIdentifier}`;
    }

    return `${prefix}:${clientIp}:anonymous`;
  };
};

/**
 * Strict rate limiter for login endpoints (prevent brute force)
 * Keys by compound (IP + normalized email/identifier)
 * 10 requests per 15 minutes in production (or 5000 in development)
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.LOGIN_RATE_LIMIT_MAX
    ? parseInt(process.env.LOGIN_RATE_LIMIT_MAX, 10)
    : (isProduction ? 10 : 5000),
  keyGenerator: getPublicAuthKey('login'),
  message: {
    success: false,
    message: 'Too many login attempts. Please try again in 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for registration (prevent abuse)
 * Keys by compound (IP + normalized email/USN)
 * 5 requests per 15 minutes in production (or 3000 in development)
 */
const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.REGISTER_RATE_LIMIT_MAX
    ? parseInt(process.env.REGISTER_RATE_LIMIT_MAX, 10)
    : (isProduction ? 5 : 3000),
  keyGenerator: getPublicAuthKey('register'),
  message: {
    success: false,
    message: 'Too many registration attempts. Please try again in 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for sensitive operations (forgot-password, reset-password, resend-otp)
 * Keys by compound (IP + normalized email/identifier)
 * 5 requests per hour in production (or 3000 in development)
 */
const sensitiveLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: process.env.SENSITIVE_RATE_LIMIT_MAX
    ? parseInt(process.env.SENSITIVE_RATE_LIMIT_MAX, 10)
    : (isProduction ? 5 : 3000),
  keyGenerator: getPublicAuthKey('sensitive'),
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * General rate limiter for all API routes
 * Keys by req.user.id (when authenticated) or client IP (when unauthenticated)
 * 500 requests per 15 minutes per user/IP
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  keyGenerator: getAuthenticatedKey,
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Dedicated rate limiter for authenticated routes (applied after verifyAccessToken)
 * 1000 requests per 15 minutes per student
 */
const authenticatedLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  keyGenerator: getAuthenticatedKey,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rapid-fire submission limiter for applying to drives
 * Prevents double-clicking or rapid scripted submissions during drive launch rush
 * Limits each student to 2 attempts per 10 seconds per drive
 */
const applyLimiter = rateLimit({
  windowMs: 10 * 1000, // 10 seconds window
  max: 2, // Max 2 attempts in 10 seconds
  keyGenerator: (req) => {
    const studentId = req.user?.id || req.user?._id || 'anon';
    const driveId = req.params?.driveId || 'any';
    return `apply:${studentId}:${driveId}`;
  },
  message: {
    success: false,
    message: 'You are submitting applications too quickly. Please wait a few seconds before trying again.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  loginLimiter,
  registerLimiter,
  sensitiveLimiter,
  apiLimiter,
  authenticatedLimiter,
  applyLimiter,
  getAuthenticatedKey,
  getPublicAuthKey,
};
