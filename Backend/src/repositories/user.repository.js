'use strict';

const db = require('../config/db');

const SAFE_COLUMNS = 'id, name, email, image, phone, role, is_active, deleted_at, last_login_at, created_at, updated_at';

const findByEmail = async (email) => {
  const { rows } = await db.query(
    `SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL LIMIT 1`,
    [email]
  );
  return rows[0] || null;
};

const findById = async (id) => {
  const { rows } = await db.query(
    `SELECT ${SAFE_COLUMNS} FROM users WHERE id = $1 LIMIT 1`,
    [id]
  );
  return rows[0] || null;
};

const create = async ({ name, email, passwordHash, image = null, role = 'user' }) => {
  const { rows } = await db.query(
    `INSERT INTO users (name, email, password, image, role)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING ${SAFE_COLUMNS}`,
    [name, email, passwordHash, image, role]
  );
  return rows[0];
};

const updateById = async (id, fields) => {
  const allowed = new Set(['name', 'email', 'password', 'image', 'phone', 'role', 'is_active', 'deleted_at']);
  const entries = Object.entries(fields).filter(([k, v]) => allowed.has(k) && v !== undefined);
  if (entries.length === 0) return findById(id);

  const setClauses = entries.map(([col], i) => `${col} = $${i + 2}`).join(', ');
  const values = entries.map(([, v]) => v);

  const { rows } = await db.query(
    `UPDATE users SET ${setClauses}, updated_at = NOW() WHERE id = $1
     RETURNING ${SAFE_COLUMNS}`,
    [id, ...values]
  );
  return rows[0] || null;
};

const deleteById = async (id) => {
  await db.query(
    'UPDATE users SET deleted_at = NOW(), is_active = false, updated_at = NOW() WHERE id = $1',
    [id]
  );
};

const updateLastLogin = async (id) => {
  await db.query(
    'UPDATE users SET last_login_at = NOW() WHERE id = $1',
    [id]
  );
};

const findAll = async ({ limit = 20, offset = 0, q = '', role = '', status = '' } = {}) => {
  const conditions = ['deleted_at IS NULL'];
  const params = [];
  let idx = 1;

  if (q) {
    conditions.push(`(LOWER(name) LIKE $${idx} OR LOWER(email) LIKE $${idx})`);
    params.push(`%${String(q).toLowerCase()}%`);
    idx += 1;
  }

  if (role) {
    conditions.push(`role = $${idx}`);
    params.push(role);
    idx += 1;
  }

  if (status === 'active') {
    conditions.push(`is_active = true`);
  }

  if (status === 'inactive') {
    conditions.push(`is_active = false`);
  }

  const where = `WHERE ${conditions.join(' AND ')}`;
  const { rows } = await db.query(
    `SELECT ${SAFE_COLUMNS} FROM users ${where} ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
    [...params, limit, offset]
  );
  const { rows: countRows } = await db.query(
    `SELECT COUNT(*) FROM users ${where}`,
    params
  );
  return { users: rows, total: parseInt(countRows[0].count, 10) };
};

const findByIdForAdmin = async (id) => {
  const { rows } = await db.query(
    `SELECT ${SAFE_COLUMNS}, password FROM users WHERE id = $1 LIMIT 1`,
    [id]
  );
  return rows[0] || null;
};

// ── Refresh token store (uses refresh_tokens table if it exists) ─────────────

const storeRefreshToken = async (userId, tokenHash, expiresAt, ipAddress) => {
  await db.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, ip_address)
     VALUES ($1, $2, $3, $4)`,
    [userId, tokenHash, expiresAt, ipAddress || null]
  );
};

const findRefreshToken = async (tokenHash) => {
  const { rows } = await db.query(
    `SELECT * FROM refresh_tokens
     WHERE token_hash = $1 AND is_revoked = false AND expires_at > NOW()
     LIMIT 1`,
    [tokenHash]
  );
  return rows[0] || null;
};

const findRefreshTokenByHash = async (tokenHash) => {
  const { rows } = await db.query(
    'SELECT * FROM refresh_tokens WHERE token_hash = $1 LIMIT 1',
    [tokenHash]
  );
  return rows[0] || null;
};

const revokeRefreshToken = async (tokenHash) => {
  await db.query(
    'UPDATE refresh_tokens SET is_revoked = true WHERE token_hash = $1',
    [tokenHash]
  );
};

const revokeAllUserTokens = async (userId) => {
  await db.query(
    'UPDATE refresh_tokens SET is_revoked = true WHERE user_id = $1',
    [userId]
  );
};

module.exports = {
  findByEmail,
  findById,
  findByIdForAdmin,
  create,
  updateById,
  deleteById,
  updateLastLogin,
  findAll,
  storeRefreshToken,
  findRefreshToken,
  findRefreshTokenByHash,
  revokeRefreshToken,
  revokeAllUserTokens,
};
