const cron = require('node-cron');
const { runAutoArchive, runPurgeArchived } = require('../controllers/notice.controller');
const { logger } = require('../config/logger');

/**
 * Notice Archive Cron Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Runs two daily jobs at midnight (00:00) server time:
 *
 *  1. AUTO-ARCHIVE  — Finds all active notices older than 30 days and marks
 *                     them as archived (isArchived: true, archivedAt: now).
 *                     Archived notices are immediately hidden from the student
 *                     dashboard but remain visible in the admin Archive tab.
 *
 *  2. PURGE         — Permanently hard-deletes archived notices whose archivedAt
 *                     timestamp is older than 60 days. This is irreversible.
 *
 * Timeframes (configured in notice.controller.js):
 *   ARCHIVE_AFTER_DAYS = 30
 *   PURGE_AFTER_DAYS   = 60
 */
const startNoticeArchiveCron = () => {
  // ── Job: Daily auto-archive + purge at midnight ────────────────────────────
  cron.schedule('0 0 * * *', async () => {
    const timestamp = new Date().toISOString();
    logger.info({ timestamp }, 'Running scheduled notice jobs');

    try {
      // Step 1: Auto-archive notices older than 30 days
      const archivedCount = await runAutoArchive();
      logger.info({ archivedCount }, 'Auto-archived notices (>30 days old)');
    } catch (err) {
      logger.error({ err, message: err.message }, 'Auto-archive job failed');
    }

    try {
      // Step 2: Purge archived notices older than 60 days from archivedAt
      const purgedCount = await runPurgeArchived();
      logger.info({ purgedCount }, 'Permanently deleted archived notices (>60 days in archive)');
    } catch (err) {
      logger.error({ err, message: err.message }, 'Purge job failed');
    }

    logger.info('Notice cron jobs complete');
  }, {
    timezone: 'Asia/Kolkata', // IST — adjust if needed
  });

  logger.info('Scheduled: auto-archive (30 days) + purge (60 days) @ midnight IST');
};

module.exports = { startNoticeArchiveCron };
