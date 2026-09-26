require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const { startNoticeArchiveCron } = require('./services/noticeArchiveCron');
const { logger } = require('./config/logger');

/**
 * Validate required environment variables before starting the server
 * Fails fast with clear error messages if critical config is missing
 */
const validateEnv = () => {
  // Required in ALL environments
  const required = [
    { key: 'MONGO_URI', description: 'MongoDB connection URI' },
    { key: 'JWT_ACCESS_SECRET', description: 'JWT access token secret (min 32 chars)' },
    { key: 'JWT_REFRESH_SECRET', description: 'JWT refresh token secret (min 32 chars)' },
  ];

  // Required ONLY in production
  const requiredInProduction = [
    { key: 'FRONTEND_URL', description: 'Frontend URL for CORS (comma-separated, HTTPS only)' },
    { key: 'CLOUDINARY_CLOUD_NAME', description: 'Cloudinary cloud name for image uploads' },
    { key: 'CLOUDINARY_API_KEY', description: 'Cloudinary API key' },
    { key: 'CLOUDINARY_API_SECRET', description: 'Cloudinary API secret' },
    { key: 'BREVO_API_KEY', description: 'Brevo API key for transactional emails' },
    { key: 'BREVO_SENDER_EMAIL', description: 'Verified sender email for Brevo' },
  ];

  // Optional with defaults
  const optional = [
    { key: 'PORT', default: '5000', description: 'Server port' },
    { key: 'NODE_ENV', default: 'development', description: 'Environment (development/production)' },
    { key: 'JWT_ACCESS_EXPIRY', default: '15m', description: 'JWT access token expiry' },
    { key: 'JWT_REFRESH_EXPIRY', default: '7d', description: 'JWT refresh token expiry' },
    { key: 'ADMIN_EMAIL', default: '11mt25mca082-t@mite.ac.in', description: 'Admin email for seeding (optional)' },
  ];

  const missing = [];
  const warnings = [];

  // Check required variables
  for (const { key, description } of required) {
    if (!process.env[key] || process.env[key].trim() === '') {
      missing.push({ key, description });
    }
  }

  // Check production-only required variables
  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction) {
    for (const { key, description } of requiredInProduction) {
      if (!process.env[key] || process.env[key].trim() === '') {
        missing.push({ key, description: `${description} (required in production)` });
      }
    }
  }

  // Set defaults for optional variables
  for (const { key, default: defaultValue, description } of optional) {
    if (!process.env[key] || process.env[key].trim() === '') {
      process.env[key] = defaultValue;
      warnings.push({ key, description, default: defaultValue });
    }
  }

  // Validate JWT secret strength
  if (process.env.JWT_ACCESS_SECRET && process.env.JWT_ACCESS_SECRET.length < 32) {
    warnings.push({ key: 'JWT_ACCESS_SECRET', description: 'JWT access secret should be at least 32 characters', note: 'Weak secret - consider generating a stronger one' });
  }
  if (process.env.JWT_REFRESH_SECRET && process.env.JWT_REFRESH_SECRET.length < 32) {
    warnings.push({ key: 'JWT_REFRESH_SECRET', description: 'JWT refresh secret should be at least 32 characters', note: 'Weak secret - consider generating a stronger one' });
  }

  // Validate FRONTEND_URL format (if set)
  if (process.env.FRONTEND_URL) {
    const urls = process.env.FRONTEND_URL.split(',').map(u => u.trim());
    for (const url of urls) {
      try {
        const parsed = new URL(url);
        if (isProduction && parsed.protocol !== 'https:') {
          warnings.push({ key: 'FRONTEND_URL', description: `Frontend URL "${url}" should use HTTPS in production`, note: 'Security warning - CORS will reject non-HTTPS in production' });
        }
        if (!['http:', 'https:'].includes(parsed.protocol)) {
          warnings.push({ key: 'FRONTEND_URL', description: `Frontend URL "${url}" has invalid protocol`, note: 'Must be http:// or https://' });
        }
      } catch {
        warnings.push({ key: 'FRONTEND_URL', description: `Frontend URL "${url}" is not a valid URL`, note: 'Format: https://example.com or https://example.com,https://other.com' });
      }
    }
  }

  // Validate MONGO_URI scheme
  if (process.env.MONGO_URI) {
    try {
      const parsed = new URL(process.env.MONGO_URI);
      if (!['mongodb:', 'mongodb+srv:'].includes(parsed.protocol)) {
        warnings.push({ key: 'MONGO_URI', description: 'MongoDB URI should use mongodb:// or mongodb+srv:// protocol', note: 'Current protocol: ' + parsed.protocol });
      }
    } catch {
      warnings.push({ key: 'MONGO_URI', description: 'MongoDB URI is not a valid URL format' });
    }
  }

  // Validate Cloudinary credentials format (if set)
  if (process.env.CLOUDINARY_API_KEY && !/^\d+$/.test(process.env.CLOUDINARY_API_KEY)) {
    warnings.push({ key: 'CLOUDINARY_API_KEY', description: 'Cloudinary API key should be numeric', note: 'Format check failed' });
  }
  if (process.env.CLOUDINARY_API_SECRET && process.env.CLOUDINARY_API_SECRET.length < 20) {
    warnings.push({ key: 'CLOUDINARY_API_SECRET', description: 'Cloudinary API secret appears too short', note: 'Should be at least 20 characters' });
  }

  // Validate Brevo API key format (if set)
  if (process.env.BREVO_API_KEY && !process.env.BREVO_API_KEY.startsWith('xkeysib-')) {
    warnings.push({ key: 'BREVO_API_KEY', description: 'Brevo API key should start with "xkeysib-"', note: 'Format check failed' });
  }

  // Validate BREVO_SENDER_EMAIL format (if set)
  if (process.env.BREVO_SENDER_EMAIL) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(process.env.BREVO_SENDER_EMAIL)) {
      warnings.push({ key: 'BREVO_SENDER_EMAIL', description: 'Brevo sender email is not a valid email format', note: 'Current value: ' + process.env.BREVO_SENDER_EMAIL });
    }
  }

  // Report missing required variables
  if (missing.length > 0) {
    logger.fatal({ missing: missing.map(m => m.key) }, 'Missing required environment variables');
    for (const { key, description } of missing) {
      logger.fatal({ key, description }, 'Missing required env');
    }
    logger.fatal('Please set these in your .env file or environment.');
    process.exit(1);
  }

  // Report optional variables using defaults
  if (warnings.length > 0) {
    logger.warn({ warnings: warnings.map(w => w.key) }, 'Environment variables using defaults or validation warnings');
    for (const { key, description, default: defaultValue, note } of warnings) {
      const defaultMsg = defaultValue !== undefined ? ` (default: "${defaultValue}")` : '';
      const noteMsg = note ? ` - ${note}` : '';
      logger.warn({ key, description, default: defaultValue, note }, `Env var: ${key}`);
    }
  }

  // Log configuration summary
  logger.info({
    env: process.env.NODE_ENV,
    port: process.env.PORT,
    mongoConfigured: !!process.env.MONGO_URI,
    frontendUrl: process.env.FRONTEND_URL || 'not set (dev defaults)',
    cloudinaryConfigured: !!process.env.CLOUDINARY_CLOUD_NAME,
    emailConfigured: !!process.env.BREVO_API_KEY,
  }, 'Environment validation passed');
};

