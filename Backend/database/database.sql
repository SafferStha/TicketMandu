-- =====================================================================
--  TicketMandu · PostgreSQL Database Setup
--  Compatible with: PostgreSQL 12+
--
--  Usage:
--    psql -U <user> -d <dbname> -f database.sql
--    (or paste into pgAdmin / DBeaver query window)
--
--  This file:
--    1. Enables pgcrypto (bcrypt hashing for seed users)
--    2. Drops & recreates all tables with proper indexes
--    3. Seeds 30 events across all 6 app categories
--    4. Seeds 3 demo users — all with password: Demo@1234
--    5. Seeds 11 demo tickets (upcoming + past) across all users
--
--  After running, start the backend normally with:
--    npm run dev   (inside Backend/)
--  The server's bootstrapDatabase() will detect non-empty tables
--  and skip re-seeding automatically.
--
--  Demo login credentials:
--    alex@demo.com   /  Demo@1234   (5 tickets)
--    sarah@demo.com  /  Demo@1234   (3 tickets)
--    mike@demo.com   /  Demo@1234   (3 tickets)
-- =====================================================================


-- ─────────────────────────────────────────────────────────────────────
-- EXTENSION
-- pgcrypto ships with the standard PostgreSQL distribution.
-- It provides gen_salt() + crypt() for bcrypt-compatible hashing.
-- Node.js bcrypt.compare() accepts both $2a$ (pgcrypto) and $2b$
-- (node-bcrypt) prefixes — they are algorithmically identical.
-- ─────────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- ─────────────────────────────────────────────────────────────────────
-- TEARDOWN  (reverse FK order so constraints do not block drops)
-- ─────────────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS tickets CASCADE;
DROP TABLE IF EXISTS events  CASCADE;
DROP TABLE IF EXISTS users   CASCADE;


