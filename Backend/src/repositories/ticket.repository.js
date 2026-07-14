'use strict';

const db = require('../config/db');

const mapEvent = (row) => ({
  id: row.event_id,
  name: row.event_name,
  date: row.event_date,
  time: row.event_time,
  venue: row.event_venue,
  icon: row.event_icon || '🎫',
  category: row.event_category,
  status: row.event_status,
  organizerId: row.organizer_id,
});

const mapTicket = (row) => ({
  id: row.id,
  userId: row.user_id,
  user_id: row.user_id,
  eventId: row.event_id,
  event_id: row.event_id,
  orderId: row.order_id,
  order_id: row.order_id,
  ticketTypeId: row.ticket_type_id,
  ticket_type_id: row.ticket_type_id,
  seatId: row.seat_id,
  seat_id: row.seat_id,
  status: row.status,
  seat: row.seat || 'General Admission',
  ticketNumber: row.ticket_number,
  ticket_number: row.ticket_number,
  qrCodeValue: row.qr_code_value,
  qr_code_value: row.qr_code_value,
  checkedInAt: row.checked_in_at,
  checked_in_at: row.checked_in_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  event: row.event_id ? mapEvent(row) : undefined,
  orderNumber: row.order_number,
  ticketTypeName: row.ticket_type_name,
  organizer_id: row.organizer_id,
});

const baseSelect = `
  SELECT
    t.*,
    e.name AS event_name,
    e.date AS event_date,
    e.time AS event_time,
    e.venue AS event_venue,
    e.icon AS event_icon,
    e.category AS event_category,
    e.status AS event_status,
    e.organizer_id,
    o.order_number,
    tt.name AS ticket_type_name
  FROM tickets t
  JOIN events e ON e.id = t.event_id
  LEFT JOIN orders o ON o.id = t.order_id
  LEFT JOIN ticket_types tt ON tt.id = t.ticket_type_id
`;

const create = async (client, data) => {
  const { rows } = await client.query(
    `INSERT INTO tickets (user_id, event_id, order_id, ticket_type_id, seat_id, status, seat, ticket_number, qr_code_value)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING *`,
    [
      data.userId,
      data.eventId,
      data.orderId || null,
      data.ticketTypeId || null,
      data.seatId || null,
      data.status || 'active',
      data.seat || 'General Admission',
      data.ticketNumber,
      data.qrCodeValue,
    ]
  );
  return rows[0];
};

const countByOrderId = async (orderId, client = db) => {
  const { rows } = await client.query('SELECT COUNT(*)::int AS count FROM tickets WHERE order_id = $1 AND deleted_at IS NULL', [orderId]);
  return Number(rows[0]?.count || 0);
};

const list = async ({ where = '1=1', params = [], limit = 20, offset = 0, orderBy = 't.created_at DESC' } = {}) => {
  const finalWhere = `WHERE t.deleted_at IS NULL AND ${where}`;
  const { rows } = await db.query(
    `${baseSelect} ${finalWhere} ORDER BY ${orderBy} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  );
  const { rows: countRows } = await db.query(
    `SELECT COUNT(DISTINCT t.id)::int AS count FROM tickets t JOIN events e ON e.id = t.event_id LEFT JOIN orders o ON o.id = t.order_id LEFT JOIN ticket_types tt ON tt.id = t.ticket_type_id ${finalWhere}`,
    params
  );
  return { tickets: rows.map(mapTicket), total: Number(countRows[0]?.count || 0) };
};

const findById = async (id) => {
  const { rows } = await db.query(`${baseSelect} WHERE t.id = $1 AND t.deleted_at IS NULL LIMIT 1`, [id]);
  return rows[0] ? mapTicket(rows[0]) : null;
};

const findByTicketNumber = async (ticketNumber) => {
  const { rows } = await db.query(
    `${baseSelect} WHERE t.deleted_at IS NULL AND (LOWER(t.ticket_number) = LOWER($1) OR LOWER(t.qr_code_value) = LOWER($1)) LIMIT 1`,
    [ticketNumber]
  );
  return rows[0] ? mapTicket(rows[0]) : null;
};

const markCheckedIn = async (ticketId) => {
  const { rows } = await db.query(
    `UPDATE tickets SET status = 'used', checked_in_at = NOW(), updated_at = NOW() WHERE id = $1 RETURNING *`,
    [ticketId]
  );
  return rows[0] ? findById(rows[0].id) : null;
};

const updateStatus = async (ticketId, status) => {
  const { rows } = await db.query(
    `UPDATE tickets SET status = $2, updated_at = NOW() WHERE id = $1 RETURNING *`,
    [ticketId, status]
  );
  return rows[0] ? findById(rows[0].id) : null;
};

const getStats = async (actor = {}) => {
  const params = [];
  let scope = '1=1';
  if (actor.role === 'user') {
    params.push(actor.id);
    scope = 't.user_id = $1';
  } else if (actor.role === 'organizer') {
    params.push(actor.id);
    scope = 'e.organizer_id = $1';
  }

  const { rows } = await db.query(
    `SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE t.status = 'active')::int AS active,
      COUNT(*) FILTER (WHERE t.status = 'used')::int AS used,
      COUNT(*) FILTER (WHERE t.status = 'cancelled')::int AS cancelled,
      COUNT(*) FILTER (WHERE t.status = 'refunded')::int AS refunded
     FROM tickets t
     JOIN events e ON e.id = t.event_id
     WHERE t.deleted_at IS NULL AND ${scope}`,
    params
  );
  return rows[0] || { total: 0, active: 0, used: 0, cancelled: 0, refunded: 0 };
};

module.exports = {
  create,
  countByOrderId,
  list,
  findById,
  findByTicketNumber,
  markCheckedIn,
  updateStatus,
  getStats,
};
