"use strict";

const db = require("../config/db");

const SAFE_COLUMNS =
  "id, name, username, email, image, phone, role, is_active, deleted_at, last_login_at, created_at, updated_at";

const DEFAULT_PREFERENCES = {
  email_notifications: true,
  booking_notifications: true,
  payment_notifications: true,
  ticket_notifications: true,
  event_reminders: true,
  promotional_notifications: false,
  in_app_toasts: true,
  theme: "system",
};

const findByEmail = async (email) => {
  const { rows } = await db.query(
    `SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL LIMIT 1`,
    [email],
  );
  return rows[0] || null;
};

const findByUsername = async (username) => {
  const { rows } = await db.query(
    `SELECT * FROM users WHERE LOWER(username) = LOWER($1) AND deleted_at IS NULL LIMIT 1`,
    [username],
  );
  return rows[0] || null;
};

const findById = async (id) => {
  const { rows } = await db.query(
    `SELECT ${SAFE_COLUMNS} FROM users WHERE id = $1 AND deleted_at IS NULL LIMIT 1`,
    [id],
  );
  return rows[0] || null;
};

const findPasswordById = async (id) => {
  const { rows } = await db.query(
    `SELECT id, password FROM users WHERE id = $1 AND deleted_at IS NULL LIMIT 1`,
    [id],
  );
  return rows[0] || null;
};

const create = async ({
  name,
  email,
  passwordHash,
  image = null,
  role = "user",
  username = null,
}) => {
  const { rows } = await db.query(
    `INSERT INTO users (name, username, email, password, image, role)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING ${SAFE_COLUMNS}`,
    [name, username, email, passwordHash, image, role],
  );
  return rows[0];
};

const updateById = async (id, fields) => {
  const allowed = new Set([
    "name",
    "username",
    "email",
    "password",
    "image",
    "phone",
    "role",
    "is_active",
    "deleted_at",
  ]);
  const entries = Object.entries(fields).filter(
    ([k, v]) => allowed.has(k) && v !== undefined,
  );
  if (entries.length === 0) return findById(id);

  const setClauses = entries.map(([col], i) => `${col} = $${i + 2}`).join(", ");
  const values = entries.map(([, v]) => v);

  const { rows } = await db.query(
    `UPDATE users SET ${setClauses}, updated_at = NOW() WHERE id = $1
     RETURNING ${SAFE_COLUMNS}`,
    [id, ...values],
  );
  return rows[0] || null;
};

const deleteById = async (id) => {
  await db.query(
    "UPDATE users SET deleted_at = NOW(), is_active = false, updated_at = NOW() WHERE id = $1",
    [id],
  );
};

const updateLastLogin = async (id) => {
  await db.query("UPDATE users SET last_login_at = NOW() WHERE id = $1", [id]);
};

