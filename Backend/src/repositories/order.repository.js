"use strict";

const db = require("../config/db");

const mapOrderItem = (row) => ({
  id: row.id,
  orderId: row.order_id,
  eventId: row.event_id,
  ticketTypeId: row.ticket_type_id,
  quantity: row.quantity,
  unitPrice: Number(row.unit_price),
  subtotal: Number(row.subtotal),
  eventName: row.event_name,
  ticketTypeName: row.ticket_type_name,
});

const mapOrder = (row) => ({
  id: row.id,
  orderNumber: row.order_number,
  userId: row.user_id,
  status: row.status,
  subtotal: Number(row.subtotal),
  serviceFee: Number(row.service_fee),
  discountAmount: Number(row.discount_amount),
  totalAmount: Number(row.total_amount),
  currency: row.currency,
  expiresAt: row.expires_at,
  confirmedAt: row.confirmed_at,
  cancelledAt: row.cancelled_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  items: row.items || [],
});

const createOrder = async (client, data) => {
  const { rows } = await client.query(
    `INSERT INTO orders (user_id, order_number, status, subtotal, service_fee, discount_amount, total_amount, currency, expires_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING *`,
    [
      data.userId,
      data.orderNumber,
      data.status,
      data.subtotal,
      data.serviceFee,
      data.discountAmount,
      data.totalAmount,
      data.currency,
      data.expiresAt,
    ],
  );
  return rows[0];
};

const createOrderItem = async (client, data) => {
  await client.query(
    `INSERT INTO order_items (order_id, event_id, ticket_type_id, quantity, unit_price, subtotal)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [
      data.orderId,
      data.eventId,
      data.ticketTypeId,
      data.quantity,
      data.unitPrice,
      data.subtotal,
    ],
  );
};

const lockTicketType = async (client, ticketTypeId) => {
  const { rows } = await client.query(
    `SELECT tt.*, e.name AS event_name, e.status AS event_status, e.deleted_at AS event_deleted_at, e.organizer_id, e.featured, e.price AS event_price
     FROM ticket_types tt
     JOIN events e ON e.id = tt.event_id
     WHERE tt.id = $1
     FOR UPDATE`,
    [ticketTypeId],
  );
  return rows[0] || null;
};

const updateTicketTypeSold = async (client, ticketTypeId, delta) => {
  await client.query(
    "UPDATE ticket_types SET quantity_sold = quantity_sold + $2 WHERE id = $1",
    [ticketTypeId, delta],
  );
};

const updateEventTicketsSold = async (client, eventId, delta) => {
  await client.query(
    "UPDATE events SET tickets_sold = GREATEST(COALESCE(tickets_sold, 0) + $2, 0), updated_at = NOW() WHERE id = $1",
    [eventId, delta],
  );
};

const releaseTicketTypeSold = async (client, ticketTypeId, delta) => {
  await client.query(
    "UPDATE ticket_types SET quantity_sold = GREATEST(quantity_sold - $2, 0) WHERE id = $1",
    [ticketTypeId, delta],
  );
};

const findById = async (id) => {
  const { rows } = await db.query(
    "SELECT * FROM orders WHERE id = $1 AND deleted_at IS NULL LIMIT 1",
    [id],
  );
  return rows[0] || null;
};

const findItemsByOrderId = async (orderId) => {
  const { rows } = await db.query(
    `SELECT oi.*, e.name AS event_name, tt.name AS ticket_type_name
     FROM order_items oi
     JOIN events e ON e.id = oi.event_id
     JOIN ticket_types tt ON tt.id = oi.ticket_type_id
     WHERE oi.order_id = $1
     ORDER BY oi.id ASC`,
    [orderId],
  );
  return rows.map(mapOrderItem);
};

const findByIdWithItems = async (id) => {
  const order = await findById(id);
  if (!order) return null;
  order.items = await findItemsByOrderId(id);
  return mapOrder(order);
};

const countExistingForUser = async (userId, orderNumber) => {
  const { rows } = await db.query(
    "SELECT COUNT(*) FROM orders WHERE user_id = $1 AND order_number = $2",
    [userId, orderNumber],
  );
  return parseInt(rows[0].count, 10);
};

const listOrders = async ({
  where = "1=1",
  params = [],
  limit = 20,
  offset = 0,
  orderBy = "o.created_at DESC",
} = {}) => {
  const whereClause = String(where).trim().toUpperCase().startsWith("WHERE")
    ? where
    : `WHERE ${where}`;
  const { rows } = await db.query(
    `SELECT o.*
     FROM orders o
     JOIN order_items oi ON oi.order_id = o.id
     JOIN events e ON e.id = oi.event_id
     ${whereClause}
     GROUP BY o.id
     ORDER BY ${orderBy}
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset],
  );
  const { rows: countRows } = await db.query(
    `SELECT COUNT(DISTINCT o.id)
     FROM orders o
     JOIN order_items oi ON oi.order_id = o.id
     JOIN events e ON e.id = oi.event_id
     ${whereClause}`,
    params,
  );
  return { orders: rows, total: parseInt(countRows[0].count, 10) };
};

const updateOrderStatus = async (client, orderId, status) => {
  const { rows } = await client.query(
    `UPDATE orders SET status = $2::varchar, updated_at = NOW(), confirmed_at = CASE WHEN $2::varchar = 'confirmed' THEN COALESCE(confirmed_at, NOW()) ELSE confirmed_at END, cancelled_at = CASE WHEN $2::varchar = 'cancelled' THEN COALESCE(cancelled_at, NOW()) ELSE cancelled_at END WHERE id = $1 RETURNING *`,
    [orderId, status],
  );
  return rows[0] || null;
};

const findRecentOrders = async (limit = 5) => {
  const { rows } = await db.query(
    `SELECT o.* FROM orders o ORDER BY o.created_at DESC LIMIT $1`,
    [limit],
  );
  return rows;
};

const getTopEvents = async (limit = 5) => {
  const { rows } = await db.query(
    `SELECT e.id, e.name, SUM(oi.quantity)::int AS tickets_sold, SUM(oi.subtotal)::numeric AS revenue
     FROM order_items oi
     JOIN orders o ON o.id = oi.order_id
     JOIN events e ON e.id = oi.event_id
     WHERE o.status IN ('confirmed', 'paid')
     GROUP BY e.id, e.name
     ORDER BY tickets_sold DESC
     LIMIT $1`,
    [limit],
  );
  return rows;
};

const getDashboardStats = async () => {
  const { rows } = await db.query(
    `SELECT
      COUNT(*) FILTER (WHERE o.status = 'pending') AS pending,
      COUNT(*) FILTER (WHERE o.status = 'confirmed') AS confirmed,
      COUNT(*) FILTER (WHERE o.status = 'cancelled') AS cancelled,
      COALESCE(SUM(o.total_amount) FILTER (WHERE o.status = 'confirmed'), 0) AS revenue
     FROM orders o`,
  );
  return rows[0];
};

module.exports = {
  mapOrder,
  mapOrderItem,
  createOrder,
  createOrderItem,
  lockTicketType,
  updateTicketTypeSold,
  updateEventTicketsSold,
  releaseTicketTypeSold,
  findById,
  findItemsByOrderId,
  findByIdWithItems,
  countExistingForUser,
  listOrders,
  updateOrderStatus,
  findRecentOrders,
  getTopEvents,
  getDashboardStats,
};
