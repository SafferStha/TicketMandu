'use strict';

/**
 * @fileoverview Environment variable validation and export.
 * Throws a descriptive error on startup if any required variable is missing.
 */

require('dotenv').config();

/**
 * Assert that a variable exists and is non-empty.
 * @param {string} name - Environment variable name.
 * @param {string|undefined} value - Resolved value.
 * @returns {string} The validated value.
 * @throws {Error} When the variable is missing.
 */
const required = (name, value) => {
  if (!value || value.trim() === '') {
    throw new Error(
      `[env] Missing required environment variable: "${name}". ` +
        'Check your .env file or deployment configuration.'
    );
  }
  return value.trim();
};

/**
 * Return a value or a fallback default.
 * @param {string|undefined} value - Environment variable value.
 * @param {string} defaultValue - Fallback.
 * @returns {string}
 */
const optional = (value, defaultValue) =>
  value && value.trim() !== '' ? value.trim() : defaultValue;

// ─── Required: at least one DB credential strategy must be present ────────────
const hasDatabaseUrl = !!process.env.DATABASE_URL;
const hasDbUser = !!process.env.DB_USER;

if (!hasDatabaseUrl && !hasDbUser) {
  throw new Error(
    '[env] Missing required database configuration. ' +
      'Provide either DATABASE_URL or DB_USER (+ DB_PASSWORD, DB_HOST, DB_NAME, DB_PORT).'
  );
}

required('JWT_SECRET', process.env.JWT_SECRET);
required('JWT_REFRESH_SECRET', process.env.JWT_REFRESH_SECRET);

// ─── Exported config ──────────────────────────────────────────────────────────

/**
 * Validated and normalised environment configuration.
 * Import this instead of reading process.env directly in application code.
 */
const env = {
  /** HTTP port the server listens on. */
  PORT: parseInt(optional(process.env.PORT, '8000'), 10),

  /** Runtime environment (development | production | test). */
  NODE_ENV: optional(process.env.NODE_ENV, 'development'),

  // ── Database ────────────────────────────────────────────────────────────────
  /** Full PostgreSQL connection string (takes priority over individual vars). */
  DATABASE_URL: process.env.DATABASE_URL || null,

  DB_USER: process.env.DB_USER || null,
  DB_PASSWORD: process.env.DB_PASSWORD || null,
  DB_HOST: optional(process.env.DB_HOST, 'localhost'),
  DB_PORT: parseInt(optional(process.env.DB_PORT, '5432'), 10),
  DB_NAME: process.env.DB_NAME || null,
  /** Enable SSL for PostgreSQL when set to 'true'. */
  DB_SSL: process.env.DB_SSL === 'true',

  // ── JWT ─────────────────────────────────────────────────────────────────────
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  JWT_EXPIRES_IN: optional(process.env.JWT_EXPIRES_IN, '15m'),
  JWT_REFRESH_EXPIRES_IN: optional(process.env.JWT_REFRESH_EXPIRES_IN, '7d'),

  // ── CORS ────────────────────────────────────────────────────────────────────
  CORS_ORIGIN: optional(process.env.CORS_ORIGIN, 'http://localhost:5173'),

  // ── File upload ─────────────────────────────────────────────────────────────
  /** Maximum file size for uploads (e.g. "5mb"). */
  MAX_FILE_SIZE: optional(process.env.MAX_FILE_SIZE, '5mb'),
};

module.exports = env;