const PORT = process.env.PORT || 5000;

// Global process error handlers to prevent silent crashes from background jobs
// (cron tasks, email sends, etc.) that may produce unhandled rejections or exceptions.
process.on('unhandledRejection', (reason, promise) => {
  logger.fatal({ reason, promise }, 'Unhandled Promise Rejection');
});

process.on('uncaughtException', (error) => {
  logger.fatal({ err: error }, 'Uncaught Exception');
  // Exit so the process supervisor (nodemon/pm2/docker) can restart in a clean state
  process.exit(1);
});

// Validate environment BEFORE connecting to database
validateEnv();

// Track server instance for graceful shutdown
let server = null;

// Graceful shutdown handler
const gracefulShutdown = async (signal) => {
  logger.info({ signal }, 'Received signal, starting graceful shutdown');

  // Stop accepting new connections
  if (server) {
    logger.info('Stopping HTTP server...');
    server.close(() => {
      logger.info('HTTP server closed');
    });

    // Force close after 10 seconds if graceful shutdown takes too long
    setTimeout(() => {
      logger.fatal('Forced shutdown after timeout');
      process.exit(1);
    }, 10000).unref();
  }

  try {
    // Stop accepting new cron jobs
    logger.info('Stopping cron jobs...');
    // Note: cron jobs don't have a built-in stop method, they'll finish current run

    // Close MongoDB connection gracefully
    // This waits for in-flight operations (up to maxIdleTimeMS = 30s)
    logger.info('Closing MongoDB connection...');
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close(false); // false = don't force close, wait for in-flight ops
      logger.info('MongoDB connection closed gracefully');
    }

    logger.info('Graceful shutdown complete');
    process.exit(0);
  } catch (error) {
    logger.fatal({ err: error }, 'Error during graceful shutdown');
    process.exit(1);
  }
};

// Handle termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Connect to MongoDB and start server
const startServer = async () => {
  try {
    await connectDB();

    // Start scheduled background jobs
    // In cluster mode (PM2 / Node cluster), run cron only on primary worker (instance 0) to avoid duplicate jobs
    const isPrimaryWorker = !process.env.NODE_APP_INSTANCE || process.env.NODE_APP_INSTANCE === '0';
    if (isPrimaryWorker) {
      startNoticeArchiveCron();
    } else {
      logger.info({ instance: process.env.NODE_APP_INSTANCE }, 'Cluster worker: Cron jobs handled by primary worker (0)');
    }

    server = app.listen(PORT, () => {
      logger.info(
        { port: PORT, env: process.env.NODE_ENV || 'development', instance: process.env.NODE_APP_INSTANCE || 'standalone' },
        'Server running'
      );
      // Signal PM2 cluster that this worker is ready to receive requests (for zero-downtime reloads)
      if (process.send) {
        process.send('ready');
      }
    });
  } catch (error) {
    logger.fatal({ err: error }, 'Failed to start server');
    process.exit(1);
  }
};

startServer();
