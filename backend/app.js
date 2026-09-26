const express = require('express');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const httpLogger = require('./middleware/httpLogger');
const { logger } = require('./config/logger');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const { csrfProtection } = require('./middleware/csrf.middleware');
const { requestIdMiddleware } = require('./middleware/requestId.middleware');
const authRoutes = require('./routes/auth.routes');
const profileRoutes = require('./routes/profile.routes');
const driveRoutes = require('./routes/drive.routes');
const applicationRoutes = require('./routes/application.routes');
const noticeRoutes = require('./routes/notice.routes');
const adminRoutes = require('./routes/admin.routes');
const healthRoutes = require('./routes/health.routes');
const errorHandler = require('./middleware/error.middleware');
const promBundle = require('express-prom-bundle');

const app = express();

// Trust proxy for rate limiting on hosting platforms (like Render)
app.set('trust proxy', 1);

// Request ID middleware - MUST be first for full request tracing
app.use(requestIdMiddleware);

// Prometheus Metrics Middleware
// Note on Security: In a production environment, the /metrics endpoint should be
// firewalled or restricted to internal network traffic (e.g., from the Prometheus scraper only)
// to prevent exposing application internals to the public internet.
const metricsMiddleware = promBundle({
  includeMethod: true,
  includePath: true,
  includeStatusCode: true,
  includeUp: true,
  promClient: {
    collectDefaultMetrics: {}
  }
});
app.use(metricsMiddleware);

// Security headers - Production-configured
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    xFrameOptions: {
      action: "deny",
    },
    xContentTypesOptions: true,
    xXssProtection: true,
    referrerPolicy: {
      policy: "strict-origin-when-cross-origin",
    },
    permissionsPolicy: {
      features: {
        camera: ["'none'"],
        geolocation: ["'none'"],
        microphone: ["'none'"],
        payment: ["'none'"],
        usb: ["'none'"],
      },
    },
  })
);

// CORS - Strict origin validation with credentials protection
const validateOrigin = (origin, isProduction) => {
  try {
    const urlObj = new URL(origin);

    // Reject wildcard origins - CRITICAL when credentials: true
    if (origin.includes('*')) {
      logger.warn({ origin, reason: 'wildcard_not_allowed' }, 'SECURITY: Origin rejected - wildcards not allowed with credentials');
      return false;
    }

    // Validate protocol
    if (isProduction && process.env.ALLOW_HTTP !== 'true') {
      if (urlObj.protocol !== 'https:') {
        logger.warn({ origin, reason: 'http_not_allowed_in_production' }, 'SECURITY: Origin rejected - only HTTPS allowed in production');
        return false;
      }
    } else {
      // Development: allow http and https
      if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
        logger.warn({ origin, reason: 'invalid_protocol' }, 'SECURITY: Origin rejected - only HTTP/HTTPS allowed');
        return false;
      }
    }

    // Validate hostname format (no IP addresses in production, basic format check)
    const hostname = urlObj.hostname;
    if (!hostname || hostname.length > 253) {
      logger.warn({ origin, reason: 'invalid_hostname' }, 'SECURITY: Origin rejected - invalid hostname');
      return false;
    }

    // Reject localhost in production
    if (isProduction && (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1')) {
      logger.warn({ origin, reason: 'localhost_not_allowed_in_production' }, 'SECURITY: Origin rejected - localhost not allowed in production');
      return false;
    }

    // Validate hostname contains valid characters (RFC 1123)
    const hostnameRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!hostnameRegex.test(hostname)) {
      logger.warn({ origin, reason: 'invalid_hostname_format' }, 'SECURITY: Origin rejected - invalid hostname format');
      return false;
    }

    // No port in production (standard HTTPS port 443)
    if (isProduction && urlObj.port && urlObj.port !== '443') {
      logger.warn({ origin, reason: 'non_standard_port_in_production' }, 'SECURITY: Origin rejected - non-standard port in production');
      return false;
    }

    return true;
  } catch (e) {
    logger.warn({ origin, error: e.message }, 'SECURITY: Invalid origin');
    return false;
  }
};

