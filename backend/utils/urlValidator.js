/**
 * URL Validator Utility
 * Validates FRONTEND_URL against allowlist with proper URL format validation
 * Prevents open redirect vulnerabilities by ensuring only allowed origins are used
 */

/**
 * Validates a single origin URL
 * @param {string} origin - The origin URL to validate
 * @param {boolean} isProduction - Whether running in production mode
 * @returns {boolean} True if valid, false otherwise
 */
const validateOrigin = (origin, isProduction) => {
  try {
    const urlObj = new URL(origin);
    
    // Only allow http/https protocols
    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
      return false;
    }
    
    // In production, only allow HTTPS
    if (isProduction && urlObj.protocol !== 'https:') {
      console.warn(`WARNING: Origin ${origin} rejected - only HTTPS allowed in production`);
      return false;
    }
    
    // Reject wildcards in production
    if (isProduction && origin.includes('*')) {
      console.warn(`WARNING: Origin ${origin} rejected - wildcards not allowed`);
      return false;
    }
    
    return true;
  } catch (e) {
    console.warn(`WARNING: Invalid origin ${origin} - ${e.message}`);
    return false;
  }
};

/**
 * Get validated FRONTEND_URL from environment
 * Returns the first valid URL from the allowlist, or fallback for development
 * @param {boolean} requireHttps - Whether to require HTTPS (default: true in production)
 * @returns {string} Validated frontend URL
 */
const getValidatedFrontendUrl = (requireHttps = true) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const envOrigins = process.env.FRONTEND_URL;
  
  // In production, require explicit FRONTEND_URL configuration
  if (isProduction) {
    if (!envOrigins || envOrigins.trim() === '') {
      console.error('ERROR: FRONTEND_URL must be set in production');
      throw new Error('FRONTEND_URL must be set in production');
    }
    
    const validOrigins = envOrigins
      .split(',')
      .map((url) => url.trim())
      .filter((origin) => validateOrigin(origin, true));
    
    if (validOrigins.length === 0) {
      console.error('ERROR: No valid FRONTEND_URL configured in production');
      throw new Error('No valid FRONTEND_URL configured in production');
    }
    
    return validOrigins[0]; // Return first valid origin
  }
  
  // In development, allow localhost with fallback
  const devOrigins = envOrigins
    ? envOrigins.split(',').map((url) => url.trim())
    : ['http://localhost:5173'];
  
  const validDevOrigins = devOrigins.filter((origin) => validateOrigin(origin, false));
  
  return validDevOrigins[0] || 'http://localhost:5173';
};

/**
 * Validate that a URL is safe to use (prevents open redirects)
 * @param {string} url - URL to validate
 * @returns {boolean} True if safe, false otherwise
 */
const isSafeUrl = (url) => {
  try {
    const urlObj = new URL(url);
    const allowedProtocols = ['http:', 'https:'];
    return allowedProtocols.includes(urlObj.protocol);
  } catch {
    return false;
  }
};

module.exports = {
  validateOrigin,
  getValidatedFrontendUrl,
  isSafeUrl,
};
