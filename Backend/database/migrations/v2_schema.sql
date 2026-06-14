-- =====================================================================
--  TicketMandu · v1 → v2 Migration
--  Run AFTER the v1 schema (database.sql) has been applied.
--  Compatible with: PostgreSQL 12+
--
--  This migration is ADDITIVE — it does not drop existing tables.
--  All new columns use safe defaults so existing rows remain valid.
--
--  Execution order:
--    psql -U <user> -d ticketmandu -f database/migrations/v2_schema.sql
-- =====================================================================

BEGIN;

-- ─── EXTENSION ────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── STEP 1: Augment users table ─────────────────────────────────────────────
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS role                VARCHAR(20)  NOT NULL DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS phone               VARCHAR(20),
  ADD COLUMN IF NOT EXISTS email_verified      BOOLEAN      NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_verified_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_active           BOOLEAN      NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS failed_login_count  SMALLINT     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS locked_until        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_login_at       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_at          TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW();

-- Rename password → password_hash for clarity (safe rename)
-- DO $$ BEGIN
--   IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='password') THEN
--     ALTER TABLE users RENAME COLUMN password TO password_hash;
--   END IF;
-- END $$;

-- Indexes on users
CREATE INDEX IF NOT EXISTS idx_users_email      ON users (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_users_role       ON users (role);
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users (deleted_at) WHERE deleted_at IS NOT NULL;

-- ─── STEP 2: Refresh tokens table ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id           SERIAL        PRIMARY KEY,
    user_id      INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash   VARCHAR(255)  NOT NULL UNIQUE,
    is_revoked   BOOLEAN       NOT NULL DEFAULT false,
    expires_at   TIMESTAMPTZ   NOT NULL,
    ip_address   VARCHAR(45),
    user_agent   TEXT,
    created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id    ON refresh_tokens (user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens (expires_at);

-- ─── STEP 3: Venues table ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS venues (
    id            SERIAL        PRIMARY KEY,
    name          VARCHAR(200)  NOT NULL,
    slug          VARCHAR(200)  NOT NULL UNIQUE,
    address       VARCHAR(255),
    city          VARCHAR(100)  NOT NULL DEFAULT 'Kathmandu',
    state         VARCHAR(100),
    country       VARCHAR(100)  NOT NULL DEFAULT 'Nepal',
    postal_code   VARCHAR(20),
    latitude      NUMERIC(10,7),
    longitude     NUMERIC(10,7),
    capacity      INTEGER,
    website       TEXT,
    image_url     TEXT,
    created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ─── STEP 4: Organizers table ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS organizers (
    id                SERIAL        PRIMARY KEY,
    user_id           INTEGER       NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    organization_name VARCHAR(200)  NOT NULL,
    slug              VARCHAR(200)  NOT NULL UNIQUE,
    description       TEXT,
    logo_url          TEXT,
    website           TEXT,
    is_verified       BOOLEAN       NOT NULL DEFAULT false,
    verified_at       TIMESTAMPTZ,
    created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ─── STEP 5: Event categories ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS event_categories (
    id         SMALLSERIAL   PRIMARY KEY,
    name       VARCHAR(100)  NOT NULL UNIQUE,
    slug       VARCHAR(100)  NOT NULL UNIQUE,
    icon       VARCHAR(50),
    color      VARCHAR(20),
    sort_order SMALLINT      NOT NULL DEFAULT 0,
    is_active  BOOLEAN       NOT NULL DEFAULT true
);

INSERT INTO event_categories (name, slug, icon, sort_order) VALUES
    ('Music',    'music',    '🎵', 1),
    ('Sports',   'sports',   '⚽', 2),
    ('Arts',     'arts',     '🎭', 3),
    ('Comedy',   'comedy',   '😂', 4),
    ('Family',   'family',   '🎪', 5),
    ('Theater',  'theater',  '🎬', 6),
    ('Tech',     'tech',     '💻', 7),
    ('Food',     'food',     '🍕', 8)
ON CONFLICT (slug) DO NOTHING;

-- ─── STEP 6: Augment events table ────────────────────────────────────────────
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS organizer_id      INTEGER REFERENCES organizers(id),
  ADD COLUMN IF NOT EXISTS category_id       SMALLINT REFERENCES event_categories(id),
  ADD COLUMN IF NOT EXISTS venue_id          INTEGER REFERENCES venues(id),
  ADD COLUMN IF NOT EXISTS slug              VARCHAR(300),
  ADD COLUMN IF NOT EXISTS description       TEXT,
  ADD COLUMN IF NOT EXISTS short_description VARCHAR(500),
  ADD COLUMN IF NOT EXISTS cover_image_url   TEXT,
  ADD COLUMN IF NOT EXISTS starts_at         TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ends_at           TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS status            VARCHAR(20)  NOT NULL DEFAULT 'published',
  ADD COLUMN IF NOT EXISTS is_featured       BOOLEAN,
  ADD COLUMN IF NOT EXISTS total_capacity    INTEGER,
  ADD COLUMN IF NOT EXISTS tickets_sold      INTEGER      NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_online         BOOLEAN      NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS online_url        TEXT,
  ADD COLUMN IF NOT EXISTS updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS deleted_at        TIMESTAMPTZ;

-- Sync is_featured from featured column
UPDATE events SET is_featured = featured WHERE is_featured IS NULL;

-- Indexes on events
CREATE INDEX IF NOT EXISTS idx_events_status     ON events (status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_events_featured   ON events (is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_events_starts_at  ON events (starts_at);
CREATE INDEX IF NOT EXISTS idx_events_category   ON events (LOWER(category));

-- ─── STEP 7: Event images ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS event_images (
    id          SERIAL       PRIMARY KEY,
    event_id    INTEGER      NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    url         TEXT         NOT NULL,
    alt_text    VARCHAR(255),
    sort_order  SMALLINT     NOT NULL DEFAULT 0,
    is_cover    BOOLEAN      NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─── STEP 8: Ticket types ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ticket_types (
    id              SERIAL        PRIMARY KEY,
    event_id        INTEGER       NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name            VARCHAR(100)  NOT NULL,
    description     TEXT,
    price           NUMERIC(10,2) NOT NULL,
    currency        CHAR(3)       NOT NULL DEFAULT 'NPR',
    quantity        INTEGER       NOT NULL DEFAULT 100,
    quantity_sold   INTEGER       NOT NULL DEFAULT 0,
    max_per_order   SMALLINT      NOT NULL DEFAULT 10,
    sale_starts_at  TIMESTAMPTZ,
    sale_ends_at    TIMESTAMPTZ,
    is_active       BOOLEAN       NOT NULL DEFAULT true,
    sort_order      SMALLINT      NOT NULL DEFAULT 0,
    CONSTRAINT chk_quantity CHECK (quantity_sold <= quantity)
);

-- ─── STEP 9: Orders ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
    id             SERIAL        PRIMARY KEY,
    user_id        INTEGER       NOT NULL REFERENCES users(id),
    order_number   VARCHAR(25)   NOT NULL UNIQUE,
    status         VARCHAR(20)   NOT NULL DEFAULT 'pending',
    subtotal       NUMERIC(10,2) NOT NULL,
    service_fee    NUMERIC(10,2) NOT NULL DEFAULT 0,
    total          NUMERIC(10,2) NOT NULL,
    currency       CHAR(3)       NOT NULL DEFAULT 'NPR',
    notes          TEXT,
    expires_at     TIMESTAMPTZ,
    confirmed_at   TIMESTAMPTZ,
    cancelled_at   TIMESTAMPTZ,
    created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders (user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status  ON orders (status);

-- ─── STEP 10: Order items ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
    id              SERIAL        PRIMARY KEY,
    order_id        INTEGER       NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    ticket_type_id  INTEGER       NOT NULL REFERENCES ticket_types(id),
    quantity        SMALLINT      NOT NULL CHECK (quantity > 0),
    unit_price      NUMERIC(10,2) NOT NULL,
    subtotal        NUMERIC(10,2) NOT NULL
);

-- ─── STEP 11: Payments ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
    id                     SERIAL        PRIMARY KEY,
    order_id               INTEGER       NOT NULL REFERENCES orders(id),
    gateway                VARCHAR(30)   NOT NULL,
    gateway_transaction_id VARCHAR(255)  UNIQUE,
    gateway_order_id       VARCHAR(255),
    amount                 NUMERIC(10,2) NOT NULL,
    currency               CHAR(3)       NOT NULL DEFAULT 'NPR',
    status                 VARCHAR(20)   NOT NULL DEFAULT 'pending',
    gateway_response       JSONB,
    refund_amount          NUMERIC(10,2),
    refunded_at            TIMESTAMPTZ,
    created_at             TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at             TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments (order_id);
CREATE INDEX IF NOT EXISTS idx_payments_gateway  ON payments (gateway, status);

-- ─── STEP 12: Favorites ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS favorites (
    user_id    INTEGER      NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
    event_id   INTEGER      NOT NULL REFERENCES events(id)  ON DELETE CASCADE,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, event_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user_id  ON favorites (user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_event_id ON favorites (event_id);

-- ─── STEP 13: Reviews ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
    id                  SERIAL       PRIMARY KEY,
    user_id             INTEGER      REFERENCES users(id)  ON DELETE SET NULL,
    event_id            INTEGER      NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    rating              SMALLINT     NOT NULL CHECK (rating BETWEEN 1 AND 5),
    body                TEXT,
    is_verified_purchase BOOLEAN     NOT NULL DEFAULT false,
    is_visible          BOOLEAN      NOT NULL DEFAULT true,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, event_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_event_id ON reviews (event_id);

-- ─── STEP 14: Notifications ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
    id         SERIAL        PRIMARY KEY,
    user_id    INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type       VARCHAR(50)   NOT NULL,
    title      VARCHAR(255)  NOT NULL,
    body       TEXT          NOT NULL,
    data       JSONB,
    is_read    BOOLEAN       NOT NULL DEFAULT false,
    read_at    TIMESTAMPTZ,
    created_at TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
    ON notifications (user_id, is_read) WHERE is_read = false;

-- ─── STEP 15: Audit logs ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
    id             BIGSERIAL     PRIMARY KEY,
    actor_id       INTEGER       REFERENCES users(id) ON DELETE SET NULL,
    actor_ip       VARCHAR(45),
    action         VARCHAR(100)  NOT NULL,
    resource_type  VARCHAR(50),
    resource_id    INTEGER,
    old_values     JSONB,
    new_values     JSONB,
    created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor      ON audit_logs (actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action     ON audit_logs (action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs (created_at DESC);

-- ─── STEP 16: Seat maps (Phase 7 foundation) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS seat_maps (
    id            SERIAL       PRIMARY KEY,
    venue_id      INTEGER      REFERENCES venues(id) ON DELETE SET NULL,
    name          VARCHAR(200) NOT NULL,
    rows          SMALLINT     NOT NULL DEFAULT 10,
    seats_per_row SMALLINT     NOT NULL DEFAULT 20,
    map_config    JSONB,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS seats (
    id          SERIAL       PRIMARY KEY,
    seat_map_id INTEGER      NOT NULL REFERENCES seat_maps(id) ON DELETE CASCADE,
    row_label   VARCHAR(5)   NOT NULL,
    seat_number SMALLINT     NOT NULL,
    section     VARCHAR(50),
    category    VARCHAR(50)  NOT NULL DEFAULT 'general',
    is_blocked  BOOLEAN      NOT NULL DEFAULT false,
    UNIQUE (seat_map_id, row_label, seat_number)
);

COMMIT;

-- ─── Verification ─────────────────────────────────────────────────────────────
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public' ORDER BY table_name;