// Validate FRONTEND_URL format at the env-var level before processing
const validateFrontendUrlFormat = (url) => {
  if (!url || url.trim() === '') return false;
  const trimmed = url.trim();
  // No wildcards in FRONTEND_URL
  if (trimmed.includes('*')) {
    logger.warn({ frontendUrl: trimmed, reason: 'wildcard_in_frontend_url' }, 'SECURITY: FRONTEND_URL contains wildcard - rejecting');
    return false;
  }
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    logger.warn({ frontendUrl: trimmed, reason: 'invalid_url' }, 'SECURITY: FRONTEND_URL not a valid URL - rejecting');
    return false;
  }
};

const getAllowedOrigins = () => {
  const envOrigins = process.env.FRONTEND_URL;
  const isProduction = process.env.NODE_ENV === 'production';

  // In production, require explicit FRONTEND_URL configuration
  if (isProduction) {
    if (!envOrigins || envOrigins.trim() === '') {
      logger.error('ERROR: FRONTEND_URL must be set in production');
      return []; // Empty array denies all origins in production
    }

    return envOrigins
      .split(',')
      .map((url) => url.trim())
      .filter((origin) => validateFrontendUrlFormat(origin) && validateOrigin(origin, true));
  }

  // In development, allow localhost with explicit FRONTEND_URL or defaults
  const devOrigins = envOrigins
    ? envOrigins.split(',').map((url) => url.trim()).filter(validateFrontendUrlFormat)
    : ['http://localhost:5173', 'http://127.0.0.1:5173'];

  return devOrigins.filter((origin) => validateOrigin(origin, false));
};

const allowedOrigins = getAllowedOrigins();

// Fail fast in production if no valid origins
if (process.env.NODE_ENV === 'production' && allowedOrigins.length === 0) {
  logger.fatal('FATAL: No valid CORS origins configured. Set FRONTEND_URL with valid HTTPS origins.');
  process.exit(1);
}

logger.info({ count: allowedOrigins.length, origins: allowedOrigins }, 'CORS: Allowing validated origins');

// Use function-based origin callback for per-request validation and audit logging
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (server-to-server, curl, Postman) in development
    if (!origin) {
      if (process.env.NODE_ENV === 'production') {
        logger.warn('SECURITY: Request with null origin rejected in production');
        return callback(null, false);
      }
      return callback(null, true);
    }

    // Validate against the allowed origins list
    const isAllowed = allowedOrigins.includes(origin);
    if (!isAllowed) {
      logger.warn({ origin }, 'SECURITY: CORS blocked request from origin');
    }
    callback(null, isAllowed);
  },
  credentials: true, // Allow cookies - only safe because origins are strictly validated
  maxAge: 86400, // Cache preflight for 24 hours
};

app.use(cors(corsOptions));

// HTTP response compression (gzip/deflate for payloads)
app.use(compression());

// HTTP Request/Response logging (structured JSON via Pino)
app.use(httpLogger);

// Body parsers
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// Cookie parser
app.use(cookieParser());

// Data sanitization against NoSQL injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// CSRF protection (after cookie-parser, before routes)
app.use(csrfProtection);

// Health check
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'CPMS API is running',
    version: 'v1',
  });
});

// Deep health check endpoints (bypasses rate limiters for load balancers and uptime monitors)
app.use('/health', healthRoutes);
app.use('/api/v1/health', healthRoutes);

const { apiLimiter } = require('./middleware/rateLimiter');

// API Routes
app.use('/api/v1', apiLimiter);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/profile', profileRoutes);
app.use('/api/v1/drives', driveRoutes);
app.use('/api/v1/applications', applicationRoutes);
app.use('/api/v1/notices', noticeRoutes);
app.use('/api/v1/admin', adminRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// Global error handler
app.use(errorHandler);

module.exports = app;
