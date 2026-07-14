"use strict";

const db = require("../config/db");

const createPayment = async (client, data) => {
  const { rows } = await client.query(
    `INSERT INTO payments (order_id, user_id, payment_method, status, amount, currency, gateway_reference, gateway_payload)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [
      data.orderId,
      data.userId,
      data.paymentMethod,
      data.status,
      data.amount,
      data.currency,
      data.gatewayReference || null,
      data.gatewayPayload || null,
    ],
  );
  return rows[0];
};

const findById = async (id) => {
  const { rows } = await db.query(
    "SELECT * FROM payments WHERE id = $1 LIMIT 1",
    [id],
  );
  return rows[0] || null;
};

const findByOrderId = async (orderId) => {
  const { rows } = await db.query(
    "SELECT * FROM payments WHERE order_id = $1 ORDER BY created_at DESC LIMIT 1",
    [orderId],
  );
  return rows[0] || null;
};

const listPayments = async ({
  where = "1=1",
  params = [],
  limit = 20,
  offset = 0,
  orderBy = "p.created_at DESC",
} = {}) => {
  const whereClause = String(where).trim().toUpperCase().startsWith("WHERE")
    ? where
    : `WHERE ${where}`;
  const { rows } = await db.query(
    `SELECT p.* FROM payments p JOIN orders o ON o.id = p.order_id JOIN order_items oi ON oi.order_id = o.id JOIN events e ON e.id = oi.event_id ${whereClause} GROUP BY p.id ORDER BY ${orderBy} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset],
  );
  const { rows: countRows } = await db.query(
    `SELECT COUNT(DISTINCT p.id) FROM payments p JOIN orders o ON o.id = p.order_id JOIN order_items oi ON oi.order_id = o.id JOIN events e ON e.id = oi.event_id ${whereClause}`,
    params,
  );
  return { payments: rows, total: parseInt(countRows[0].count, 10) };
};

const updateStatus = async (client, paymentId, status, extra = {}) => {
  const { rows } = await client.query(
    `UPDATE payments SET status = $2, updated_at = NOW(), gateway_payload = COALESCE($3, gateway_payload), refunded_at = CASE WHEN $2 = 'refunded' THEN NOW() ELSE refunded_at END WHERE id = $1 RETURNING *`,
    [paymentId, status, extra.gatewayPayload || null],
  );
  return rows[0] || null;
};

module.exports = {
  createPayment,
  findById,
  findByOrderId,
  listPayments,
  updateStatus,
};
