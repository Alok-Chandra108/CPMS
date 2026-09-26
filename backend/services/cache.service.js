const { logger } = require('../config/logger');

const cache = new Map();
const DEFAULT_TTL_SECONDS = 60; // 60 seconds TTL for high-traffic read endpoints

/**
 * Retrieve parsed JSON value from memory cache by key.
 *
 * @param {string} key
 * @returns {Promise<any|null>}
 */
const getCache = async (key) => {
  try {
    const item = cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      cache.delete(key);
      return null;
    }

    return item.value;
  } catch (err) {
    logger.warn({ err: err.message, key }, 'Cache getCache non-critical error');
    return null;
  }
};

/**
 * Store a value in memory cache with a TTL.
 *
 * @param {string} key
 * @param {any} value
 * @param {number} [ttlSeconds=60]
 * @returns {Promise<boolean>}
 */
const setCache = async (key, value, ttlSeconds = DEFAULT_TTL_SECONDS) => {
  try {
    cache.set(key, {
      value, // store raw value to save parsing overhead
      expiry: Date.now() + (ttlSeconds * 1000)
    });
    return true;
  } catch (err) {
    logger.warn({ err: err.message, key }, 'Cache setCache non-critical error');
    return false;
  }
};

/**
 * Invalidate one or more exact keys or patterns (e.g. 'drives:*', 'notices:*').
 *
 * @param {...string} keysOrPatterns
 * @returns {Promise<boolean>}
 */
const invalidateCache = async (...keysOrPatterns) => {
  try {
    for (const pattern of keysOrPatterns) {
      if (!pattern) continue;

      if (pattern.includes('*')) {
        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
        for (const key of cache.keys()) {
          if (regex.test(key)) {
            cache.delete(key);
          }
        }
      } else {
        cache.delete(pattern);
      }
    }
    return true;
  } catch (err) {
    logger.warn({ err: err.message }, 'Cache invalidateCache non-critical error');
    return false;
  }
};

module.exports = {
  getCache,
  setCache,
  invalidateCache,
  DEFAULT_TTL_SECONDS,
};
