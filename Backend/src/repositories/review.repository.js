'use strict';

const db = require('../config/db');

const create = async (data) => {
  const { rows } = await db.query(
    `INSERT INTO reviews (user_id, event_id, rating, body, is_visible)
     VALUES ($1,$2,$3,$4,true) RETURNING *`,
    [data.userId, data.eventId, data.rating, data.body || null]
  );
  return rows[0];
};

const update = async (id, userId, data, isAdmin = false) => {
  const conditions = isAdmin ? 'id = $1' : 'id = $1 AND user_id = $2';
  const values = isAdmin ? [id] : [id, userId];
  const { rows } = await db.query(
    `UPDATE reviews SET rating = COALESCE($${values.length + 1}, rating), body = COALESCE($${values.length + 2}, body), updated_at = NOW() WHERE ${conditions} RETURNING *`,
    [...values, data.rating || null, data.body || null]
  );
  return rows[0] || null;
};

const remove = async (id, userId, isAdmin = false) => {
  const where = isAdmin ? 'id = $1' : 'id = $1 AND user_id = $2';
  const params = isAdmin ? [id] : [id, userId];
  await db.query(`DELETE FROM reviews WHERE ${where}`, params);
};

const findByEvent = async (eventId) => {
  const { rows } = await db.query(
    `SELECT r.*, u.name AS user_name FROM reviews r LEFT JOIN users u ON u.id = r.user_id WHERE r.event_id = $1 ORDER BY r.created_at DESC`,
    [eventId]
  );
  return rows;
};

const findById = async (id) => {
  const { rows } = await db.query('SELECT * FROM reviews WHERE id = $1 LIMIT 1', [id]);
  return rows[0] || null;
};

const hide = async (id, visible) => {
  const { rows } = await db.query('UPDATE reviews SET is_visible = $2, updated_at = NOW() WHERE id = $1 RETURNING *', [id, visible]);
  return rows[0] || null;
};


const listAll = async ({ where = '1=1', params = [], limit = 20, offset = 0 } = {}) => {
  const { rows } = await db.query(
    `SELECT r.*, u.name AS user_name, e.name AS event_name
     FROM reviews r
     LEFT JOIN users u ON u.id = r.user_id
     JOIN events e ON e.id = r.event_id
     WHERE ${where}
     ORDER BY r.created_at DESC
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  );
  const { rows: countRows } = await db.query(
    `SELECT COUNT(*)::int AS count FROM reviews r JOIN events e ON e.id = r.event_id WHERE ${where}`,
    params
  );
  return { reviews: rows, total: Number(countRows[0]?.count || 0) };
};

const getSummary = async (eventId) => {
  const { rows } = await db.query(
    `SELECT COALESCE(AVG(rating), 0) AS average_rating, COUNT(*) AS review_count FROM reviews WHERE event_id = $1 AND is_visible = true`,
    [eventId]
  );
  return rows[0];
};

module.exports = { create, update, remove, findByEvent, findById, hide, listAll, getSummary };