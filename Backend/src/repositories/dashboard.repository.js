"use strict";

const db = require("../config/db");

const one = async (sql, params = []) => {
  const { rows } = await db.query(sql, params);
  return rows[0] || {};
};

const adminDashboard = async () => {
  const stats = await one(`
    SELECT
      (SELECT COUNT(*)::int FROM users u WHERE u.deleted_at IS NULL) AS total_users,
      (SELECT COUNT(*)::int FROM organizers o WHERE o.deleted_at IS NULL) AS total_organizers,
      (SELECT COUNT(*)::int FROM events e WHERE e.deleted_at IS NULL) AS total_events,
      (SELECT COUNT(*)::int FROM orders o WHERE o.deleted_at IS NULL) AS total_orders,
      (SELECT COUNT(*)::int FROM tickets t WHERE t.deleted_at IS NULL) AS total_tickets,
      (SELECT COALESCE(SUM(o.total_amount),0)::numeric FROM orders o WHERE o.status = 'confirmed' AND o.deleted_at IS NULL) AS total_revenue,
      (SELECT COUNT(*)::int FROM payments p WHERE p.status = 'pending') AS pending_payments
  `);
  const { rows: recentOrders } = await db.query(
    `SELECT o.* FROM orders o WHERE o.deleted_at IS NULL ORDER BY o.created_at DESC LIMIT 8`,
  );
  const { rows: topEvents } = await db.query(`
    SELECT e.id, e.name, COALESCE(SUM(oi.quantity),0)::int AS tickets_sold, COALESCE(SUM(oi.subtotal),0)::numeric AS revenue
    FROM events e
    LEFT JOIN order_items oi ON oi.event_id = e.id
    LEFT JOIN orders o ON o.id = oi.order_id AND o.status = 'confirmed'
    WHERE e.deleted_at IS NULL
    GROUP BY e.id, e.name
    ORDER BY tickets_sold DESC, revenue DESC
    LIMIT 8
  `);
  return { stats, recentOrders, topEvents };
};

const organizerDashboard = async (organizerUserId) => {
  const stats = await one(
    `
    SELECT
      (SELECT COUNT(*)::int FROM events e WHERE e.deleted_at IS NULL AND e.organizer_id IN (SELECT id FROM organizers WHERE user_id = $1 AND deleted_at IS NULL)) AS my_events,
      (SELECT COUNT(*)::int FROM tickets t JOIN events e ON e.id = t.event_id WHERE t.deleted_at IS NULL AND e.organizer_id IN (SELECT id FROM organizers WHERE user_id = $1 AND deleted_at IS NULL)) AS tickets_sold,
      (SELECT COALESCE(SUM(oi.subtotal),0)::numeric FROM order_items oi JOIN orders o ON o.id = oi.order_id JOIN events e ON e.id = oi.event_id WHERE o.status = 'confirmed' AND e.organizer_id IN (SELECT id FROM organizers WHERE user_id = $1 AND deleted_at IS NULL)) AS revenue,
      (SELECT COUNT(*)::int FROM tickets t JOIN events e ON e.id = t.event_id WHERE t.status = 'used' AND e.organizer_id IN (SELECT id FROM organizers WHERE user_id = $1 AND deleted_at IS NULL)) AS check_ins
  `,
    [organizerUserId],
  );
  const { rows: recentOrders } = await db.query(
    `
    SELECT DISTINCT o.* FROM orders o
    JOIN order_items oi ON oi.order_id = o.id
    JOIN events e ON e.id = oi.event_id
    WHERE e.organizer_id IN (SELECT id FROM organizers WHERE user_id = $1 AND deleted_at IS NULL) AND o.deleted_at IS NULL
    ORDER BY o.created_at DESC LIMIT 8
  `,
    [organizerUserId],
  );
  const { rows: upcomingEvents } = await db.query(
    `
    SELECT e.* FROM events e WHERE e.organizer_id IN (SELECT id FROM organizers WHERE user_id = $1 AND deleted_at IS NULL) AND e.deleted_at IS NULL ORDER BY COALESCE(e.starts_at, e.created_at) ASC LIMIT 8
  `,
    [organizerUserId],
  );
  return { stats, recentOrders, upcomingEvents };
};

const userDashboard = async (userId) => {
  const stats = await one(
    `
    SELECT
      (SELECT COUNT(*)::int FROM orders o WHERE o.user_id = $1 AND o.deleted_at IS NULL) AS my_orders,
      (SELECT COUNT(*)::int FROM tickets t WHERE t.user_id = $1 AND t.deleted_at IS NULL) AS my_tickets,
      (SELECT COUNT(*)::int FROM favorites f WHERE f.user_id = $1) AS favorites,
      (SELECT COUNT(*)::int FROM notifications n WHERE n.user_id = $1 AND n.is_read = false) AS unread_notifications
  `,
    [userId],
  );
  return { stats };
};

module.exports = { adminDashboard, organizerDashboard, userDashboard };
