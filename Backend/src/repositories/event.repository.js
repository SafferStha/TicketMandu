'use strict';

const db = require('../config/db');

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
  createdAt: row.created_at,
});

const findAll = async ({ limit = 20, offset = 0, sort = 'created_at', order = 'desc' } = {}) => {
  const allowedSorts = { date: 'date', price: 'price', name: 'name', created_at: 'created_at' };
  const col = allowedSorts[sort] || 'created_at';
  const dir = order === 'asc' ? 'ASC' : 'DESC';

  const { rows } = await db.query(
    `SELECT * FROM events ORDER BY ${col} ${dir} LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  const { rows: countRows } = await db.query('SELECT COUNT(*) FROM events');

  return {
    events: rows.map(mapEvent),
    total: parseInt(countRows[0].count, 10),
  };
};

const findFeatured = async (limit = 10) => {
  const { rows } = await db.query(
    'SELECT * FROM events WHERE featured = true ORDER BY created_at DESC LIMIT $1',
    [limit]
  );
  return rows.map(mapEvent);
};

const findById = async (id) => {
  const { rows } = await db.query('SELECT * FROM events WHERE id = $1', [id]);
  return rows[0] ? mapEvent(rows[0]) : null;
};

const search = async ({ q, category, minPrice, maxPrice, limit = 20, offset = 0, sort = 'created_at', order = 'desc' }) => {
  const conditions = [];
  const params = [];
  let idx = 1;

  if (q) {
    conditions.push(
      `(LOWER(name) LIKE $${idx} OR LOWER(venue) LIKE $${idx} OR LOWER(category) LIKE $${idx})`
    );
    params.push(`%${q.toLowerCase()}%`);
    idx++;
  }

  if (category && category !== 'all') {
    conditions.push(`LOWER(category) = $${idx}`);
    params.push(category.toLowerCase());
    idx++;
  }

  if (minPrice !== undefined) {
    conditions.push(`price >= $${idx}`);
    params.push(minPrice);
    idx++;
  }

  if (maxPrice !== undefined) {
    conditions.push(`price <= $${idx}`);
    params.push(maxPrice);
    idx++;
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const allowedSorts = { date: 'date', price: 'price', name: 'name', created_at: 'created_at' };
  const col = allowedSorts[sort] || 'created_at';
  const dir = order === 'asc' ? 'ASC' : 'DESC';

  const { rows } = await db.query(
    `SELECT * FROM events ${where} ORDER BY ${col} ${dir} LIMIT $${idx} OFFSET $${idx + 1}`,
    [...params, limit, offset]
  );
  const { rows: countRows } = await db.query(
    `SELECT COUNT(*) FROM events ${where}`,
    params
  );

  return {
    events: rows.map(mapEvent),
    total: parseInt(countRows[0].count, 10),
  };
};

const create = async ({ name, date, time, venue, price, category, icon, featured, featured_bg }) => {
  const { rows } = await db.query(
    `INSERT INTO events (name, date, time, venue, price, category, icon, featured, featured_bg)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [name, date, time, venue, price, category, icon || '🎫', featured || false, featured_bg || null]
  );
  return mapEvent(rows[0]);
};

const updateById = async (id, fields) => {
  const allowed = ['name', 'date', 'time', 'venue', 'price', 'category', 'icon', 'featured', 'featured_bg'];
  const entries = Object.entries(fields).filter(([k, v]) => allowed.includes(k) && v !== undefined);
  if (entries.length === 0) return findById(id);

  const setClauses = entries.map(([col], i) => `${col} = $${i + 2}`).join(', ');
  const values = entries.map(([, v]) => v);

  const { rows } = await db.query(
    `UPDATE events SET ${setClauses} WHERE id = $1 RETURNING *`,
    [id, ...values]
  );
  return rows[0] ? mapEvent(rows[0]) : null;
};

const deleteById = async (id) => {
  await db.query('DELETE FROM events WHERE id = $1', [id]);
};

module.exports = { findAll, findFeatured, findById, search, create, updateById, deleteById };