-- ─────────────────────────────────────────────────────────────────────
-- TABLE: users
-- Fields consumed by userModel.js queries
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE users (
    id         SERIAL        PRIMARY KEY,
    name       VARCHAR(255)  NOT NULL,
    email      VARCHAR(255)  NOT NULL UNIQUE,
    password   VARCHAR(255)  NOT NULL,        -- bcrypt hash (cost 10)
    image      VARCHAR(255),                  -- uploaded filename or NULL
    created_at TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users (email);


-- ─────────────────────────────────────────────────────────────────────
-- TABLE: events
-- Columns match the mapEvent() function in eventModel.js exactly:
--   row.featured_bg  →  event.featuredBg   (camelCase in JS)
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE events (
    id          SERIAL          PRIMARY KEY,
    name        VARCHAR(255)    NOT NULL,
    date        VARCHAR(50),              -- human-readable: "Dec 15, 2026"
    time        VARCHAR(20),              -- human-readable: "7:00 PM"
    venue       VARCHAR(255),
    price       DECIMAL(10, 2),
    category    VARCHAR(50),              -- Music | Sports | Arts | Comedy | Family | Theater
    icon        VARCHAR(10),              -- single emoji
    featured    BOOLEAN         NOT NULL DEFAULT false,
    featured_bg VARCHAR(255),             -- CSS gradient string or NULL
    created_at  TIMESTAMP       NOT NULL DEFAULT NOW()
);

-- Search uses LOWER(category) and LOWER(name/venue); featured for homepage
CREATE INDEX idx_events_category ON events (LOWER(category));
CREATE INDEX idx_events_featured ON events (featured);
CREATE INDEX idx_events_created  ON events (created_at DESC);


-- ─────────────────────────────────────────────────────────────────────
-- TABLE: tickets
-- ticketModel.js joins tickets → events on event_id
-- status must be 'upcoming' or 'past' (MyTicketsPage tab filter)
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE tickets (
    id         SERIAL       PRIMARY KEY,
    user_id    INTEGER      NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
    event_id   INTEGER      NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    status     VARCHAR(20)  NOT NULL DEFAULT 'upcoming',
    seat       VARCHAR(255) NOT NULL DEFAULT 'General Admission',
    created_at TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tickets_user   ON tickets (user_id);
CREATE INDEX idx_tickets_event  ON tickets (event_id);
CREATE INDEX idx_tickets_status ON tickets (status);


-- ─────────────────────────────────────────────────────────────────────
-- SEED: USERS  (password = "Demo@1234" for every account)
-- IDs will be: alex=1, sarah=2, mike=3
-- ─────────────────────────────────────────────────────────────────────
INSERT INTO users (name, email, password) VALUES
    ('Alex Johnson',   'alex@demo.com',   crypt('Demo@1234', gen_salt('bf', 10))),
    ('Sarah Williams', 'sarah@demo.com',  crypt('Demo@1234', gen_salt('bf', 10))),
    ('Mike Chen',      'mike@demo.com',   crypt('Demo@1234', gen_salt('bf', 10)));


-- ─────────────────────────────────────────────────────────────────────
-- SEED: EVENTS
--
-- ID map (SERIAL, insertion order):
--   Featured  :  1  Taylor Swift          2  NBA Finals
--                3  Coldplay              4  Champions League
--   Music     :  5  Ed Sheeran            6  Coachella
--                7  Billie Eilish         8  The Weeknd
--                9  Beyoncé
--   Sports    : 10  UFC 310              11  FIFA Qualifier
--               12  Wimbledon            13  Formula 1
--               14  MLB World Series
--   Arts      : 15  Hamilton             16  Monet & Renoir
--               17  Van Gogh             18  Frida Kahlo
--   Comedy    : 19  Dave Chappelle       20  Comedy Night Live
--               21  Kevin Hart           22  Trevor Noah
--   Family    : 23  Cirque du Soleil     24  Peppa Pig
--               25  Magic & Illusions    26  Disney On Ice
--   Theater   : 27  Phantom of the Opera 28  The Lion King
--               29  Wicked               30  Mamma Mia
-- ─────────────────────────────────────────────────────────────────────

-- ── Featured events (shown in the homepage Featured carousel) ────────
INSERT INTO events (name, date, time, venue, price, category, icon, featured, featured_bg) VALUES
    (
        'Taylor Swift | The Eras Tour',
        'Dec 15, 2026', '7:00 PM',
        'SoFi Stadium, Los Angeles, CA',
        250.00, 'Music', '🎤',
        true, 'linear-gradient(135deg, #4a0080 0%, #7b1fa2 100%)'
    ),
    (
        'NBA Finals 2027',
        'Jun 10, 2027', '8:00 PM',
        'Chase Center, San Francisco, CA',
        118.00, 'Sports', '🏀',
        true, 'linear-gradient(135deg, #0d1b4b 0%, #1a3a6b 100%)'
    ),
    (
        'Coldplay: Music of the Spheres Tour',
        'Mar 22, 2027', '7:30 PM',
        'Wembley Stadium, London',
        145.00, 'Music', '🎸',
        true, 'linear-gradient(135deg, #1a237e 0%, #1565c0 100%)'
    ),
    (
        'UEFA Champions League Final 2027',
        'May 31, 2027', '8:45 PM',
        'Allianz Arena, Munich, Germany',
        320.00, 'Sports', '⚽',
        true, 'linear-gradient(135deg, #004d40 0%, #00695c 100%)'
    );

-- ── Music ─────────────────────────────────────────────────────────────
INSERT INTO events (name, date, time, venue, price, category, icon, featured) VALUES
    ('Ed Sheeran: Mathematics Tour',        'Nov 3, 2026',  '6:30 PM',  'Allegiant Stadium, Las Vegas, NV',          89.00, 'Music', '🎵', false),
    ('Coachella Valley Music & Arts 2027',  'Apr 11, 2027', '12:00 PM', 'Empire Polo Club, Indio, CA',              499.00, 'Music', '🎸', false),
    ('Billie Eilish: Hit Me Hard and Soft', 'Jan 14, 2027', '7:00 PM',  'Kia Forum, Inglewood, CA',                 110.00, 'Music', '🎤', false),
    ('The Weeknd: After Hours Til Dawn',    'Feb 20, 2027', '8:00 PM',  'T-Mobile Arena, Las Vegas, NV',            135.00, 'Music', '🎵', false),
    ('Beyoncé: Renaissance World Tour',     'Apr 28, 2027', '8:00 PM',  'AT&T Stadium, Arlington, TX',              195.00, 'Music', '🎤', false);

-- ── Sports ────────────────────────────────────────────────────────────
INSERT INTO events (name, date, time, venue, price, category, icon, featured) VALUES
    ('UFC 310: Championship Night',         'Dec 7, 2026',  '9:00 PM',  'T-Mobile Arena, Las Vegas, NV',            175.00, 'Sports', '🥊', false),
    ('FIFA World Cup 2026 Qualifier',       'Sep 5, 2026',  '7:00 PM',  'Rose Bowl, Pasadena, CA',                   65.00, 'Sports', '⚽', false),
    ('Wimbledon Gentlemen''s Final 2027',   'Jul 13, 2027', '2:00 PM',  'All England Club, Wimbledon',              280.00, 'Sports', '🎾', false),
    ('Formula 1: US Grand Prix 2026',       'Oct 19, 2026', '3:00 PM',  'Circuit of the Americas, Austin, TX',      220.00, 'Sports', '🏎️', false),
    ('MLB World Series 2026 — Game 7',      'Nov 1, 2026',  '8:00 PM',  'Dodger Stadium, Los Angeles, CA',          185.00, 'Sports', '⚾', false);

-- ── Arts ──────────────────────────────────────────────────────────────
INSERT INTO events (name, date, time, venue, price, category, icon, featured) VALUES
    ('Hamilton — The Musical',              'Oct 20, 2026', '7:30 PM',  'Pantages Theatre, Hollywood, CA',           95.00, 'Arts', '🎭', false),
    ('Monet & Renoir: Impressionist Masters','Jul 15, 2026','10:00 AM', 'LACMA, Los Angeles, CA',                    35.00, 'Arts', '🖼️', false),
    ('Van Gogh: The Immersive Experience',  'Sep 28, 2026', '11:00 AM', 'The Lighthouse, New York, NY',              42.00, 'Arts', '🎨', false),
    ('Frida Kahlo: Through the Lens',       'Dec 5, 2026',  '9:00 AM',  'The Broad, Los Angeles, CA',                38.00, 'Arts', '🎨', false);

-- ── Comedy ────────────────────────────────────────────────────────────
INSERT INTO events (name, date, time, venue, price, category, icon, featured) VALUES
    ('Dave Chappelle: Live Stand-Up',       'Aug 25, 2026', '9:00 PM',  'Hollywood Palladium, Los Angeles, CA',      85.00, 'Comedy', '😂', false),
    ('Comedy Night Live: All-Stars',        'Jul 10, 2026', '9:00 PM',  'The Laugh Factory, Los Angeles, CA',        45.00, 'Comedy', '😂', false),
    ('Kevin Hart: Reality Check Tour',      'Oct 18, 2026', '8:30 PM',  'Madison Square Garden, New York, NY',       95.00, 'Comedy', '🎤', false),
    ('Trevor Noah: Off the Record',         'Nov 22, 2026', '7:30 PM',  'Dolby Theatre, Hollywood, CA',              75.00, 'Comedy', '😂', false);

-- ── Family ────────────────────────────────────────────────────────────
INSERT INTO events (name, date, time, venue, price, category, icon, featured) VALUES
    ('Cirque du Soleil: Alegría',           'Aug 3, 2026',  '5:00 PM',  'Royal Albert Hall, London',                120.00, 'Family', '🎪', false),
    ('Peppa Pig Live! World Tour',          'Aug 20, 2026', '2:00 PM',  'Dolby Theatre, Hollywood, CA',              48.00, 'Family', '🐷', false),
    ('Magic & Illusions: Grand Show',       'Oct 3, 2026',  '7:00 PM',  'The Magic Castle, Hollywood, CA',           60.00, 'Family', '🪄', false),
    ('Disney On Ice: Frozen Adventure',     'Dec 20, 2026', '3:00 PM',  'Crypto.com Arena, Los Angeles, CA',         55.00, 'Family', '❄️', false);

-- ── Theater ───────────────────────────────────────────────────────────
INSERT INTO events (name, date, time, venue, price, category, icon, featured) VALUES
    ('Phantom of the Opera — Broadway',     'Sep 12, 2026', '7:00 PM',  'Majestic Theatre, New York, NY',           150.00, 'Theater', '🎭', false),
    ('The Lion King — West End',            'Nov 8, 2026',  '7:30 PM',  'Lyceum Theatre, London',                   115.00, 'Theater', '🦁', false),
    ('Wicked: The Musical — 20th Anniv.',   'Feb 28, 2027', '7:00 PM',  'Gershwin Theatre, New York, NY',           130.00, 'Theater', '🧙', false),
    ('Mamma Mia! The Musical',              'Mar 15, 2027', '7:30 PM',  'Novello Theatre, London',                   98.00, 'Theater', '🎶', false);


-- ─────────────────────────────────────────────────────────────────────
-- SEED: TICKETS
--
-- user_id references: alex=1  sarah=2  mike=3
-- event_id references (see ID map above)
-- status must be 'upcoming' or 'past' — matches MyTicketsPage tab values
-- ─────────────────────────────────────────────────────────────────────

-- alex@demo.com — 3 upcoming, 2 past
INSERT INTO tickets (user_id, event_id, status, seat) VALUES
    (1,  1, 'upcoming', 'Section A · Row 5 · Seat 12'),   -- Taylor Swift
    (1,  2, 'upcoming', 'Section C · Row 12 · Seat 8'),   -- NBA Finals
    (1,  8, 'upcoming', 'General Admission'),              -- The Weeknd
    (1, 20, 'past',     'Section B · Row 3 · Seat 7'),    -- Comedy Night Live
    (1, 10, 'past',     'Ringside · Seat 22');             -- UFC 310

-- sarah@demo.com — 2 upcoming, 1 past
INSERT INTO tickets (user_id, event_id, status, seat) VALUES
    (2,  3, 'upcoming', 'Floor · Row 1 · Seat 15'),       -- Coldplay
    (2,  5, 'upcoming', 'General Admission'),              -- Ed Sheeran
    (2, 23, 'past',     'Stalls · Row D · Seat 4');       -- Cirque du Soleil

-- mike@demo.com — 2 upcoming, 1 past
INSERT INTO tickets (user_id, event_id, status, seat) VALUES
    (3,  4, 'upcoming', 'VIP Section · Seat 3'),          -- Champions League
    (3, 13, 'upcoming', 'Grandstand · Row B · Seat 41'),  -- Formula 1
    (3, 26, 'past',     'Section E · Row 8 · Seat 11');   -- Disney On Ice


-- ─────────────────────────────────────────────────────────────────────
-- VERIFICATION QUERIES  (uncomment to run after seeding)
-- ─────────────────────────────────────────────────────────────────────
-- SELECT COUNT(*) AS total_users   FROM users;     -- expect 3
-- SELECT COUNT(*) AS total_events  FROM events;    -- expect 30
-- SELECT COUNT(*) AS total_tickets FROM tickets;   -- expect 11
--
-- SELECT category, COUNT(*) AS cnt
-- FROM events
-- GROUP BY category
-- ORDER BY category;
-- -- Arts:2  Comedy:4  Family:4  Music:7  Sports:7  Theater:4
--
-- SELECT u.name, e.name AS event, t.status, t.seat
-- FROM tickets t
-- JOIN users  u ON u.id = t.user_id
-- JOIN events e ON e.id = t.event_id
-- ORDER BY u.name, t.status;
