'use strict';

const db = require('../config/db');

const add = async (userId, eventId) => {
  await db.query('INSERT INTO favorites (user_id, event_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [userId, eventId]);
};

const remove = async (userId, eventId) => {
  await db.query('DELETE FROM favorites WHERE user_id = $1 AND event_id = $2', [userId, eventId]);
};

const listMy = async (userId) => {
  const { rows } = await db.query(
    `SELECT e.* FROM favorites f JOIN events e ON e.id = f.event_id WHERE f.user_id = $1 AND e.deleted_at IS NULL ORDER BY f.created_at DESC`,
    [userId]
  );
  return rows;
};

module.exports = { add, remove, listMy };