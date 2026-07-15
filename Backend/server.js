"use strict";

// ── Environment & Logging must load first ─────────────────────────────────────
const fs = require("fs");
const path = require("path");

// Ensure logs directory exists before Winston tries to write to it
const logsDir = path.join(__dirname, "logs");
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

// Load env config (throws if required vars are missing)
let env;
try {
  env = require("./src/config/env");
} catch (envErr) {
  console.error("[startup] Environment configuration error:", envErr.message);
  process.exit(1);
}

const logger = require("./src/utils/logger.util");
const { morganMiddleware } = require("./src/utils/logger.util");

// ── Express & Security Middleware ─────────────────────────────────────────────
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const { generalLimiter } = require("./src/middleware/rateLimit.middleware");
const errorHandler = require("./src/middleware/errorHandler.middleware");
const apiRoutes = require("./src/routes/index");

const app = express();

// Security headers
app.use(
  helmet({
    crossOriginEmbedderPolicy: false, // allow image embeds from CDN
  }),
);

// CORS — restrict to known frontend origin
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// HTTP request logging (Morgan → Winston)
app.use(morganMiddleware);

// Body parsers
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

// Serve uploaded files
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use("/uploads", express.static(uploadsDir));

// No global API limiter: normal CRUD/profile/booking/dashboard usage should not
// lock users out. Auth/security-sensitive routes attach dedicated limiters.

// ── Routes ────────────────────────────────────────────────────────────────────
// New clean-architecture routes under /api
app.use("/api", apiRoutes);

// Root health check
app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "TicketMandu API v2.0",
    docs: "/api/health",
    timestamp: new Date().toISOString(),
  });
});

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res
    .status(404)
    .json({ success: false, message: "Route not found", code: "NOT_FOUND" });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use(errorHandler);

