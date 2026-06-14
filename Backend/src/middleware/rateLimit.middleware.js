'use strict';

/**
 * @fileoverview Rate limiting middleware for TicketMandu.
 *
 * Uses `express-rate-limit` with three tiers of enforcement:
 *
 *  - generalLimiter  — General API endpoints   (100 req / 15 min per IP)
 *  - authLimiter     — Login / register routes  (10  req / 15 min per IP)
 *  - strictLimiter   — Sensitive ops like reset ( 5  req / 15 min per IP)
 *
 * All limiters respond with the standard TicketMandu error envelope so that
 * client error handling is consistent.
 */

const rateLimit = require('express-rate-limit');

/** Duration window in milliseconds (15 minutes). */
const WINDOW_MS = 15 * 60 * 1000;

/**
 * Build a standardised rate-limit error response body.
 *
 * @param {string} detail - Context-specific detail message.
 * @returns {object} TicketMandu error envelope.
 */
const buildMessage = (detail) => ({
  success: false,
  message: detail,
  code: 'RATE_LIMIT_EXCEEDED',
  data: null,
});

// ─── Limiters ─────────────────────────────────────────────────────────────────

/**
 * General-purpose rate limiter.
 * Applied globally or to most non-sensitive API routes.
 *
 * Limit: 100 requests per 15 minutes per IP address.
 *
 * @type {import('express-rate-limit').RateLimitRequestHandler}
 */
const generalLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: 100,
  standardHeaders: true,  // Return rate limit info in `RateLimit-*` headers.
  legacyHeaders: false,   // Disable the deprecated `X-RateLimit-*` headers.
  message: buildMessage('Too many requests. Please try again in 15 minutes.'),
  /**
   * Custom handler that returns the standard error envelope as JSON.
   *
   * @param {import('express').Request}  req
   * @param {import('express').Response} res
   */
  handler: (req, res) => {
    res.status(429).json(
      buildMessage('Too many requests. Please try again in 15 minutes.')
    );
  },
});

/**
 * Auth route rate limiter (login, register, token refresh).
 * More restrictive than the general limiter to slow down credential stuffing.
 *
 * Limit: 10 requests per 15 minutes per IP address.
 *
 * @type {import('express-rate-limit').RateLimitRequestHandler}
 */
const authLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: buildMessage('Too many authentication attempts. Please try again in 15 minutes.'),
  handler: (req, res) => {
    res.status(429).json(
      buildMessage('Too many authentication attempts. Please try again in 15 minutes.')
    );
  },
  // Skip successful requests so the window only resets on failed attempts.
  skipSuccessfulRequests: true,
});

/**
 * Strict rate limiter for highly sensitive operations.
 * Use for password-reset initiation, email verification resend, etc.
 *
 * Limit: 5 requests per 15 minutes per IP address.
 *
 * @type {import('express-rate-limit').RateLimitRequestHandler}
 */
const strictLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: buildMessage('Too many sensitive requests. Please try again in 15 minutes.'),
  handler: (req, res) => {
    res.status(429).json(
      buildMessage('Too many sensitive requests. Please try again in 15 minutes.')
    );
  },
});

module.exports = { generalLimiter, authLimiter, strictLimiter };
