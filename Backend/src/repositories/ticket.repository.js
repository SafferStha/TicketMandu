'use strict';

const db = require('../config/db');

const mapTicket = (row) => ({
  id: row.id,
  status: row.status,
  seat: row.seat,
  createdAt: row.created_at,
  event: {
    id: row.event_id,
    name: row.name,
    date: row.date,
    time: row.time,
    venue: row.venue,
    price: parseFloat(row.price),
    category: row.category,
    icon: row.icon,
    featured: row.featured,
    featuredBg: row.featured_bg,
  },
});

const findByUserId = async (userId, { limit = 50, offset = 0 } = {}) => {
  const { rows } = await db.query(
    `SELECT t.id, t.status, t.seat, t.created_at,
            e.id AS event_id, e.name, e.date, e.time, e.venue,
            e.price, e.category, e.icon, e.featured, e.featured_bg
     FROM tickets t
     JOIN events e ON t.event_id = e.id
     WHERE t.user_id = $1
     ORDER BY t.created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );
  const { rows: countRows } = await db.query(
    'SELECT COUNT(*) FROM tickets WHERE user_id = $1',
    [userId]
  );
  return {
    tickets: rows.map(mapTicket),
    total: parseInt(countRows[0].count, 10),
  };
};

const findById = async (id) => {
  const { rows } = await db.query('SELECT * FROM tickets WHERE id = $1', [id]);
  return rows[0] || null;
};

const countByUserAndEvent = async (userId, eventId) => {
  const { rows } = await db.query(
    'SELECT COUNT(*) FROM tickets WHERE user_id = $1 AND event_id = $2',
    [userId, eventId]
  );
  return parseInt(rows[0].count, 10);
};

const countByUser = async (userId) => {
  const { rows } = await db.query(
    'SELECT COUNT(*) FROM tickets WHERE user_id = $1',
    [userId]
  );
  return parseInt(rows[0].count, 10);
};

const create = async (userId, eventId, seat = 'General Admission') => {
  const { rows } = await db.query(
    `INSERT INTO tickets (user_id, event_id, seat)
     VALUES ($1, $2, $3) RETURNING *`,
    [userId, eventId, seat]
  );
  return rows[0];
};

const updateStatus = async (id, status) => {
  const { rows } = await db.query(
    'UPDATE tickets SET status = $1 WHERE id = $2 RETURNING *',
    [status, id]
  );
  return rows[0] || null;
};

const getStatsByUser = async (userId) => {
  const { rows } = await db.query(
    `SELECT
       COUNT(*) FILTER (WHERE status = 'upcoming') AS upcoming,
       COUNT(*) FILTER (WHERE status = 'past')     AS past,
       COUNT(*)                                     AS total
     FROM tickets
     WHERE user_id = $1`,
    [userId]
  );
  return {
    upcomingCount: parseInt(rows[0].upcoming, 10),
    pastCount: parseInt(rows[0].past, 10),
    totalCount: parseInt(rows[0].total, 10),
  };
};

module.exports = {
  findByUserId,
  findById,
  countByUserAndEvent,
  countByUser,
  create,
  updateStatus,
  getStatsByUser,
};
