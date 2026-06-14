'use strict';

/**
 * @fileoverview Canonical error codes and messages for TicketMandu.
 *
 * Each entry is a frozen object so error definitions cannot be mutated at runtime.
 * Use these in middleware, services, and controllers instead of inline strings.
 *
 * @example
 * const ERRORS = require('../constants/errors');
 * return response.error(res, ERRORS.NOT_FOUND.message, 404, ERRORS.NOT_FOUND.code);
 */

/**
 * @typedef {Object} AppError
 * @property {string} code    - Machine-readable error identifier.
 * @property {string} message - Human-readable default message.
 */

/** @type {Object.<string, AppError>} */
const ERRORS = Object.freeze({
  NOT_FOUND: Object.freeze({
    code: 'NOT_FOUND',
    message: 'Resource not found',
  }),

  UNAUTHORIZED: Object.freeze({
    code: 'UNAUTHORIZED',
    message: 'Authentication required',
  }),

  FORBIDDEN: Object.freeze({
    code: 'FORBIDDEN',
    message: 'Insufficient permissions',
  }),

  VALIDATION_ERROR: Object.freeze({
    code: 'VALIDATION_ERROR',
    message: 'Validation failed',
  }),

  DUPLICATE_EMAIL: Object.freeze({
    code: 'DUPLICATE_EMAIL',
    message: 'Email already registered',
  }),

  INVALID_CREDENTIALS: Object.freeze({
    code: 'INVALID_CREDENTIALS',
    message: 'Invalid email or password',
  }),

  TOKEN_EXPIRED: Object.freeze({
    code: 'TOKEN_EXPIRED',
    message: 'Token has expired',
  }),

  TOKEN_INVALID: Object.freeze({
    code: 'TOKEN_INVALID',
    message: 'Invalid token',
  }),

  EVENT_NOT_FOUND: Object.freeze({
    code: 'EVENT_NOT_FOUND',
    message: 'Event not found',
  }),

  TICKET_SOLD_OUT: Object.freeze({
    code: 'TICKET_SOLD_OUT',
    message: 'Tickets are sold out',
  }),

  INTERNAL_ERROR: Object.freeze({
    code: 'INTERNAL_ERROR',
    message: 'Internal server error',
  }),
});

module.exports = ERRORS;
