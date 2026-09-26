const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

/**
 * Helper to format bytes to readable MB
 */
const formatMemoryMB = (bytes) => `${(bytes / 1024 / 1024).toFixed(2)} MB`;

/**
 * @desc    Deep health and readiness check endpoint
 * @route   GET /health and GET /api/v1/health
 * @access  Public
 */
router.get('/', async (req, res) => {
  const startTime = Date.now();
  let dbStatus = 'disconnected';
  let dbLatencyMs = null;
  let isDbHealthy = false;

  // 1. Probe MongoDB
  try {
    if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
      const pingStart = Date.now();
      await mongoose.connection.db.admin().ping();
      dbLatencyMs = Date.now() - pingStart;
      dbStatus = 'connected';
      isDbHealthy = true;
    } else if (mongoose.connection.readyState === 2) {
      dbStatus = 'connecting';
    }
  } catch (dbErr) {
    dbStatus = 'error';
    isDbHealthy = false;
  }

  // 2. System Metrics
  const memUsage = process.memoryUsage();
  const uptimeSeconds = Math.floor(process.uptime());

  // Determine overall status
  let overallStatus = 'healthy';
  let statusCode = 200;

  if (!isDbHealthy) {
    overallStatus = 'unhealthy';
    statusCode = 503; // Primary database unavailable
  }

  return res.status(statusCode).json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptimeSeconds,
    responseTimeMs: Date.now() - startTime,
    system: {
      nodeVersion: process.version,
      instanceId: process.env.NODE_APP_INSTANCE || String(process.pid),
      memory: {
        rss: formatMemoryMB(memUsage.rss),
        heapUsed: formatMemoryMB(memUsage.heapUsed),
        heapTotal: formatMemoryMB(memUsage.heapTotal),
      },
    },
    services: {
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
      },
    },
  });
});

module.exports = router;
