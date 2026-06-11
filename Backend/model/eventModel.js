const pool = require('../database/db');

const mapEvent = (row) => ({
  id: row.id,
  name: row.name,
  date: row.date,
  time: row.time,
  venue: row.venue,
  price: parseFloat(row.price),
  category: row.category,
  icon: row.icon,
  featured: row.featured,
  featuredBg: row.featured_bg,
});

const getAllEvents = async () => {
  const { rows } = await pool.query(
    'SELECT * FROM events ORDER BY created_at DESC'
  );
  return rows.map(mapEvent);
};

const getFeaturedEvents = async () => {
  const { rows } = await pool.query(
    'SELECT * FROM events WHERE featured = true ORDER BY created_at DESC'
  );
  return rows.map(mapEvent);
};

const getEventById = async (id) => {
  const { rows } = await pool.query('SELECT * FROM events WHERE id = $1', [id]);
  return rows[0] ? mapEvent(rows[0]) : null;
};

const searchEvents = async (query, category) => {
  const params = [];
  const conditions = [];
  let idx = 1;

  if (query) {
    conditions.push(
      `(LOWER(name) LIKE $${idx} OR LOWER(venue) LIKE $${idx} OR LOWER(category) LIKE $${idx})`
    );
    params.push(`%${query.toLowerCase()}%`);
    idx++;
  }

  if (category && category !== 'all') {
    conditions.push(`LOWER(category) = $${idx}`);
    params.push(category.toLowerCase());
    idx++;
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const { rows } = await pool.query(
    `SELECT * FROM events ${where} ORDER BY created_at DESC`,
    params
  );
  return rows.map(mapEvent);
};

module.exports = { getAllEvents, getFeaturedEvents, getEventById, searchEvents };
