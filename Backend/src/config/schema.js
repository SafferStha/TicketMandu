"use strict";

/**
 * @fileoverview Database schema creation and migrations.
 * Creates all tables, adds columns via additive ALTER TABLE statements,
 * and creates indexes. All operations are idempotent (IF NOT EXISTS / .catch).
 */

const db = require("./db");
const logger = require("../utils/logger.util");

/**
 * Create core tables that existed in the v1 schema.
 */
const createCoreTables = async () => {
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
};

/**
 * Apply additive column migrations to users table.
 */
const migrateUsersTable = async () => {
  const alterations = [
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(60)`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20)`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW()`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'user'`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP`,
  ];

  for (const sql of alterations) {
    await db.query(sql).catch(() => {});
  }

  await db
    .query(
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_unique ON users (LOWER(username)) WHERE username IS NOT NULL`,
    )
    .catch(() => {});
};

/**
 * Apply additive column migrations to events table.
 */
const migrateEventsTable = async () => {
  const alterations = [
    `ALTER TABLE events ADD COLUMN IF NOT EXISTS slug VARCHAR(300)`,
    `ALTER TABLE events ADD COLUMN IF NOT EXISTS organizer_id INTEGER`,
    `ALTER TABLE events ADD COLUMN IF NOT EXISTS venue_id INTEGER`,
    `ALTER TABLE events ADD COLUMN IF NOT EXISTS description TEXT`,
    `ALTER TABLE events ADD COLUMN IF NOT EXISTS cover_image_url TEXT`,
    `ALTER TABLE events ADD COLUMN IF NOT EXISTS starts_at TIMESTAMP`,
    `ALTER TABLE events ADD COLUMN IF NOT EXISTS ends_at TIMESTAMP`,
    `ALTER TABLE events ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'published'`,
    `ALTER TABLE events ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false`,
    `ALTER TABLE events ADD COLUMN IF NOT EXISTS total_capacity INTEGER`,
    `ALTER TABLE events ADD COLUMN IF NOT EXISTS tickets_sold INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE events ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW()`,
    `ALTER TABLE events ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP`,
  ];

  for (const sql of alterations) {
    await db.query(sql).catch(() => {});
  }
};

/**
 * Apply additive column migrations to tickets table.
 */
const migrateTicketsTable = async () => {
  const alterations = [
    `ALTER TABLE tickets ADD COLUMN IF NOT EXISTS ticket_number VARCHAR(40)`,
    `ALTER TABLE tickets ADD COLUMN IF NOT EXISTS qr_code_value VARCHAR(255)`,
    `ALTER TABLE tickets ADD COLUMN IF NOT EXISTS order_id INTEGER`,
    `ALTER TABLE tickets ADD COLUMN IF NOT EXISTS ticket_type_id INTEGER`,
    `ALTER TABLE tickets ADD COLUMN IF NOT EXISTS seat_id INTEGER`,
    `ALTER TABLE tickets ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMP`,
    `ALTER TABLE tickets ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP`,
    `ALTER TABLE tickets ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW()`,
  ];

  for (const sql of alterations) {
    await db.query(sql).catch(() => {});
  }
};

/**
 * Create v2 tables (venues, categories, organizers, orders, etc.).
 */
const createV2Tables = async () => {
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
};

/**
 * Apply additive column migrations to v2 tables.
 */
const migrateV2Tables = async () => {
  const alterations = [
    `ALTER TABLE venues ADD COLUMN IF NOT EXISTS latitude NUMERIC(10,7)`,
    `ALTER TABLE venues ADD COLUMN IF NOT EXISTS longitude NUMERIC(10,7)`,
    `ALTER TABLE venues ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'active'`,
    `ALTER TABLE event_categories ADD COLUMN IF NOT EXISTS description TEXT`,
    `ALTER TABLE seats ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'available'`,
  ];

  for (const sql of alterations) {
    await db.query(sql).catch(() => {});
  }
};

/**
 * Create performance indexes.
 */
const createIndexes = async () => {
  const indexes = [
    `CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons (code)`,
    `CREATE INDEX IF NOT EXISTS idx_coupons_event_id ON coupons (event_id)`,
    `CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders (user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status)`,
    `CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments (order_id)`,
    `CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments (user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_tickets_order_id ON tickets (order_id)`,
    `CREATE INDEX IF NOT EXISTS idx_tickets_ticket_number ON tickets (ticket_number)`,
  ];

  for (const sql of indexes) {
    await db.query(sql).catch(() => {});
  }
};

/**
 * Run all schema creation and migration steps.
 */
const applySchema = async () => {
  logger.info("[db] Applying schema...");

  await createCoreTables();
  await migrateUsersTable();
  await migrateEventsTable();
  await createV2Tables();
  await migrateTicketsTable();
  await migrateV2Tables();
  await createIndexes();

  logger.info("[db] Schema applied successfully");
};

module.exports = applySchema;
