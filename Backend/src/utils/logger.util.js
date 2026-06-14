'use strict';

/**
 * @fileoverview Winston logger and Morgan HTTP middleware for TicketMandu.
 *
 * Log levels (in priority order):
 *   error > warn > info > http > debug
 *
 * Transports:
 *   - Console (colorized)  — disabled in production
 *   - File: logs/error.log — error level only
 *   - File: logs/combined.log — all levels
 *
 * Usage:
 *   const { logger, morganMiddleware } = require('./logger.util');
 *   logger.info('Server started');
 *   app.use(morganMiddleware);
 */

const path = require('path');
const winston = require('winston');
const morgan = require('morgan');

const { combine, timestamp, colorize, printf, json, errors } = winston.format;

const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';

// ─── Log directory ────────────────────────────────────────────────────────────
// Resolve relative to the project root (two levels up from src/utils/).
const LOG_DIR = path.resolve(__dirname, '../../logs');

// ─── Custom format for console ────────────────────────────────────────────────

/**
 * Single-line human-readable format for the console transport.
 * Output example: [ERROR] 2024-01-15T12:00:00.000Z Failed to connect to DB
 */
const consoleFormat = printf(({ level, message, timestamp: ts, stack, ...meta }) => {
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  const body = stack || message;
  return `[${level.toUpperCase()}] ${ts} ${body}${metaStr}`;
});

// ─── Shared formats ───────────────────────────────────────────────────────────

const sharedFormats = combine(
  errors({ stack: true }), // Capture stack traces on Error objects.
  timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' })
);

// ─── Transports ───────────────────────────────────────────────────────────────

const transports = [
  // Error-only file — keeps error log small and easy to grep.
  new winston.transports.File({
    filename: path.join(LOG_DIR, 'error.log'),
    level: 'error',
    format: combine(sharedFormats, json()),
    maxsize: 10 * 1024 * 1024, // 10 MB rotation
    maxFiles: 5,
  }),

  // Combined file — all log levels.
  new winston.transports.File({
    filename: path.join(LOG_DIR, 'combined.log'),
    format: combine(sharedFormats, json()),
    maxsize: 20 * 1024 * 1024, // 20 MB rotation
    maxFiles: 10,
  }),
];

// Console transport is only active outside production to avoid log noise in
// environments where structured JSON logs are ingested by a log aggregator.
if (!isProduction) {
  transports.push(
    new winston.transports.Console({
      format: combine(
        colorize({ all: true }),
        sharedFormats,
        consoleFormat
      ),
    })
  );
}

// ─── Logger instance ──────────────────────────────────────────────────────────

/**
 * Application-wide Winston logger.
 * @type {import('winston').Logger}
 */
const logger = winston.createLogger({
  level: isProduction ? 'info' : 'debug',
  levels: winston.config.npm.levels, // error, warn, info, http, verbose, debug, silly
  transports,
  // Prevent Winston from exiting the process on uncaught exceptions in tests.
  exitOnError: false,
});

// ─── Morgan HTTP middleware ───────────────────────────────────────────────────

/**
 * Write stream that pipes Morgan output into the Winston http level.
 * @type {NodeJS.WritableStream}
 */
const morganStream = {
  /**
   * @param {string} message - Morgan-formatted log line.
   */
  write: (message) => {
    // Morgan appends a newline — strip it so Winston formatting is clean.
    logger.http(message.trim());
  },
};

/**
 * Express middleware that logs every incoming HTTP request via Morgan.
 * Format: :method :url :status :res[content-length] - :response-time ms
 * Skip logging for health-check endpoints to reduce noise.
 */
const morganMiddleware = morgan(
  ':method :url :status :res[content-length] - :response-time ms',
  {
    stream: morganStream,
    skip: (req) => req.url === '/health' || req.url === '/favicon.ico',
  }
);

module.exports = logger;
module.exports.morganMiddleware = morganMiddleware;
