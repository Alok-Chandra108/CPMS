const { logger } = require('../config/logger');

const MAX_RETRIES = 3;
const DISPATCH_INTERVAL_MS = 200; // 5 emails/sec max rate limit

// In-memory queue
const memoryQueue = [];

let isProcessing = false;
let workerTimer = null;
let stats = {
  enqueued: 0,
  processed: 0,
  failed: 0,
};

/**
 * Enqueue an email job into memory
 * @param {Object} job - { type, data, attempts }
 */
const enqueueJob = async (job) => {
  const payload = {
    ...job,
    attempts: job.attempts || 0,
    queuedAt: new Date().toISOString(),
  };

  stats.enqueued++;
  memoryQueue.push(payload);
  return true;
};

/**
 * Pop the next job from memory
 * @returns {Promise<Object|null>}
 */
const dequeueJob = async () => {
  if (memoryQueue.length > 0) {
    return memoryQueue.shift();
  }
  return null;
};

/**
 * Process a single email job
 * @param {Object} job
 */
const executeJob = async (job) => {
  const { sendStatusUpdateEmail } = require('./email.service');

  if (job.type === 'STATUS_UPDATE') {
    const { fullName, email, companyName, jobRole, status, remarks } = job.data;
    await sendStatusUpdateEmail(fullName, email, companyName, jobRole, status, remarks);
  } else {
    logger.warn({ jobType: job.type }, 'EmailQueue: Unknown job type');
  }
};

/**
 * Process the next job in the queue
 */
const processNextJob = async () => {
  if (isProcessing) return;
  isProcessing = true;

  try {
    const job = await dequeueJob();
    if (!job) {
      isProcessing = false;
      return false; // Queue was empty
    }

    try {
      await executeJob(job);
      stats.processed++;
      logger.info({ email: job.data?.email, status: job.data?.status }, 'EmailQueue: Notification email dispatched successfully');
    } catch (err) {
      stats.failed++;
      job.attempts = (job.attempts || 0) + 1;

      if (job.attempts < MAX_RETRIES) {
        logger.warn({ err: err.message, attempt: job.attempts, email: job.data?.email }, 'EmailQueue: Email delivery failed, re-queuing for retry');
        // Push back to retry
        await enqueueJob(job);
      } else {
        logger.error({ err: err.message, job }, 'EmailQueue: Max retries exhausted for email notification');
      }
    }
  } catch (err) {
    logger.error({ err }, 'EmailQueue: Worker processing error');
  } finally {
    isProcessing = false;
  }

  return true;
};

/**
 * Background worker loop
 */
const runWorkerLoop = async () => {
  const hadJob = await processNextJob();
  const nextInterval = hadJob ? DISPATCH_INTERVAL_MS : 1000;

  if (process.env.NODE_ENV !== 'test') {
    workerTimer = setTimeout(runWorkerLoop, nextInterval);
  }
};

/**
 * Start queue consumer worker
 */
const startWorker = () => {
  if (workerTimer || process.env.NODE_ENV === 'test') return;
  workerTimer = setTimeout(runWorkerLoop, DISPATCH_INTERVAL_MS);
  logger.info('EmailQueue: Background worker initialized');
};

/**
 * Stop queue consumer worker
 */
const stopWorker = () => {
  if (workerTimer) {
    clearTimeout(workerTimer);
    workerTimer = null;
  }
};

// Start background consumer in non-test environments
if (process.env.NODE_ENV !== 'test') {
  startWorker();
}

/**
 * Public API: Queue a single status update email
 */
const queueStatusUpdateEmail = async ({ fullName, email, companyName, jobRole, status, remarks }) => {
  return enqueueJob({
    type: 'STATUS_UPDATE',
    data: { fullName, email, companyName, jobRole, status, remarks: remarks || '' },
  });
};

/**
 * Public API: Queue bulk status update emails
 */
const queueBulkStatusUpdateEmails = async (jobs) => {
  if (!Array.isArray(jobs) || jobs.length === 0) return 0;

  let queuedCount = 0;
  for (const job of jobs) {
    await queueStatusUpdateEmail(job);
    queuedCount++;
  }

  logger.info({ count: queuedCount }, 'EmailQueue: Enqueued batch of status update emails');
  return queuedCount;
};

/**
 * Public API: Get current queue statistics
 */
const getQueueStats = async () => {
  return {
    ...stats,
    pending: memoryQueue.length,
    inMemoryCount: memoryQueue.length,
    redisCount: 0,
  };
};

module.exports = {
  queueStatusUpdateEmail,
  queueBulkStatusUpdateEmails,
  processNextJob,
  startWorker,
  stopWorker,
  getQueueStats,
  _memoryQueue: memoryQueue, // for unit tests
};
