'use strict';

/**
 * @fileoverview Role-based access control (RBAC) middleware for TicketMandu.
 *
 * All RBAC middleware assumes that `authenticate` from auth.middleware.js has
 * already been applied on the same route (req.user must be populated).
 *
 * Usage:
 *   router.delete('/events/:id', authenticate, requireAdmin, controller.deleteEvent);
 *   router.post('/events',       authenticate, requireOrganizer, controller.createEvent);
 *   router.get('/me',            authenticate, requireRole('user', 'organizer'), controller.getMe);
 */

const { authenticate } = require('./auth.middleware');
const response = require('../utils/response.util');
const ERRORS = require('../constants/errors');
const ROLES = require('../constants/roles');

// ─── Factory ──────────────────────────────────────────────────────────────────

/**
 * Middleware factory — enforces that the authenticated user has one of the
 * specified roles. Must be chained after `authenticate`.
 *
 * @param {...string} roles - One or more allowed role strings (from ROLES constant).
 * @returns {import('express').RequestHandler} Middleware that returns 403 when
 *   the user's role is not in the allowed list.
 *
 * @example
 * router.put('/admin/users/:id', authenticate, requireRole('admin'), handler);
 */
const requireRole = (...roles) => {
  if (roles.length === 0) {
    throw new Error('[rbac] requireRole: at least one role must be specified');
  }

  return (req, res, next) => {
    // req.user is guaranteed by authenticate; if somehow absent, treat as unauthorized.
    if (!req.user) {
      return response.error(res, ERRORS.UNAUTHORIZED.message, 401, ERRORS.UNAUTHORIZED.code);
    }

    if (!roles.includes(req.user.role)) {
      return response.error(res, ERRORS.FORBIDDEN.message, 403, ERRORS.FORBIDDEN.code);
    }

    return next();
  };
};

// ─── Shorthands ───────────────────────────────────────────────────────────────

/**
 * Shorthand middleware — allows only users with the `admin` role.
 * Must be chained after `authenticate`.
 *
 * @type {import('express').RequestHandler}
 *
 * @example
 * router.delete('/users/:id', authenticate, requireAdmin, handler);
 */
const requireAdmin = requireRole(ROLES.ADMIN);

/**
 * Shorthand middleware — allows users with `admin` or `organizer` roles.
 * Must be chained after `authenticate`.
 *
 * @type {import('express').RequestHandler}
 *
 * @example
 * router.post('/events', authenticate, requireOrganizer, handler);
 */
const requireOrganizer = requireRole(ROLES.ADMIN, ROLES.ORGANIZER);

// ─── Composed helpers (authenticate + role check in one step) ─────────────────

/**
 * Compose `authenticate` and a role check into a single middleware array.
 * Useful for routes.use() or when you want a one-liner in route definitions.
 *
 * @param {...string} roles - Allowed roles.
 * @returns {import('express').RequestHandler[]} [authenticate, requireRole(...roles)]
 *
 * @example
 * router.post('/events', ...guardRole('admin', 'organizer'), handler);
 */
const guardRole = (...roles) => [authenticate, requireRole(...roles)];

module.exports = {
  requireRole,
  requireAdmin,
  requireOrganizer,
  guardRole,
};
