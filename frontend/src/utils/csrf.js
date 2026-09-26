/**
 * CSRF Token Utilities for Frontend
 * 
 * Handles reading the CSRF token from cookies and determining
 * when to include it in requests.
 * 
 * The CSRF token is set by the backend as a JavaScript-readable cookie
 * (httpOnly: false, sameSite: lax/none). The frontend reads this cookie
 * and includes it in the X-CSRF-Token header for state-changing requests.
 */

// Endpoints that don't require CSRF protection (mirror backend CSRF_SAFE_PATHS)
// These are unauthenticated state-changing endpoints
const CSRF_SAFE_ENDPOINTS = [
  '/auth/register',
  '/auth/verify-email',
  '/auth/resend-otp',
  '/auth/update-verify-email',
  '/auth/login',
  '/auth/admin-login',
  '/auth/forgot-password',
  '/auth/validate-reset-token',
  '/auth/reset-password',
];

// HTTP methods that require CSRF protection
const CSRF_PROTECTED_METHODS = ['post', 'put', 'patch', 'delete'];

/**
 * Read CSRF token from document.cookie
 * @returns {string|null} CSRF token or null if not found
 */
export function getCsrfToken() {
  // document.cookie contains all cookies as a string: "name=value; name2=value2"
  const cookies = document.cookie.split(';');
  
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'csrfToken') {
      return decodeURIComponent(value);
    }
  }
  
  return null;
}

/**
 * Check if a request should include CSRF token
 * @param {string} method - HTTP method (lowercase)
 * @param {string} url - Request URL (path + query)
 * @returns {boolean} True if CSRF token should be included
 */
export function shouldIncludeCsrfToken(method, url) {
  const lowerMethod = method.toLowerCase();
  
  // Only protect state-changing methods
  if (!CSRF_PROTECTED_METHODS.includes(lowerMethod)) {
    return false;
  }
  
  // Extract path from URL (remove query string, handle full URLs)
  let path;
  try {
    // Handle both relative and absolute URLs
    const urlObj = new URL(url, window.location.origin);
    path = urlObj.pathname;
  } catch {
    // If URL parsing fails, assume it's a relative path
    path = url.split('?')[0];
  }
  
  // Check if path matches any exempt endpoint
  const isExempt = CSRF_SAFE_ENDPOINTS.some(endpoint => {
    // Exact match or prefix match (for parameterized routes)
    if (endpoint === path) return true;
    if (endpoint.endsWith('/') && path.startsWith(endpoint)) return true;
    return false;
  });
  
  return !isExempt;
}

/**
 * Get CSRF header object if token should be included
 * @param {string} method - HTTP method
 * @param {string} url - Request URL
 * @returns {Object|null} Headers object with X-CSRF-Token or null
 */
export function getCsrfHeaders(method, url) {
  if (!shouldIncludeCsrfToken(method, url)) {
    return null;
  }
  
  const token = getCsrfToken();
  
  if (!token) {
    console.warn('CSRF token not found in cookies. State-changing request may fail.');
    return null;
  }
  
  return {
    'X-CSRF-Token': token,
  };
}

export { CSRF_SAFE_ENDPOINTS, CSRF_PROTECTED_METHODS };
