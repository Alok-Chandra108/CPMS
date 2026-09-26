const ApiResponse = require('../utils/ApiResponse');
const multer = require('multer');
const { logger } = require('../config/logger');

/**
 * Global Error Handler Middleware
 */
const errorHandler = (err, req, res, next) => {
  // Log error with structured fields
  const logContext = {
    err: err,
    requestId: req.id || req.requestId,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    statusCode: err.statusCode || 500,
  };

  if (process.env.NODE_ENV !== 'production') {
    logger.error(logContext, 'Unhandled Error');
  } else {
    // In production, log error without stack trace for observability
    logger.error({
      requestId: req.id || req.requestId,
      method: req.method,
      url: req.originalUrl,
      message: err.message,
      statusCode: err.statusCode || 500,
    }, 'Request error');
  }

  // Handle Multer errors (file upload validation)
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return ApiResponse.error(res, 'File too large. Maximum size is 2MB.', 413);
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return ApiResponse.error(res, 'Too many files uploaded.', 400);
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return ApiResponse.error(res, `Unexpected file field: ${err.field}`, 400);
    }
    if (err.code === 'LIMIT_PART_COUNT' || err.code === 'LIMIT_FIELD_COUNT' || err.code === 'LIMIT_FIELD_KEY' || err.code === 'LIMIT_FIELD_VALUE') {
      return ApiResponse.error(res, 'Request payload malformed.', 400);
    }
    return ApiResponse.error(res, `Upload error: ${err.message}`, 400);
  }

  // Handle specific Mongoose errors
  if (err.name === 'CastError') {
    return ApiResponse.error(res, `Invalid resource ID: ${err.value}`, 400);
  }

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    return ApiResponse.error(res, messages.join('. '), 400);
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return ApiResponse.error(res, `${field} already exists`, 409);
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return ApiResponse.error(res, 'Invalid token. Please log in again.', 401);
  }

  if (err.name === 'TokenExpiredError') {
    return ApiResponse.error(res, 'Token expired. Please log in again.', 401);
  }

  // Handle file filter errors (from multer fileFilter callback or Cloudinary validation)
  if (err.message && (
    err.message.includes('Only PDF') || 
    err.message.includes('Only image') ||
    err.message.includes('Invalid image file')
  )) {
    return ApiResponse.error(res, err.message, 400);
  }

  // Default to 500 Internal Server Error
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal Server Error'
    : err.message || 'Internal Server Error';

  return ApiResponse.error(res, message, statusCode);
};

module.exports = errorHandler;
