BEGIN;

-- Drop old tables safely
DROP TABLE IF EXISTS refresh_tokens CASCADE;
DROP TABLE IF EXISTS tickets CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS users CASCADE;

--------------------------------------------------
-- USERS TABLE
--------------------------------------------------
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    image TEXT,
    role VARCHAR(20) DEFAULT 'user',
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

--------------------------------------------------
-- EVENTS TABLE
--------------------------------------------------
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    date VARCHAR(50),
    time VARCHAR(20),
    venue VARCHAR(255),
    price DECIMAL(10,2),
    category VARCHAR(50),
    icon VARCHAR(10),
    featured BOOLEAN DEFAULT FALSE,
    featured_bg TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

--------------------------------------------------
-- TICKETS TABLE
--------------------------------------------------
CREATE TABLE tickets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'upcoming',
    seat VARCHAR(255) DEFAULT 'General Admission',
    created_at TIMESTAMP DEFAULT NOW(),
    CHECK (status IN ('upcoming', 'past'))
);

--------------------------------------------------
-- REFRESH TOKENS TABLE
--------------------------------------------------
CREATE TABLE refresh_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    is_revoked BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP NOT NULL,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT NOW()
);

--------------------------------------------------
-- INDEXES
--------------------------------------------------
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_events_category ON events(category);
CREATE INDEX idx_events_featured ON events(featured);
CREATE INDEX idx_tickets_user ON tickets(user_id);
CREATE INDEX idx_tickets_event ON tickets(event_id);

--------------------------------------------------
-- SEED USERS
--------------------------------------------------
-- Password for all demo users: Demo@1234 (bcrypt, compatible with auth.service)
INSERT INTO users (name, email, password, role) VALUES
('Alex Johnson', 'alex@demo.com', '$2b$10$Vxn7VLoUQvZAdkDNGesSFOJ2ZQBGv/2IY0jasZXlR4fWO0Dvkn/fC', 'user'),
('Sarah Williams', 'sarah@demo.com', '$2b$10$Vxn7VLoUQvZAdkDNGesSFOJ2ZQBGv/2IY0jasZXlR4fWO0Dvkn/fC', 'user'),
('Mike Chen', 'mike@demo.com', '$2b$10$Vxn7VLoUQvZAdkDNGesSFOJ2ZQBGv/2IY0jasZXlR4fWO0Dvkn/fC', 'user');

--------------------------------------------------
-- SEED EVENTS
--------------------------------------------------
INSERT INTO events (name, date, time, venue, price, category, icon, featured) VALUES
('Taylor Swift | Eras Tour', 'Dec 15, 2026', '7:00 PM', 'SoFi Stadium', 250.00, 'Music', 'MUS', TRUE),
('NBA Finals 2027', 'Jun 10, 2027', '8:00 PM', 'Chase Center', 118.00, 'Sports', 'SPT', TRUE),
('Coldplay World Tour', 'Mar 22, 2027', '7:30 PM', 'Wembley Stadium', 145.00, 'Music', 'MUS', TRUE),
('UFC 310 Championship', 'Dec 7, 2026', '9:00 PM', 'T-Mobile Arena', 175.00, 'Sports', 'SPT', FALSE),
('Hamilton Musical', 'Oct 20, 2026', '7:30 PM', 'Pantages Theatre', 95.00, 'Theater', 'THR', FALSE);

--------------------------------------------------
-- SEED TICKETS
--------------------------------------------------
INSERT INTO tickets (user_id, event_id, status, seat) VALUES
(1, 1, 'upcoming', 'Section A - Seat 12'),
(1, 2, 'upcoming', 'Section C - Seat 8'),
(2, 3, 'upcoming', 'Floor - Seat 15'),
(3, 4, 'upcoming', 'VIP - Seat 3');

COMMIT;