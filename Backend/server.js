'use strict';

// ── Environment & Logging must load first ─────────────────────────────────────
const fs = require('fs');
const path = require('path');

// Ensure logs directory exists before Winston tries to write to it
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

// Load env config (throws if required vars are missing)
let env;
try {
  env = require('./src/config/env');
} catch (envErr) {
  console.error('[startup] Environment configuration error:', envErr.message);
  process.exit(1);
}

const logger = require('./src/utils/logger.util');
const { morganMiddleware } = require('./src/utils/logger.util');

// ── Express & Security Middleware ─────────────────────────────────────────────
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const { generalLimiter } = require('./src/middleware/rateLimit.middleware');
const errorHandler = require('./src/middleware/errorHandler.middleware');
const apiRoutes = require('./src/routes/index');

const app = express();

// Security headers
app.use(helmet({
  crossOriginEmbedderPolicy: false, // allow image embeds from CDN
}));

// CORS — restrict to known frontend origin
app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// HTTP request logging (Morgan → Winston)
app.use(morganMiddleware);

// Body parsers
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Serve uploaded files
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

// Global rate limiter (before routes)
app.use('/api', generalLimiter);

// ── Routes ────────────────────────────────────────────────────────────────────
// New clean-architecture routes under /api
app.use('/api', apiRoutes);

// Root health check
app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'TicketMandu API v2.0',
    docs: '/api/health',
    timestamp: new Date().toISOString(),
  });
});

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found', code: 'NOT_FOUND' });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use(errorHandler);

// ── Database bootstrap ────────────────────────────────────────────────────────
const db = require('./src/config/db');

