'use strict';

const logger = require('../utils/logger.util');
const ERRORS = require('../constants/errors');

const errorHandler = (err, req, res, next) => {
  // PostgreSQL unique violation → 409
  if (err.code === '23505') {
    const field = err.constraint?.includes('email') ? 'Email' : 'Value';
    return res.status(409).json({
      success: false,
      message: `${field} already exists`,
      code: ERRORS.DUPLICATE_EMAIL.code,
    });
  }

  // PostgreSQL foreign key violation → 400
  if (err.code === '23503') {
    return res.status(400).json({
      success: false,
      message: 'Referenced resource not found',
      code: ERRORS.NOT_FOUND.code,
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: ERRORS.TOKEN_INVALID.message,
      code: ERRORS.TOKEN_INVALID.code,
    });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: ERRORS.TOKEN_EXPIRED.message,
      code: ERRORS.TOKEN_EXPIRED.code,
    });
  }

  // Multer file size error
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      message: 'File too large. Maximum size is 5MB.',
      code: 'FILE_TOO_LARGE',
    });
  }

  // Application-defined HTTP errors (err.statusCode)
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message || 'An error occurred',
      code: err.code || null,
    });
  }

  // Unknown / unexpected error
  logger.error('[error] Unhandled exception', {
    message: err.message,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
  });

  return res.status(500).json({
    success: false,
    message: ERRORS.INTERNAL_ERROR.message,
    code: ERRORS.INTERNAL_ERROR.code,
  });
};

module.exports = errorHandler;
