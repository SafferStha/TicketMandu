'use strict';

/**
 * @fileoverview PostgreSQL connection pool.
 * Supports DATABASE_URL (connection string) or individual DB_* variables.
 * Performs a health-check query on startup so misconfiguration fails fast.
 */

const { Pool } = require('pg');
const env = require('./env');
const logger = require('../utils/logger.util');

// ─── Guard against accidental HTTP URLs ───────────────────────────────────────
if (env.DATABASE_URL) {
  const lower = env.DATABASE_URL.toLowerCase();
  if (lower.startsWith('http://') || lower.startsWith('https://')) {
    throw new Error(
      '[db] DATABASE_URL looks like an HTTP URL. ' +
        'It must be a PostgreSQL connection string: postgres://user:pass@host:port/db'
    );
  }
}

/**
 * Determine whether SSL should be used for this connection.
 * Rules:
 *  - SSL is only enabled when DB_SSL=true.
 *  - SSL is never used when the host is localhost / 127.0.0.1.
 * @returns {object|boolean} SSL config object or false.
 */
const buildSslConfig = () => {
  if (!env.DB_SSL) return false;

  // Derive host from DATABASE_URL when individual vars are not set.
  let host = env.DB_HOST || '';
  if (env.DATABASE_URL) {
    try {
      host = new URL(env.DATABASE_URL).hostname;
    } catch {
      // Malformed URL – fall back to empty string; Pool will reject it later.
    }
  }

  const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '::1';
  if (isLocal) return false;

  // Disable certificate verification for managed cloud DBs that use self-signed certs.
  return { rejectUnauthorized: false };
};

// ─── Pool configuration ───────────────────────────────────────────────────────

/** @type {import('pg').PoolConfig} */
const poolConfig = env.DATABASE_URL
  ? {
      connectionString: env.DATABASE_URL,
      ssl: buildSslConfig(),
      max: 20,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    }
  : {
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      host: env.DB_HOST,
      port: env.DB_PORT,
      database: env.DB_NAME,
      ssl: buildSslConfig(),
      max: 20,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    };

const pool = new Pool(poolConfig);

// ─── Pool-level error listener ────────────────────────────────────────────────
pool.on('error', (err) => {
  logger.error('[db] Unexpected pool client error', { message: err.message, stack: err.stack });
});

pool.on('connect', () => {
  logger.debug('[db] New client connected to the pool');
});

// ─── Health check ─────────────────────────────────────────────────────────────

/**
 * Run a lightweight health check against the database.
 * Called once during server startup so configuration problems surface immediately.
 * @returns {Promise<void>}
 * @throws {Error} When the database cannot be reached.
 */
const checkConnection = async () => {
  let client;
  try {
    client = await pool.connect();
    const { rows } = await client.query('SELECT NOW() AS now, current_database() AS db');
    logger.info(`[db] Connected to PostgreSQL — database: "${rows[0].db}", time: ${rows[0].now}`);
  } catch (err) {
    logger.error('[db] Database health check failed', { message: err.message });
    throw err;
  } finally {
    if (client) client.release();
  }
};

module.exports = pool;
module.exports.checkConnection = checkConnection;
