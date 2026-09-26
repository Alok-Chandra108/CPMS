const crypto = require('crypto');
const ApiResponse = require('../utils/ApiResponse');

/**
 * CSRF Protection Middleware
 * Implements Double-Submit Cookie Pattern (OWASP recommended)
 * 
 * How it works:
 * 1. Server generates a random CSRF token and sets it in a cookie (JS-readable)
 * 2. Client reads the cookie and sends it back in a custom header (X-CSRF-Token)
 * 3. Server compares the cookie value with the header value using timing-safe comparison
 * 4. If they match, request is allowed; if not, 403 is returned
 * 
 * This pattern works because:
 * - Attacker cannot read the victim's cookie (Same-Origin Policy)
 * - Attacker cannot set the custom header cross-origin (CORS preflight)
 * - The cookie is automatically sent by browser, but header must be explicitly set
 */

// Paths that don't require CSRF protection (unauthenticated state-changing endpoints)
// These have no session to abuse - attacker can't trigger them as the victim
const CSRF_SAFE_PATHS = [
  '/auth/register',
  '/auth/verify-email',
  '/auth/resend-otp',
  '/auth/update-verify-email',
  '/auth/login',
  '/auth/admin-login',
  '/auth/forgot-password',
  '/auth/validate-reset-token',
  '/auth/reset-password',
  '/', // health check
];

// HTTP methods that don't require CSRF protection
const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

/**
 * Generate a cryptographically secure CSRF token
 * @returns {string} URL-safe base64 encoded token
 */
function generateCsrfToken() {
  // 32 bytes = 256 bits of entropy
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * Constant-time comparison to prevent timing attacks
 * @param {string} a - First token
 * @param {string} b - Second token
 * @returns {boolean} True if equal
 */
function timingSafeEqual(a, b) {
  // Use buffers for timing-safe comparison
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  
  if (bufferA.length !== bufferB.length) {
    return false;
  }
  
  return crypto.timingSafeEqual(bufferA, bufferB);
}

/**
 * Get cookie options based on environment
 * @returns {Object} Cookie options
 */
function getCookieOptions() {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    httpOnly: false, // MUST be false so JavaScript can read it
    secure: isProduction, // HTTPS only in production
    sameSite: isProduction ? 'none' : 'lax', // 'none' for cross-origin in prod
    path: '/',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    // partitioned: isProduction, // Partitioned cookies (Chrome 115+), optional
  };
}

/**
 * Check if a path is exempt from CSRF protection
 * @param {string} path - Request path
 * @returns {boolean} True if exempt
 */
function isCsrfExempt(path) {
  // Normalize path (remove query string)
  const normalizedPath = path.split('?')[0];
  
  return CSRF_SAFE_PATHS.some(exemptPath => {
    // Handle exact matches and prefix matches (e.g., /auth/login)
    if (exemptPath === normalizedPath) return true;
    // Handle parameterized routes like /auth/validate-reset-token/:token
    if (exemptPath.endsWith('/') && normalizedPath.startsWith(exemptPath)) return true;
    return false;
  });
}

/**
 * Middleware: Ensure CSRF cookie exists on every request
 * This runs first so even GET requests get a token
 */
function ensureCsrfCookie(req, res, next) {
  // Check if CSRF cookie already exists
  if (!req.cookies || !req.cookies.csrfToken) {
    // Generate new token and set cookie
    const token = generateCsrfToken();
    res.cookie('csrfToken', token, getCookieOptions());
    // Attach to request for immediate use (in case route needs it)
    req.csrfToken = token;
  } else {
    // Token exists, make it available
    req.csrfToken = req.cookies.csrfToken;
  }
  next();
}

/**
 * Middleware: Verify CSRF token on state-changing requests
 * Compares cookie value with X-CSRF-Token header
 */
function verifyCsrfToken(req, res, next) {
  // Skip for safe methods
  if (SAFE_METHODS.includes(req.method)) {
    return next();
  }
  
  // Skip for exempt paths
  if (isCsrfExempt(req.path)) {
    return next();
  }
  
  // Get token from cookie (set by ensureCsrfCookie or previous request)
  const cookieToken = req.cookies?.csrfToken;
  
  // Get token from header (sent by client)
  const headerToken = req.headers['x-csrf-token'] || req.headers['x-xsrf-token'];
  
  // If no cookie token, something is wrong - reject
  if (!cookieToken) {
    return ApiResponse.error(res, 'CSRF token missing from cookie', 403, {
      code: 'CSRF_TOKEN_MISSING',
    });
  }
  
  // If no header token, client didn't send it - reject
  if (!headerToken) {
    return ApiResponse.error(res, 'CSRF token header missing', 403, {
      code: 'CSRF_HEADER_MISSING',
    });
  }
  
  // Constant-time comparison
  if (!timingSafeEqual(cookieToken, headerToken)) {
    return ApiResponse.error(res, 'Invalid CSRF token', 403, {
      code: 'CSRF_TOKEN_INVALID',
    });
  }
  
  // Valid token
  next();
}

/**
 * Combined CSRF protection middleware
 * 1. Ensures CSRF cookie exists
 * 2. Verifies token on state-changing requests
 */
const csrfProtection = [ensureCsrfCookie, verifyCsrfToken];

module.exports = {
  csrfProtection,
  generateCsrfToken,
  timingSafeEqual,
  ensureCsrfCookie,
  verifyCsrfToken,
  isCsrfExempt,
  CSRF_SAFE_PATHS,
};