const findAll = async ({
  limit = 20,
  offset = 0,
  q = "",
  role = "",
  status = "",
} = {}) => {
  const conditions = ["deleted_at IS NULL"];
  const params = [];
  let idx = 1;

  if (q) {
    conditions.push(
      `(LOWER(name) LIKE $${idx} OR LOWER(email) LIKE $${idx} OR LOWER(COALESCE(username, '')) LIKE $${idx})`,
    );
    params.push(`%${String(q).toLowerCase()}%`);
    idx += 1;
  }

  if (role) {
    conditions.push(`role = $${idx}`);
    params.push(role);
    idx += 1;
  }

  if (status === "active") conditions.push(`is_active = true`);
  if (status === "inactive") conditions.push(`is_active = false`);

  const where = `WHERE ${conditions.join(" AND ")}`;
  const { rows } = await db.query(
    `SELECT ${SAFE_COLUMNS} FROM users ${where} ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
    [...params, limit, offset],
  );
  const { rows: countRows } = await db.query(
    `SELECT COUNT(*) FROM users ${where}`,
    params,
  );
  return { users: rows, total: parseInt(countRows[0].count, 10) };
};

const findByIdForAdmin = async (id) => {
  const { rows } = await db.query(
    `SELECT ${SAFE_COLUMNS}, password FROM users WHERE id = $1 LIMIT 1`,
    [id],
  );
  return rows[0] || null;
};

const getStats = async (userId) => {
  const { rows } = await db.query(
    `SELECT
      (SELECT COUNT(*)::int FROM orders WHERE user_id = $1 AND deleted_at IS NULL) AS total_orders,
      (SELECT COUNT(*)::int FROM tickets WHERE user_id = $1 AND deleted_at IS NULL) AS total_tickets,
      (SELECT COUNT(*)::int FROM tickets WHERE user_id = $1 AND deleted_at IS NULL AND status IN ('upcoming','active','valid')) AS upcoming_tickets,
      (SELECT COUNT(*)::int FROM tickets WHERE user_id = $1 AND deleted_at IS NULL AND status IN ('used','completed','checked_in')) AS used_completed_tickets,
      (SELECT COUNT(*)::int FROM favorites WHERE user_id = $1) AS favorite_events,
      (SELECT COUNT(*)::int FROM reviews WHERE user_id = $1) AS reviews_written,
      (SELECT COUNT(*)::int FROM notifications WHERE user_id = $1 AND is_read = false) AS unread_notifications,
      (SELECT COALESCE(SUM(amount), 0)::numeric FROM payments WHERE user_id = $1 AND status = 'paid') AS total_amount_spent,
      (SELECT COUNT(*)::int FROM orders WHERE user_id = $1 AND deleted_at IS NULL AND status = 'pending') AS pending_orders,
      (SELECT COUNT(*)::int FROM orders WHERE user_id = $1 AND deleted_at IS NULL AND status = 'cancelled') AS cancelled_orders`,
    [userId],
  );
  return rows[0];
};

const getPreferences = async (userId) => {
  const { rows } = await db.query(
    `INSERT INTO user_preferences (user_id)
     VALUES ($1)
     ON CONFLICT (user_id) DO NOTHING
     RETURNING *`,
    [userId],
  );
  if (rows[0]) return rows[0];
  const existing = await db.query(
    "SELECT * FROM user_preferences WHERE user_id = $1 LIMIT 1",
    [userId],
  );
  return existing.rows[0] || { user_id: userId, ...DEFAULT_PREFERENCES };
};

const updatePreferences = async (userId, fields) => {
  await getPreferences(userId);
  const allowed = new Set(Object.keys(DEFAULT_PREFERENCES));
  const entries = Object.entries(fields).filter(
    ([k, v]) => allowed.has(k) && v !== undefined,
  );
  if (!entries.length) return getPreferences(userId);
  const setClauses = entries.map(([col], i) => `${col} = $${i + 2}`).join(", ");
  const values = entries.map(([, v]) => v);
  const { rows } = await db.query(
    `UPDATE user_preferences SET ${setClauses}, updated_at = NOW() WHERE user_id = $1 RETURNING *`,
    [userId, ...values],
  );
  return rows[0];
};

const listLocations = async (userId) => {
  const { rows } = await db.query(
    `SELECT * FROM user_locations WHERE user_id = $1 AND deleted_at IS NULL ORDER BY is_default DESC, created_at DESC`,
    [userId],
  );
  return rows;
};

const createLocation = async (userId, data) => {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    if (data.is_default)
      await client.query(
        "UPDATE user_locations SET is_default = false WHERE user_id = $1",
        [userId],
      );
    const { rows } = await client.query(
      `INSERT INTO user_locations (user_id, label, city, area, address, latitude, longitude, is_default)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [
        userId,
        data.label,
        data.city,
        data.area || null,
        data.address,
        data.latitude || null,
        data.longitude || null,
        !!data.is_default,
      ],
    );
    await client.query("COMMIT");
    return rows[0];
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

const updateLocation = async (userId, id, data) => {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    if (data.is_default)
      await client.query(
        "UPDATE user_locations SET is_default = false WHERE user_id = $1",
        [userId],
      );
    const allowed = new Set([
      "label",
      "city",
      "area",
      "address",
      "latitude",
      "longitude",
      "is_default",
    ]);
    const entries = Object.entries(data).filter(
      ([k, v]) => allowed.has(k) && v !== undefined,
    );
    if (!entries.length) {
      const found = await client.query(
        "SELECT * FROM user_locations WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL",
        [id, userId],
      );
      await client.query("COMMIT");
      return found.rows[0] || null;
    }
    const setClauses = entries
      .map(([col], i) => `${col} = $${i + 3}`)
      .join(", ");
    const values = entries.map(([, v]) => v);
    const { rows } = await client.query(
      `UPDATE user_locations SET ${setClauses}, updated_at = NOW() WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL RETURNING *`,
      [id, userId, ...values],
    );
    await client.query("COMMIT");
    return rows[0] || null;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

const deleteLocation = async (userId, id) => {
  const { rowCount } = await db.query(
    `UPDATE user_locations SET deleted_at = NOW(), is_default = false, updated_at = NOW() WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
    [id, userId],
  );
  return rowCount > 0;
};

const setDefaultLocation = async (userId, id) =>
  updateLocation(userId, id, { is_default: true });

const listPaymentMethods = async (userId) => {
  const { rows } = await db.query(
    `SELECT * FROM user_payment_methods WHERE user_id = $1 AND deleted_at IS NULL ORDER BY is_default DESC, created_at DESC`,
    [userId],
  );
  return rows;
};

const createPaymentMethod = async (userId, data) => {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    if (data.is_default)
      await client.query(
        "UPDATE user_payment_methods SET is_default = false WHERE user_id = $1",
        [userId],
      );
    const { rows } = await client.query(
      `INSERT INTO user_payment_methods (user_id, method_type, provider, label, last4, is_default)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [
        userId,
        data.method_type,
        data.provider || null,
        data.label,
        data.last4 || null,
        !!data.is_default,
      ],
    );
    await client.query("COMMIT");
    return rows[0];
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

const updatePaymentMethod = async (userId, id, data) => {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    if (data.is_default)
      await client.query(
        "UPDATE user_payment_methods SET is_default = false WHERE user_id = $1",
        [userId],
      );
    const allowed = new Set([
      "method_type",
      "provider",
      "label",
      "last4",
      "is_default",
    ]);
    const entries = Object.entries(data).filter(
      ([k, v]) => allowed.has(k) && v !== undefined,
    );
    if (!entries.length) {
      const found = await client.query(
        "SELECT * FROM user_payment_methods WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL",
        [id, userId],
      );
      await client.query("COMMIT");
      return found.rows[0] || null;
    }
    const setClauses = entries
      .map(([col], i) => `${col} = $${i + 3}`)
      .join(", ");
    const values = entries.map(([, v]) => v);
    const { rows } = await client.query(
      `UPDATE user_payment_methods SET ${setClauses}, updated_at = NOW() WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL RETURNING *`,
      [id, userId, ...values],
    );
    await client.query("COMMIT");
    return rows[0] || null;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

const deletePaymentMethod = async (userId, id) => {
  const { rowCount } = await db.query(
    `UPDATE user_payment_methods SET deleted_at = NOW(), is_default = false, updated_at = NOW() WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
    [id, userId],
  );
  return rowCount > 0;
};

const setDefaultPaymentMethod = async (userId, id) =>
  updatePaymentMethod(userId, id, { is_default: true });

const storeRefreshToken = async (userId, tokenHash, expiresAt, ipAddress) => {
  await db.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, ip_address) VALUES ($1, $2, $3, $4)`,
    [userId, tokenHash, expiresAt, ipAddress || null],
  );
};

const findRefreshToken = async (tokenHash) => {
  const { rows } = await db.query(
    `SELECT * FROM refresh_tokens WHERE token_hash = $1 AND is_revoked = false AND expires_at > NOW() LIMIT 1`,
    [tokenHash],
  );
  return rows[0] || null;
};

const findRefreshTokenByHash = async (tokenHash) => {
  const { rows } = await db.query(
    "SELECT * FROM refresh_tokens WHERE token_hash = $1 LIMIT 1",
    [tokenHash],
  );
  return rows[0] || null;
};

const revokeRefreshToken = async (tokenHash) => {
  await db.query(
    "UPDATE refresh_tokens SET is_revoked = true WHERE token_hash = $1",
    [tokenHash],
  );
};

const revokeAllUserTokens = async (userId) => {
  await db.query(
    "UPDATE refresh_tokens SET is_revoked = true WHERE user_id = $1",
    [userId],
  );
};

module.exports = {
  findByEmail,
  findByUsername,
  findById,
  findPasswordById,
  findByIdForAdmin,
  create,
  updateById,
  deleteById,
  updateLastLogin,
  findAll,
  getStats,
  getPreferences,
  updatePreferences,
  listLocations,
  createLocation,
  updateLocation,
  deleteLocation,
  setDefaultLocation,
  listPaymentMethods,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
  setDefaultPaymentMethod,
  storeRefreshToken,
  findRefreshToken,
  findRefreshTokenByHash,
  revokeRefreshToken,
  revokeAllUserTokens,
};
