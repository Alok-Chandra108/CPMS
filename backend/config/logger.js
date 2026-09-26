const pino = require('pino');

/**
 * Centralized Structured Logger (Pino)
 *
 * - Production: Pure JSON output to stdout (for ELK/Loki/Datadog ingestion)
 * - Development: Pretty-printed, colorized output via pino-pretty
 * - Auto-redacts sensitive fields (passwords, tokens, secrets, cookies)
 * - Log level controlled via LOG_LEVEL env var
 * - Supports child loggers: logger.child({ requestId }) for request-scoped context
 */

const isProduction = process.env.NODE_ENV === 'production';
const level = process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug');

/**
 * Fields that MUST be redacted from all log output.
 * Paths use dot notation for nested fields (e.g. "req.headers.authorization").
 */
const redactPaths = [
  'password',
  '*.password',
  'req.body.password',
  'req.body.confirmPassword',
  'req.body.currentPassword',
  'req.body.newPassword',
  'token',
  '*.token',
  'accessToken',
  'refreshToken',
  '*.accessToken',
  '*.refreshToken',
  'authorization',
  'req.headers.authorization',
  'req.headers.cookie',
  'cookie',
  'secret',
  '*.secret',
  'jwt',
  '*.jwt',
  'apiKey',
  '*.apiKey',
  'BREVO_API_KEY',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'CLOUDINARY_API_SECRET',
  'CLOUDINARY_API_KEY',
  'RESEND_API_KEY',
  'MONGO_URI',
  'MONGODB_URI',
];

const baseConfig = {
  level,
  redact: {
    paths: redactPaths,
    censor: '[REDACTED]',
  },
  base: {
    service: 'cpms-backend',
    env: process.env.NODE_ENV || 'development',
    pid: process.pid,
    hostname: require('os').hostname(),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label) => ({ level: label }),
  },
};

let transport = undefined;
if (!isProduction) {
  try {
    require.resolve('pino-pretty');
    transport = pino.transport({
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname,service,env',
        singleLine: false,
      },
    });
  } catch (err) {
    // pino-pretty not installed, fallback to standard JSON
  }
}

const logger = transport ? pino(baseConfig, transport) : pino(baseConfig);

/**
 * Create a child logger with request-scoped context.
 * Usage: const log = createRequestLogger(req); log.info('processing...');
 *
 * @param {Object} req - Express request object (must have req.id from requestId middleware)
 * @returns {Object} Pino child logger with requestId, method, url bound
 */
function createRequestLogger(req) {
  return logger.child({
    requestId: req.id || req.requestId || 'unknown',
    method: req.method,
    url: req.originalUrl || req.url,
  });
}

module.exports = logger;
module.exports.createRequestLogger = createRequestLogger;
module.exports.logger = logger;
