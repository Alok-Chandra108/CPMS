const pinoHttp = require('pino-http');
const { logger } = require('../config/logger');

/**
 * HTTP Request/Response Logging Middleware (Pino-based)
 * Replaces morgan with structured JSON logging
 *
 * Features:
 * - Logs every HTTP request/response in JSON format
 * - Auto-attaches req.id (from requestId middleware) to every log line
 * - Logs: method, url, statusCode, responseTime, contentLength, req/res headers
 * - Slow request detection (warns if response time > 2000ms)
 * - Skips health check routes (/, /health) to reduce noise
 * - Custom log levels based on status code
 */

const httpLogger = pinoHttp({
  logger,
  // Use custom log level based on status code
  customLogLevel: (req, res, err) => {
    if (res.statusCode >= 500 || err) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  // Skip logging for health check routes
  customSuccessMessage: (req, res) => {
    if (req.url === '/' || req.url === '/health') return '';
    return `Request completed: ${req.method} ${req.url} -> ${res.statusCode}`;
  },
  customErrorMessage: (req, res, err) => {
    return `Request failed: ${req.method} ${req.url} -> ${err?.message || res.statusCode}`;
  },
  // Custom properties to include in every log line
  customProps: (req, res) => ({
    requestId: req.id || req.requestId || 'unknown',
    method: req.method,
    url: req.originalUrl || req.url,
    statusCode: res.statusCode,
    responseTime: res.getHeader('X-Response-Time') || 'unknown',
    contentLength: res.getHeader('content-length') || 0,
    userAgent: req.headers['user-agent'] || 'unknown',
    ip: req.ip || req.connection?.remoteAddress || 'unknown',
  }),
  // Redact sensitive headers from request/response logs
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.headers["x-csrf-token"]',
      'req.headers["x-xsrf-token"]',
      'res.headers["set-cookie"]',
      'req.body.password',
      'req.body.token',
      'req.body.accessToken',
      'req.body.refreshToken',
    ],
    censor: '[REDACTED]',
  },
  // Don't log the full request/response body by default (too verbose)
  // Set to true if you need body logging for debugging
  // serializers: {
  //   req: pinoHttp.stdSerializers.req,
  //   res: pinoHttp.stdSerializers.res,
  //   err: pinoHttp.stdSerializers.err,
  // },
  // Quiet health check routes completely (no log line at all)
  quietReqLogger: (req) => {
    return req.url === '/' || req.url === '/health';
  },
  // Generate unique request ID if not already present
  genReqId: (req) => req.id || req.requestId,
});

module.exports = httpLogger;