// ── Database bootstrap ────────────────────────────────────────────────────────
const db = require("./src/config/db");

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

  // Additive schema upgrades for the business-ready ticketing model.
  await db
    .query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(60)`)
    .catch(() => {});
  await db
    .query(
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_unique ON users (LOWER(username)) WHERE username IS NOT NULL`,
    )
    .catch(() => {});
  await db
    .query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20)`)
    .catch(() => {});
  await db
    .query(
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true`,
    )
    .catch(() => {});
  await db
    .query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP`)
    .catch(() => {});
  await db
    .query(
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW()`,
    )
    .catch(() => {});

  await db
    .query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS slug VARCHAR(300)`)
    .catch(() => {});
  await db
    .query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS organizer_id INTEGER`)
    .catch(() => {});
  await db
    .query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS venue_id INTEGER`)
    .catch(() => {});
  await db
    .query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS description TEXT`)
    .catch(() => {});
  await db
    .query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS cover_image_url TEXT`)
    .catch(() => {});
  await db
    .query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS starts_at TIMESTAMP`)
    .catch(() => {});
  await db
    .query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS ends_at TIMESTAMP`)
    .catch(() => {});
  await db
    .query(
      `ALTER TABLE events ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'published'`,
    )
    .catch(() => {});
  await db
    .query(
      `ALTER TABLE events ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false`,
    )
    .catch(() => {});
  await db
    .query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS total_capacity INTEGER`)
    .catch(() => {});
  await db
    .query(
      `ALTER TABLE events ADD COLUMN IF NOT EXISTS tickets_sold INTEGER NOT NULL DEFAULT 0`,
    )
    .catch(() => {});
  await db
    .query(
      `ALTER TABLE events ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW()`,
    )
    .catch(() => {});
  await db
    .query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP`)
    .catch(() => {});

  await db.query(`
    CREATE TABLE IF NOT EXISTS venues (
      id SERIAL PRIMARY KEY,
      name VARCHAR(200) NOT NULL,
      slug VARCHAR(200) NOT NULL UNIQUE,
      address VARCHAR(255),
      city VARCHAR(100) NOT NULL DEFAULT 'Kathmandu',
      country VARCHAR(100) NOT NULL DEFAULT 'Nepal',
      capacity INTEGER,
      image_url TEXT,
      map_url TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
      deleted_at TIMESTAMP
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS event_categories (
      id SMALLSERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      slug VARCHAR(100) NOT NULL UNIQUE,
      icon VARCHAR(50),
      sort_order SMALLINT NOT NULL DEFAULT 0,
      is_active BOOLEAN NOT NULL DEFAULT true
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS organizers (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      organization_name VARCHAR(200) NOT NULL,
      slug VARCHAR(200) NOT NULL UNIQUE,
      description TEXT,
      logo_url TEXT,
      website TEXT,
      is_verified BOOLEAN NOT NULL DEFAULT false,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
      deleted_at TIMESTAMP
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS event_images (
      id SERIAL PRIMARY KEY,
      event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      url TEXT NOT NULL,
      alt_text VARCHAR(255),
      sort_order SMALLINT NOT NULL DEFAULT 0,
      is_cover BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS ticket_types (
      id SERIAL PRIMARY KEY,
      event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      price DECIMAL(10,2) NOT NULL,
      currency CHAR(3) NOT NULL DEFAULT 'NPR',
      quantity INTEGER NOT NULL DEFAULT 100,
      quantity_sold INTEGER NOT NULL DEFAULT 0,
      max_per_order SMALLINT NOT NULL DEFAULT 10,
      sale_starts_at TIMESTAMP,
      sale_ends_at TIMESTAMP,
      is_active BOOLEAN NOT NULL DEFAULT true,
      sort_order SMALLINT NOT NULL DEFAULT 0
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      order_number VARCHAR(30) NOT NULL UNIQUE,
      status VARCHAR(20) NOT NULL DEFAULT 'pending',
      subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
      service_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
      discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
      total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
      currency CHAR(3) NOT NULL DEFAULT 'NPR',
      expires_at TIMESTAMP,
      confirmed_at TIMESTAMP,
      cancelled_at TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
      deleted_at TIMESTAMP
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS order_items (
      id SERIAL PRIMARY KEY,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE RESTRICT,
      ticket_type_id INTEGER NOT NULL REFERENCES ticket_types(id) ON DELETE RESTRICT,
      quantity INTEGER NOT NULL CHECK (quantity > 0),
      unit_price NUMERIC(10,2) NOT NULL,
      subtotal NUMERIC(10,2) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS payments (
      id SERIAL PRIMARY KEY,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      payment_method VARCHAR(20) NOT NULL DEFAULT 'mock',
      status VARCHAR(20) NOT NULL DEFAULT 'pending',
      amount NUMERIC(10,2) NOT NULL,
      currency CHAR(3) NOT NULL DEFAULT 'NPR',
      gateway_reference VARCHAR(255),
      gateway_payload JSONB,
      refunded_at TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  await db
    .query(
      `
    ALTER TABLE tickets ADD COLUMN IF NOT EXISTS ticket_number VARCHAR(40)
  `,
    )
    .catch(() => {});
  await db
    .query(
      `
    ALTER TABLE tickets ADD COLUMN IF NOT EXISTS qr_code_value VARCHAR(255)
  `,
    )
    .catch(() => {});
  await db
    .query(
      `
    ALTER TABLE tickets ADD COLUMN IF NOT EXISTS order_id INTEGER
  `,
    )
    .catch(() => {});
  await db
    .query(
      `
    ALTER TABLE tickets ADD COLUMN IF NOT EXISTS ticket_type_id INTEGER
  `,
    )
    .catch(() => {});
  await db
    .query(
      `
    ALTER TABLE tickets ADD COLUMN IF NOT EXISTS seat_id INTEGER
  `,
    )
    .catch(() => {});
  await db
    .query(
      `
    ALTER TABLE tickets ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMP
  `,
    )
    .catch(() => {});
  await db
    .query(
      `
    ALTER TABLE tickets ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP
  `,
    )
    .catch(() => {});
  await db
    .query(
      `
    ALTER TABLE tickets ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW()
  `,
    )
    .catch(() => {});

  await db.query(`
    CREATE TABLE IF NOT EXISTS favorites (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      PRIMARY KEY (user_id, event_id)
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS reviews (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
      body TEXT,
      is_visible BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
      UNIQUE (user_id, event_id)
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type VARCHAR(50) NOT NULL,
      title VARCHAR(255) NOT NULL,
      body TEXT NOT NULL,
      data JSONB,
      is_read BOOLEAN NOT NULL DEFAULT false,
      read_at TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS user_preferences (
      user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      email_notifications BOOLEAN NOT NULL DEFAULT true,
      booking_notifications BOOLEAN NOT NULL DEFAULT true,
      payment_notifications BOOLEAN NOT NULL DEFAULT true,
      ticket_notifications BOOLEAN NOT NULL DEFAULT true,
      event_reminders BOOLEAN NOT NULL DEFAULT true,
      promotional_notifications BOOLEAN NOT NULL DEFAULT false,
      in_app_toasts BOOLEAN NOT NULL DEFAULT true,
      theme VARCHAR(20) NOT NULL DEFAULT 'system',
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS user_locations (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      label VARCHAR(80) NOT NULL,
      city VARCHAR(100) NOT NULL,
      area VARCHAR(120),
      address VARCHAR(255) NOT NULL,
      latitude NUMERIC(10,7),
      longitude NUMERIC(10,7),
      is_default BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
      deleted_at TIMESTAMP
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS user_payment_methods (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      method_type VARCHAR(30) NOT NULL,
      provider VARCHAR(80),
      label VARCHAR(100) NOT NULL,
      last4 VARCHAR(4),
      is_default BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
      deleted_at TIMESTAMP
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id BIGSERIAL PRIMARY KEY,
      actor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      actor_ip VARCHAR(45),
      action VARCHAR(100) NOT NULL,
      resource_type VARCHAR(50),
      resource_id INTEGER,
      old_values JSONB,
      new_values JSONB,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS seat_maps (
      id SERIAL PRIMARY KEY,
      venue_id INTEGER REFERENCES venues(id) ON DELETE SET NULL,
      name VARCHAR(200) NOT NULL,
      rows SMALLINT NOT NULL DEFAULT 10,
      seats_per_row SMALLINT NOT NULL DEFAULT 20,
      map_config JSONB,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS seats (
      id SERIAL PRIMARY KEY,
      seat_map_id INTEGER NOT NULL REFERENCES seat_maps(id) ON DELETE CASCADE,
      row_label VARCHAR(5) NOT NULL,
      seat_number SMALLINT NOT NULL,
      section VARCHAR(50),
      category VARCHAR(50) NOT NULL DEFAULT 'general',
      is_blocked BOOLEAN NOT NULL DEFAULT false,
      UNIQUE (seat_map_id, row_label, seat_number)
    )
  `);

  await db
    .query(`ALTER TABLE venues ADD COLUMN IF NOT EXISTS latitude NUMERIC(10,7)`)
    .catch(() => {});
  await db
    .query(
      `ALTER TABLE venues ADD COLUMN IF NOT EXISTS longitude NUMERIC(10,7)`,
    )
    .catch(() => {});
  await db
    .query(
      `ALTER TABLE venues ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'active'`,
    )
    .catch(() => {});

  await db
    .query(
      `ALTER TABLE event_categories ADD COLUMN IF NOT EXISTS description TEXT`,
    )
    .catch(() => {});

  await db
    .query(
      `ALTER TABLE seats ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'available'`,
    )
    .catch(() => {});

  await db.query(`
    CREATE TABLE IF NOT EXISTS coupons (
      id SERIAL PRIMARY KEY,
      code VARCHAR(40) NOT NULL UNIQUE,
      discount_type VARCHAR(20) NOT NULL DEFAULT 'percentage',
      discount_value NUMERIC(10,2) NOT NULL DEFAULT 0,
      usage_limit INTEGER,
      used_count INTEGER NOT NULL DEFAULT 0,
      starts_at TIMESTAMP,
      expires_at TIMESTAMP,
      event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
      deleted_at TIMESTAMP
    )
  `);

  await db
    .query(`CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons (code)`)
    .catch(() => {});
  await db
    .query(
      `CREATE INDEX IF NOT EXISTS idx_coupons_event_id ON coupons (event_id)`,
    )
    .catch(() => {});

  await db
    .query(`CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders (user_id)`)
    .catch(() => {});
  await db
    .query(`CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status)`)
    .catch(() => {});
  await db
    .query(
      `CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments (order_id)`,
    )
    .catch(() => {});
  await db
    .query(
      `CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments (user_id)`,
    )
    .catch(() => {});
  await db
    .query(
      `CREATE INDEX IF NOT EXISTS idx_tickets_order_id ON tickets (order_id)`,
    )
    .catch(() => {});
  await db
    .query(
      `CREATE INDEX IF NOT EXISTS idx_tickets_ticket_number ON tickets (ticket_number)`,
    )
    .catch(() => {});

  // Add role column if missing (migrating from v1)
  await db
    .query(
      `
    ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'user'
  `,
    )
    .catch(() => {}); // PG may not support IF NOT EXISTS for ALTER — ignore error

  await db
    .query(
      `
    ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP
  `,
    )
    .catch(() => {});

  await db
    .query(
      `
    UPDATE event_categories SET is_active = true WHERE is_active IS NULL
  `,
    )
    .catch(() => {});

  // Seed events if empty
  const { rows } = await db.query("SELECT COUNT(*) FROM events");
  if (rows[0].count === "0") {
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
    logger.info("[db] Seeded initial events");
  }

  const { rows: categoryRows } = await db.query(
    "SELECT COUNT(*) FROM event_categories",
  );
  if (categoryRows[0].count === "0") {
    await db.query(`
      INSERT INTO event_categories (name, slug, icon, sort_order) VALUES
        ('Music', 'music', '🎵', 1),
        ('Sports', 'sports', '⚽', 2),
        ('Arts', 'arts', '🎨', 3),
        ('Comedy', 'comedy', '😂', 4),
        ('Family', 'family', '👨‍👩‍👧', 5),
        ('Theater', 'theater', '🎭', 6)
    `);
  }

  const { hashPassword } = require("./src/utils/hash.util");
  const demoPasswordHash = await hashPassword("Demo@1234");
  await db
    .query(
      `INSERT INTO users (name, username, email, password, role, is_active)
     VALUES
       ('TicketMandu Admin', 'admin', 'admin@ticketmandu.com', $1, 'admin', true),
       ('TicketMandu Organizer', 'organizer', 'organizer@ticketmandu.com', $1, 'organizer', true),
       ('TicketMandu User', 'demo_user', 'user@ticketmandu.com', $1, 'user', true)
     ON CONFLICT (email) DO NOTHING`,
      [demoPasswordHash],
    )
    .catch(() => {});

  await db
    .query(
      `
    INSERT INTO venues (name, slug, address, city, country, capacity, status)
    VALUES
      ('Kathmandu Arena', 'kathmandu-arena', 'Tripureshwor', 'Kathmandu', 'Nepal', 12000, 'active'),
      ('Patan Expo Center', 'patan-expo-center', 'Pulchowk', 'Lalitpur', 'Nepal', 4500, 'active')
    ON CONFLICT (slug) DO NOTHING
  `,
    )
    .catch(() => {});

  await db
    .query(
      `
    INSERT INTO organizers (user_id, organization_name, slug, description, website, is_verified, is_active)
    SELECT u.id, 'TicketMandu Live', 'ticketmandu-live', 'Official demo organizer for TicketMandu events.', 'https://ticketmandu.local', true, true
    FROM users u
    WHERE u.email = 'organizer@ticketmandu.com'
    ON CONFLICT (slug) DO NOTHING
  `,
    )
    .catch(() => {});

  await db
    .query(
      `
    UPDATE events e
    SET organizer_id = o.id,
        description = COALESCE(e.description, 'A premium live event experience curated by TicketMandu with secure booking, digital tickets, and fast entry.'),
        status = COALESCE(e.status, 'published'),
        total_capacity = COALESCE(e.total_capacity, 1000)
    FROM organizers o
    JOIN users u ON u.id = o.user_id
    WHERE u.email = 'organizer@ticketmandu.com'
      AND (e.organizer_id IS NULL OR e.organizer_id = u.id OR e.organizer_id IN (SELECT id FROM organizers WHERE slug = 'ticketmandu-live'))
  `,
    )
    .catch(() => {});

  await db
    .query(
      `
    INSERT INTO ticket_types (event_id, name, description, price, currency, quantity, quantity_sold, max_per_order, is_active, sort_order)
    SELECT e.id, 'General Admission', 'Standard entry with access to the main event area.', e.price, 'NPR', 250, 0, 6, true, 1
    FROM events e
    WHERE e.deleted_at IS NULL
      AND NOT EXISTS (SELECT 1 FROM ticket_types tt WHERE tt.event_id = e.id AND tt.name = 'General Admission')
  `,
    )
    .catch(() => {});

  await db
    .query(
      `
    INSERT INTO ticket_types (event_id, name, description, price, currency, quantity, quantity_sold, max_per_order, is_active, sort_order)
    SELECT e.id, 'VIP', 'Priority entry and premium viewing area.', ROUND((COALESCE(e.price, 50) * 1.8)::numeric, 2), 'NPR', 80, 0, 4, true, 2
    FROM events e
    WHERE e.featured = true
      AND e.deleted_at IS NULL
      AND NOT EXISTS (SELECT 1 FROM ticket_types tt WHERE tt.event_id = e.id AND tt.name = 'VIP')
  `,
    )
    .catch(() => {});

  logger.info("[db] Database bootstrap complete");
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
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

process.on("unhandledRejection", (reason) => {
  logger.error("[server] Unhandled promise rejection", {
    reason: String(reason),
  });
});

process.on("uncaughtException", (err) => {
  logger.error("[server] Uncaught exception", {
    message: err.message,
    stack: err.stack,
  });
  process.exit(1);
});

// ── Start ─────────────────────────────────────────────────────────────────────
const startServer = async () => {
  try {
    await db.checkConnection();
    await bootstrapDatabase();

    const PORT = env.PORT || 8000;
    app.listen(PORT, () => {
      logger.info(
        `[server] TicketMandu API running on http://localhost:${PORT}`,
      );
      logger.info(`[server] Environment: ${env.NODE_ENV}`);
    });
  } catch (err) {
    logger.error("[server] Failed to start", { message: err.message });
    process.exit(1);
  }
};

startServer();
