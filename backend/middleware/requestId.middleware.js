const crypto = require('crypto');
const { logger } = require('../config/logger');

/**
 * Request ID Middleware
 * Generates and propagates X-Request-ID header for distributed tracing
 * 
 * Features:
 * - Generates cryptographically secure UUID v4 if not provided by client
 * - Echoes client-provided X-Request-ID header (for trace continuity)
 * - Attaches request ID to req.id for downstream use
 * - Adds X-Request-ID to response headers for client-side tracing
 * - Includes request ID in error logs for traceability
 */

/**
 * Generate a cryptographically secure UUID v4
 * @returns {string} RFC 4122 compliant UUID v4
 */
function generateRequestId() {
  // Generate 16 random bytes (128 bits)
  const bytes = crypto.randomBytes(16);

  // Set version (4) and variant bits per RFC 4122
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // Version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variant 10

  // Convert to UUID string format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  const hex = bytes.toString('hex');
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32)
  ].join('-');
}

/**
 * Validate client-provided request ID format
 * Accepts UUID v4 or any alphanumeric string up to 64 chars
 * @param {string} id - Client-provided request ID
 * @returns {boolean} True if valid format
 */
function isValidRequestId(id) {
  if (!id || typeof id !== 'string') return false;
  if (id.length > 64) return false;

  // Accept UUID v4 format or alphanumeric with hyphens/underscores
  const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const alphanumericRegex = /^[a-zA-Z0-9_-]+$/;

  return uuidV4Regex.test(id) || alphanumericRegex.test(id);
}

/**
 * Extract request ID from incoming headers
 * Supports multiple header formats for compatibility
 * @param {Object} req - Express request object
 * @returns {string|null} Request ID from headers or null
 */
function extractRequestIdFromHeaders(req) {
  // Check standard header first (W3C Trace Context compatible)
  if (req.headers['x-request-id']) return req.headers['x-request-id'];

  // Check alternative headers (for compatibility with various tracing systems)
  if (req.headers['x-correlation-id']) return req.headers['x-correlation-id'];
  if (req.headers['x-trace-id']) return req.headers['x-trace-id'];
  if (req.headers['request-id']) return req.headers['request-id'];
  if (req.headers['correlation-id']) return req.headers['correlation-id'];

  // Check W3C traceparent header (trace-id part)
  if (req.headers['traceparent']) {
    const traceparent = req.headers['traceparent'];
    // Format: version-trace-id-parent-id-flags
    const parts = traceparent.split('-');
    if (parts.length >= 2 && parts[1].length === 32) {
      return parts[1]; // Return trace-id
    }
  }

  return null;
}

/**
 * Request ID Middleware
 * Adds request ID to request and response for distributed tracing
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
function requestIdMiddleware(req, res, next) {
  // Extract or generate request ID
  const clientRequestId = extractRequestIdFromHeaders(req);
  const requestId = (clientRequestId && isValidRequestId(clientRequestId))
    ? clientRequestId
    : generateRequestId();

  // Attach to request for downstream middleware/routes
  req.id = requestId;
  req.requestId = requestId; // Alias for clarity

  // Add to response headers for client-side tracing
  res.setHeader('X-Request-ID', requestId);

  // Also set correlation ID header (common alternative name)
  res.setHeader('X-Correlation-ID', requestId);

  // Add to response locals for template access
  res.locals.requestId = requestId;

  // Store original URL for logging
  const startTime = Date.now();
  const originalUrl = req.originalUrl;
  const method = req.method;

  // Add request ID to response finish event for logging
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    // Log every request completion at debug level for full traceability
    logger.debug({
      event: 'request_complete',
      requestId,
      method,
      url: originalUrl,
      duration,
      statusCode: res.statusCode,
    }, 'Request completed');

    // Log slow requests (> 2s) with structured context
    if (duration > 2000) {
      logger.warn({
        event: 'slow_request',
        requestId,
        method,
        url: originalUrl,
        duration,
        statusCode: res.statusCode,
      }, 'Slow request detected');
    }
  });

  next();
}

/**
 * Middleware to add request ID to error objects for tracing
 * Use after error handling middleware
 * @param {Object} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
function errorRequestIdMiddleware(err, req, res, next) {
  // Attach request ID to error for logging
  if (req.id) {
    err.requestId = req.id;
  }
  next(err);
}

/**
 * Express middleware to add request ID to logger context
 * Use with morgan or custom loggers
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
function requestIdLoggerMiddleware(req, res, next) {
  // This middleware ensures request ID is available for logging
  // Morgan will pick up res.getHeader('X-Request-ID') automatically
  // if you use a custom token or format
  next();
}

module.exports = {
  requestIdMiddleware,
  generateRequestId,
  isValidRequestId,
  extractRequestIdFromHeaders,
  errorRequestIdMiddleware,
  requestIdLoggerMiddleware,
};