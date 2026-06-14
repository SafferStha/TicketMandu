'use strict';

/**
 * @fileoverview Domain status constants for all core entities.
 * Centralises every valid status string so they stay in sync across
 * validators, database queries, and business logic.
 */

/**
 * Lifecycle statuses grouped by entity type.
 * @namespace STATUS
 */
const STATUS = {
  /**
   * Event lifecycle statuses.
   * @enum {string}
   */
  EVENT: {
    /** Event created but not yet visible to the public. */
    DRAFT: 'draft',
    /** Event is live and accepting ticket purchases. */
    PUBLISHED: 'published',
    /** Event has been cancelled by the organizer or admin. */
    CANCELLED: 'cancelled',
    /** Event has concluded. */
    COMPLETED: 'completed',
  },

  /**
   * Individual ticket statuses.
   * @enum {string}
   */
  TICKET: {
    /** Ticket is valid and has not been used. */
    ACTIVE: 'active',
    /** Ticket was scanned / redeemed at the event. */
    USED: 'used',
    /** Ticket was cancelled (refund may apply). */
    CANCELLED: 'cancelled',
    /** Ticket ownership was transferred to another user. */
    TRANSFERRED: 'transferred',
  },

  /**
   * Order lifecycle statuses.
   * @enum {string}
   */
  ORDER: {
    /** Order created but payment not yet confirmed. */
    PENDING: 'pending',
    /** Payment received — order is confirmed. */
    CONFIRMED: 'confirmed',
    /** Order was cancelled before fulfillment. */
    CANCELLED: 'cancelled',
    /** Full or partial refund issued. */
    REFUNDED: 'refunded',
  },

  /**
   * Payment transaction statuses.
   * @enum {string}
   */
  PAYMENT: {
    /** Payment initiated but not yet settled. */
    PENDING: 'pending',
    /** Payment successfully processed. */
    COMPLETED: 'completed',
    /** Payment attempt failed (e.g. declined card). */
    FAILED: 'failed',
    /** Payment was reversed / refunded. */
    REFUNDED: 'refunded',
  },
};

/**
 * Legacy ticket view-filter values used by the frontend.
 * Kept separate to avoid confusion with TICKET lifecycle statuses.
 */
const TICKET_STATUS_UPCOMING = 'upcoming';
const TICKET_STATUS_PAST = 'past';

module.exports = {
  STATUS,
  TICKET_STATUS_UPCOMING,
  TICKET_STATUS_PAST,
};
