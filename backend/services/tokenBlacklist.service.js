const { logger } = require('../config/logger');

const blacklist = new Map();

// Periodic cleanup to prevent memory leaks
// Runs every hour
const cleanupInterval = setInterval(() => {
  const now = Math.floor(Date.now() / 1000);
  for (const [key, expiry] of blacklist.entries()) {
    if (expiry <= now) {
      blacklist.delete(key);
    }
  }
}, 60 * 60 * 1000);

// Prevent the interval from keeping the Node process alive
cleanupInterval.unref();

/**
 * Add a token hash to the blacklist
 * @param {string} tokenHash - SHA256 hash of the token
 * @param {number} expiryTimestamp - Token expiry timestamp (in seconds)
 * @returns {Promise<boolean>} Success status
 */
const addToBlacklist = async (tokenHash, expiryTimestamp) => {
  try {
    const now = Math.floor(Date.now() / 1000);
    const ttl = expiryTimestamp - now;

    if (ttl <= 0) {
      logger.warn({ tokenHash: tokenHash.substring(0, 8) }, 'Token already expired, skipping blacklist');
      return true;
    }

    const key = `blacklist:token:${tokenHash}`;
    blacklist.set(key, expiryTimestamp);

    logger.info({ tokenHash: tokenHash.substring(0, 8), ttl }, 'Added token to blacklist');
    return true;
  } catch (error) {
    logger.error({ err: error, message: error.message, tokenHash: tokenHash.substring(0, 8) }, 'Failed to add token to blacklist');
    return false;
  }
};

/**
 * Check if a token hash is blacklisted
 * @param {string} tokenHash - SHA256 hash of the token
 * @returns {Promise<boolean>} True if blacklisted, false otherwise
 */
const isBlacklisted = async (tokenHash) => {
  try {
    const key = `blacklist:token:${tokenHash}`;
    const expiry = blacklist.get(key);
    
    if (!expiry) {
      return false;
    }

    const now = Math.floor(Date.now() / 1000);
    if (expiry <= now) {
      blacklist.delete(key);
      return false;
    }

    return true;
  } catch (error) {
    logger.error({ err: error, message: error.message, tokenHash: tokenHash.substring(0, 8) }, 'Failed to check token blacklist');
    return true; // Fail closed
  }
};

/**
 * Remove a token from blacklist (for testing/admin purposes)
 * @param {string} tokenHash - SHA256 hash of the token
 * @returns {Promise<boolean>} Success status
 */
const removeFromBlacklist = async (tokenHash) => {
  try {
    const key = `blacklist:token:${tokenHash}`;
    blacklist.delete(key);

    logger.info({ tokenHash: tokenHash.substring(0, 8) }, 'Removed token from blacklist');
    return true;
  } catch (error) {
    logger.error({ err: error, message: error.message, tokenHash: tokenHash.substring(0, 8) }, 'Failed to remove token from blacklist');
    return false;
  }
};

module.exports = {
  addToBlacklist,
  isBlacklisted,
  removeFromBlacklist,
};