const bootstrapDatabase = async () => {
  // Core tables — kept compatible with existing v1 schema
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id         SERIAL        PRIMARY KEY,
      name       VARCHAR(255)  NOT NULL,
      email      VARCHAR(255)  NOT NULL UNIQUE,
      password   VARCHAR(255)  NOT NULL,
      image      VARCHAR(255),
      role       VARCHAR(20)   NOT NULL DEFAULT 'user',
      created_at TIMESTAMP     NOT NULL DEFAULT NOW()
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS events (
      id          SERIAL          PRIMARY KEY,
      name        VARCHAR(255)    NOT NULL,
      date        VARCHAR(50),
      time        VARCHAR(20),
      venue       VARCHAR(255),
      price       DECIMAL(10,2),
      category    VARCHAR(50),
      icon        VARCHAR(10),
      featured    BOOLEAN         NOT NULL DEFAULT false,
      featured_bg VARCHAR(255),
      created_at  TIMESTAMP       NOT NULL DEFAULT NOW()
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS tickets (
      id         SERIAL       PRIMARY KEY,
      user_id    INTEGER      NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
      event_id   INTEGER      NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      status     VARCHAR(20)  NOT NULL DEFAULT 'upcoming',
      seat       VARCHAR(255) NOT NULL DEFAULT 'General Admission',
      created_at TIMESTAMP    NOT NULL DEFAULT NOW()
    )
  `);

  // Refresh tokens table (Phase 4 auth improvements)
  await db.query(`
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id         SERIAL       PRIMARY KEY,
      user_id    INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash VARCHAR(255) NOT NULL UNIQUE,
      is_revoked BOOLEAN      NOT NULL DEFAULT false,
      expires_at TIMESTAMP    NOT NULL,
      ip_address VARCHAR(45),
      created_at TIMESTAMP    NOT NULL DEFAULT NOW()
    )
  `);

  // Add role column if missing (migrating from v1)
  await db.query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'user'
  `).catch(() => {}); // PG may not support IF NOT EXISTS for ALTER — ignore error

  await db.query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP
  `).catch(() => {});

  // Seed events if empty
  const { rows } = await db.query('SELECT COUNT(*) FROM events');
  if (rows[0].count === '0') {
    await db.query(`
      INSERT INTO events (name, date, time, venue, price, category, icon, featured, featured_bg) VALUES
        ('Taylor Swift | The Eras Tour',        'Dec 15, 2026', '7:00 PM',  'SoFi Stadium, Los Angeles, CA',               250,  'Music',   '🎤', true,  'linear-gradient(135deg, #4a0080 0%, #7b1fa2 100%)'),
        ('NBA Finals 2027',                     'Jun 10, 2027', '8:00 PM',  'Chase Center, San Francisco, CA',             118,  'Sports',  '🏀', true,  'linear-gradient(135deg, #0d1b4b 0%, #1a3a6b 100%)'),
        ('Coldplay: Music of the Spheres Tour', 'Mar 22, 2027', '7:30 PM',  'Wembley Stadium, London',                     145,  'Music',   '🎸', true,  'linear-gradient(135deg, #1a237e 0%, #1565c0 100%)'),
        ('UEFA Champions League Final 2027',    'May 31, 2027', '8:45 PM',  'Allianz Arena, Munich, Germany',              320,  'Sports',  '⚽', true,  'linear-gradient(135deg, #004d40 0%, #00695c 100%)'),
        ('Ed Sheeran: Mathematics Tour',        'Nov 3, 2026',  '6:30 PM',  'Allegiant Stadium, Las Vegas, NV',             89,  'Music',   '🎵', false, null),
        ('Coachella Valley Music & Arts 2027',  'Apr 11, 2027', '12:00 PM', 'Empire Polo Club, Indio, CA',                499,  'Music',   '🎸', false, null),
        ('Billie Eilish: Hit Me Hard and Soft', 'Jan 14, 2027', '7:00 PM',  'Kia Forum, Inglewood, CA',                   110,  'Music',   '🎤', false, null),
        ('UFC 310: Championship Night',         'Dec 7, 2026',  '9:00 PM',  'T-Mobile Arena, Las Vegas, NV',              175,  'Sports',  '🥊', false, null),
        ('Hamilton — The Musical',              'Oct 20, 2026', '7:30 PM',  'Pantages Theatre, Hollywood, CA',             95,  'Arts',    '🎭', false, null),
        ('Dave Chappelle: Live Stand-Up',       'Aug 25, 2026', '9:00 PM',  'Hollywood Palladium, Los Angeles, CA',        85,  'Comedy',  '😂', false, null),
        ('Comedy Night Live: All-Stars',        'Jul 10, 2026', '9:00 PM',  'The Laugh Factory, Los Angeles, CA',          45,  'Comedy',  '😂', false, null),
        ('Cirque du Soleil: Alegría',           'Aug 3, 2026',  '5:00 PM',  'Royal Albert Hall, London',                  120,  'Family',  '🎪', false, null),
        ('Phantom of the Opera — Broadway',     'Sep 12, 2026', '7:00 PM',  'Majestic Theatre, New York, NY',             150,  'Theater', '🎭', false, null),
        ('The Lion King — West End',            'Nov 8, 2026',  '7:30 PM',  'Lyceum Theatre, London',                     115,  'Theater', '🦁', false, null),
        ('Kevin Hart: Reality Check Tour',      'Oct 18, 2026', '8:30 PM',  'Madison Square Garden, New York, NY',         95,  'Comedy',  '🎤', false, null),
        ('Disney On Ice: Frozen Adventure',     'Dec 20, 2026', '3:00 PM',  'Crypto.com Arena, Los Angeles, CA',           55,  'Family',  '❄️', false, null),
        ('Wimbledon Gentlemen''s Final 2027',   'Jul 13, 2027', '2:00 PM',  'All England Club, Wimbledon',                280,  'Sports',  '🎾', false, null),
        ('Formula 1: US Grand Prix 2026',       'Oct 19, 2026', '3:00 PM',  'Circuit of the Americas, Austin, TX',        220,  'Sports',  '🏎️', false, null),
        ('Beyoncé: Renaissance World Tour',     'Apr 28, 2027', '8:00 PM',  'AT&T Stadium, Arlington, TX',                195,  'Music',   '🎤', false, null),
        ('Van Gogh: The Immersive Experience',  'Sep 28, 2026', '11:00 AM', 'The Lighthouse, New York, NY',                42,  'Arts',    '🎨', false, null)
    `);
    logger.info('[db] Seeded initial events');
  }

  logger.info('[db] Database bootstrap complete');
};

// ── Graceful shutdown ─────────────────────────────────────────────────────────
const shutdown = async (signal) => {
  logger.info(`[server] Received ${signal}, shutting down gracefully`);
  try {
    await db.end();
  } catch {
    /* ignore pool shutdown errors */
  }
  process.exit(0);
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error('[server] Unhandled promise rejection', { reason: String(reason) });
});

process.on('uncaughtException', (err) => {
  logger.error('[server] Uncaught exception', { message: err.message, stack: err.stack });
  process.exit(1);
});

// ── Start ─────────────────────────────────────────────────────────────────────
const startServer = async () => {
  try {
    await db.checkConnection();
    await bootstrapDatabase();

    const PORT = env.PORT || 8000;
    app.listen(PORT, () => {
      logger.info(`[server] TicketMandu API running on http://localhost:${PORT}`);
      logger.info(`[server] Environment: ${env.NODE_ENV}`);
    });
  } catch (err) {
    logger.error('[server] Failed to start', { message: err.message });
    process.exit(1);
  }
};

startServer();
