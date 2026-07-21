"use strict";

/**
 * @fileoverview Database seed data.
 * Inserts demo events, categories, users, venues, organizers, and ticket types.
 * All operations use ON CONFLICT / conditional checks to be idempotent.
 */

const db = require("./db");
const logger = require("../utils/logger.util");

/**
 * Seed events if the table is empty.
 */
const seedEvents = async () => {
  const { rows } = await db.query("SELECT COUNT(*) FROM events");
  if (rows[0].count !== "0") return;

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
};

/**
 * Seed event categories if the table is empty.
 */
const seedCategories = async () => {
  const { rows } = await db.query("SELECT COUNT(*) FROM event_categories");
  if (rows[0].count !== "0") return;

  await db.query(`
    INSERT INTO event_categories (name, slug, icon, sort_order) VALUES
      ('Music', 'music', '🎵', 1),
      ('Sports', 'sports', '⚽', 2),
      ('Arts', 'arts', '🎨', 3),
      ('Comedy', 'comedy', '😂', 4),
      ('Family', 'family', '👨‍👩‍👧', 5),
      ('Theater', 'theater', '🎭', 6)
  `);

  // Ensure is_active is set for all categories
  await db
    .query(
      `UPDATE event_categories SET is_active = true WHERE is_active IS NULL`,
    )
    .catch(() => {});

  logger.info("[db] Seeded event categories");
};

/**
 * Seed demo users (admin, organizer, regular user).
 */
const seedUsers = async () => {
  const { hashPassword } = require("../utils/hash.util");
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

  logger.info("[db] Seeded demo users");
};

/**
 * Seed demo venues.
 */
const seedVenues = async () => {
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

  logger.info("[db] Seeded venues");
};

/**
 * Seed demo organizer linked to the organizer user.
 */
const seedOrganizers = async () => {
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

  logger.info("[db] Seeded organizers");
};

/**
 * Link events to the demo organizer and set default metadata.
 */
const linkEventsToOrganizer = async () => {
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
};

/**
 * Seed default ticket types for events that don't have any.
 */
const seedTicketTypes = async () => {
  // General Admission for all events
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

  // VIP for featured events
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

  logger.info("[db] Seeded ticket types");
};

/**
 * Run all seed operations.
 */
const applySeedData = async () => {
  logger.info("[db] Applying seed data...");

  await seedEvents();
  await seedCategories();
  await seedUsers();
  await seedVenues();
  await seedOrganizers();
  await linkEventsToOrganizer();
  await seedTicketTypes();

  logger.info("[db] Seed data applied successfully");
};

module.exports = applySeedData;
