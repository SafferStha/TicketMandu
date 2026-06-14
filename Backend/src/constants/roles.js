'use strict';

/**
 * @fileoverview Application role constants.
 * Use these instead of raw strings to prevent typos and centralise changes.
 *
 * @example
 * const { ROLES } = require('../constants/roles');
 * if (req.user.role === ROLES.ADMIN) { ... }
 */

/** Enumeration of all valid user roles in the system. */
const ROLES = {
  /** Full platform access — can manage everything. */
  ADMIN: 'admin',

  /** Can create and manage their own events. */
  ORGANIZER: 'organizer',

  /** Regular consumer — can browse events and purchase tickets. */
  USER: 'user',
};

module.exports = ROLES;
