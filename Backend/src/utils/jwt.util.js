'use strict';

/**
 * @fileoverview JWT utility functions for TicketMandu.
 *
 * Provides sign/verify helpers for both access tokens and refresh tokens.
 * Secrets and expiry values are read from environment variables via env.js.
 *
 * Access token  — short-lived (default 15m), used on every API request.
 * Refresh token — long-lived (default 7d), used only to obtain new access tokens.
 */

const jwt = require('jsonwebtoken');
const env = require('../config/env');

// ─── Token signing ────────────────────────────────────────────────────────────

/**
 * Sign a JWT access token.
 *
 * @param {object} payload - Data to embed. Typically { id, email, role }.
 * @returns {string} Signed JWT string.
 * @throws {Error} If signing fails (e.g. bad secret configuration).
 */
const signAccessToken = (payload) => {
  if (!payload || typeof payload !== 'object') {
    throw new Error('[jwt] signAccessToken: payload must be a non-null object');
  }
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
    issuer: 'ticketmandu',
    audience: 'ticketmandu-client',
  });
};

/**
 * Sign a JWT refresh token.
 *
 * @param {object} payload - Data to embed. Typically { id }.
 * @returns {string} Signed JWT string.
 * @throws {Error} If signing fails.
 */
const signRefreshToken = (payload) => {
  if (!payload || typeof payload !== 'object') {
    throw new Error('[jwt] signRefreshToken: payload must be a non-null object');
  }
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
    issuer: 'ticketmandu',
    audience: 'ticketmandu-client',
  });
};

// ─── Token verification ───────────────────────────────────────────────────────

/**
 * Verify and decode a JWT access token.
 *
 * @param {string} token - The access token to verify.
 * @returns {object} Decoded payload (includes id, email, role, iat, exp).
 * @throws {jwt.TokenExpiredError} When the token has expired.
 * @throws {jwt.JsonWebTokenError} When the token is malformed or signature is invalid.
 */
const verifyAccessToken = (token) => {
  if (!token || typeof token !== 'string') {
    const err = new jwt.JsonWebTokenError('Token must be a non-empty string');
    throw err;
  }
  return jwt.verify(token, env.JWT_SECRET, {
    issuer: 'ticketmandu',
    audience: 'ticketmandu-client',
  });
};

/**
 * Verify and decode a JWT refresh token.
 *
 * @param {string} token - The refresh token to verify.
 * @returns {object} Decoded payload.
 * @throws {jwt.TokenExpiredError} When the token has expired.
 * @throws {jwt.JsonWebTokenError} When the token is malformed or signature is invalid.
 */
const verifyRefreshToken = (token) => {
  if (!token || typeof token !== 'string') {
    const err = new jwt.JsonWebTokenError('Token must be a non-empty string');
    throw err;
  }
  return jwt.verify(token, env.JWT_REFRESH_SECRET, {
    issuer: 'ticketmandu',
    audience: 'ticketmandu-client',
  });
};

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
