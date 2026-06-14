'use strict';

/**
 * @fileoverview JWT authentication middleware for TicketMandu.
 *
 * `authenticate`  — Required auth. Rejects requests without a valid Bearer token.
 * `optionalAuth`  — Optional auth. Populates req.user when a valid token is present,
 *                   but does not block unauthenticated requests.
 */

const { verifyAccessToken } = require('../utils/jwt.util');
const response = require('../utils/response.util');
const ERRORS = require('../constants/errors');
const logger = require('../utils/logger.util');

// ─── Token extraction ─────────────────────────────────────────────────────────

/**
 * Extract the Bearer token from the Authorization header.
 *
 * @param {import('express').Request} req - Express request.
 * @returns {string|null} The raw token string, or null if the header is absent / malformed.
 */
const extractToken = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') return null;

  return parts[1] || null;
};

// ─── Middleware ───────────────────────────────────────────────────────────────

/**
 * Required authentication middleware.
 *
 * Reads the `Authorization: Bearer <token>` header, verifies the access token,
 * and attaches the decoded user object to `req.user`.
 *
 * Sets req.user = { id, email, role, iat, exp }
 *
 * Responds with 401 on any of:
 *  - Missing header
 *  - Malformed header
 *  - Expired token
 *  - Invalid signature
 *
 * @type {import('express').RequestHandler}
 */
const authenticate = (req, res, next) => {
  const token = extractToken(req);

  if (!token) {
    return response.error(res, ERRORS.UNAUTHORIZED.message, 401, ERRORS.UNAUTHORIZED.code);
  }

  try {
    const decoded = verifyAccessToken(token);
    // Attach only the fields controllers need — avoid leaking internal JWT claims.
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };
    return next();
  } catch (err) {
    // Distinguish expired from other JWT errors so clients know to refresh.
    if (err.name === 'TokenExpiredError') {
      return response.error(res, ERRORS.TOKEN_EXPIRED.message, 401, ERRORS.TOKEN_EXPIRED.code);
    }

    logger.debug('[auth] Token verification failed', { message: err.message });
    return response.error(res, ERRORS.TOKEN_INVALID.message, 401, ERRORS.TOKEN_INVALID.code);
  }
};

/**
 * Optional authentication middleware.
 *
 * If a valid Bearer token is present, populates `req.user` exactly as
 * `authenticate` does. If the token is absent or invalid, `req.user` is left
 * undefined and the request continues normally.
 *
 * Use this for endpoints that behave differently for authenticated vs.
 * anonymous users (e.g. public event listings that highlight bookmarked events).
 *
 * @type {import('express').RequestHandler}
 */
const optionalAuth = (req, res, next) => {
  const token = extractToken(req);

  if (!token) return next();

  try {
    const decoded = verifyAccessToken(token);
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };
  } catch {
    // Silently ignore invalid / expired tokens for optional auth.
    // req.user remains undefined.
  }

  return next();
};

module.exports = { authenticate, optionalAuth };
