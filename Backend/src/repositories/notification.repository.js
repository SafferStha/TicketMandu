'use strict';

const db = require('../config/db');

const createNotification = async (client, data) => {
  const { rows } = await client.query(
    `INSERT INTO notifications (user_id, type, title, body, data)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [data.userId, data.type, data.title, data.body, data.data || null]
  );
  return rows[0];
};

const listMy = async (userId, { limit = 20, offset = 0 } = {}) => {
  const { rows } = await db.query('SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3', [userId, limit, offset]);
  const { rows: countRows } = await db.query('SELECT COUNT(*) FROM notifications WHERE user_id = $1', [userId]);
  return { notifications: rows, total: parseInt(countRows[0].count, 10) };
};


const listAll = async ({ limit = 20, offset = 0, q = '' } = {}) => {
  const params = [];
  let where = '1=1';
  if (q) {
    params.push(`%${String(q).toLowerCase()}%`);
    where = `(LOWER(title) LIKE $1 OR LOWER(body) LIKE $1 OR LOWER(type) LIKE $1)`;
  }
  const { rows } = await db.query(`SELECT * FROM notifications WHERE ${where} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`, [...params, limit, offset]);
  const { rows: countRows } = await db.query(`SELECT COUNT(*)::int AS count FROM notifications WHERE ${where}`, params);
  return { notifications: rows, total: Number(countRows[0]?.count || 0) };
};

const markRead = async (userId, id) => {
  const { rows } = await db.query('UPDATE notifications SET is_read = true, read_at = COALESCE(read_at, NOW()) WHERE id = $1 AND user_id = $2 RETURNING *', [id, userId]);
  return rows[0] || null;
};

const markAllRead = async (userId) => {
  await db.query('UPDATE notifications SET is_read = true, read_at = COALESCE(read_at, NOW()) WHERE user_id = $1 AND is_read = false', [userId]);
};

const deleteById = async (userId, id) => {
  await db.query('DELETE FROM notifications WHERE id = $1 AND user_id = $2', [id, userId]);
};

module.exports = { createNotification, listMy, listAll, markRead, markAllRead, deleteById };