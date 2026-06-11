const pool = require('../database/db');

const getUserTickets = async (userId) => {
  const { rows } = await pool.query(
    `SELECT t.id, t.status, t.seat, t.created_at,
            e.id AS event_id, e.name, e.date, e.time, e.venue,
            e.price, e.category, e.icon, e.featured, e.featured_bg
     FROM tickets t
     JOIN events e ON t.event_id = e.id
     WHERE t.user_id = $1
     ORDER BY t.created_at DESC`,
    [userId]
  );
  return rows.map((row) => ({
    id: row.id,
    status: row.status,
    seat: row.seat,
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
  }));
};

const createTicket = async (userId, eventId, seat) => {
  const { rows } = await pool.query(
    'INSERT INTO tickets (user_id, event_id, seat) VALUES ($1, $2, $3) RETURNING *',
    [userId, eventId, seat]
  );
  return rows[0];
};

const getUserTicketCount = async (userId) => {
  const { rows } = await pool.query(
    'SELECT COUNT(*) FROM tickets WHERE user_id = $1',
    [userId]
  );
  return parseInt(rows[0].count, 10);
};

module.exports = { getUserTickets, createTicket, getUserTicketCount };
