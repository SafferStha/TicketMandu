"use strict";

const crypto = require("crypto");
const db = require("../config/db");
const orderRepo = require("../repositories/order.repository");
const notificationRepo = require("../repositories/notification.repository");
const { paginate } = require("../utils/paginate.util");

const createAppError = (message, statusCode, code) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  err.code = code;
  return err;
};

const generateOrderNumber = () =>
  `ORD-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

const buildOrderWhere = (actor, query = {}) => {
  const conditions = ["o.deleted_at IS NULL"];
  const params = [];
  let idx = 1;

  if (actor?.role === "user") {
    conditions.push(`o.user_id = $${idx}`);
    params.push(actor.id);
    idx += 1;
  } else if (actor?.role === "organizer") {
    conditions.push(`e.organizer_id = $${idx}`);
    params.push(actor.id);
    idx += 1;
  }

  if (query.status) {
    conditions.push(`o.status = $${idx}`);
    params.push(query.status);
    idx += 1;
  }

  if (query.eventId) {
    conditions.push(`e.id = $${idx}`);
    params.push(query.eventId);
    idx += 1;
  }

  if (query.q) {
    conditions.push(
      `(LOWER(o.order_number) LIKE $${idx} OR LOWER(e.name) LIKE $${idx})`,
    );
    params.push(`%${String(query.q).toLowerCase()}%`);
    idx += 1;
  }

  if (query.dateFrom) {
    conditions.push(`o.created_at::date >= $${idx}::date`);
    params.push(query.dateFrom);
    idx += 1;
  }

  if (query.dateTo) {
    conditions.push(`o.created_at::date <= $${idx}::date`);
    params.push(query.dateTo);
    idx += 1;
  }

  return { where: conditions.join(" AND "), params };
};

const createOrder = async (
  userId,
  payload,
  actor = { id: userId, role: "user" },
) => {
  const client = await db.connect();
  try {
    await client.query("BEGIN");

    const orderNumber = generateOrderNumber();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    let subtotal = 0;
    const preparedItems = [];

    for (const item of payload.items) {
      const ticketType = await orderRepo.lockTicketType(
        client,
        item.ticketTypeId,
      );
      if (!ticketType)
        throw createAppError(
          "Ticket type not found",
          404,
          "TICKET_TYPE_NOT_FOUND",
        );
      if (
        ticketType.event_deleted_at ||
        ticketType.event_status !== "published"
      ) {
        throw createAppError(
          "Event is not available for booking",
          409,
          "EVENT_NOT_BOOKABLE",
        );
      }
      if (!ticketType.is_active)
        throw createAppError(
          "Ticket type is inactive",
          409,
          "TICKET_TYPE_INACTIVE",
        );

      const available =
        Number(ticketType.quantity) - Number(ticketType.quantity_sold);
      if (item.quantity > available)
        throw createAppError(
          "Not enough ticket quantity available",
          409,
          "INSUFFICIENT_QUANTITY",
        );
      if (item.quantity > Number(ticketType.max_per_order))
        throw createAppError(
          "Quantity exceeds per-order limit",
          409,
          "MAX_PER_ORDER",
        );

      const unitPrice = Number(ticketType.price);
      const itemSubtotal = unitPrice * item.quantity;
      subtotal += itemSubtotal;
      preparedItems.push({
        eventId: ticketType.event_id,
        ticketTypeId: ticketType.id,
        quantity: item.quantity,
        unitPrice,
        subtotal: itemSubtotal,
      });
    }

    const totalAmount = Math.max(
      0,
      subtotal +
        Number(payload.serviceFee || 0) -
        Number(payload.discountAmount || 0),
    );
    const order = await orderRepo.createOrder(client, {
      userId,
      orderNumber,
      status: "pending",
      subtotal,
      serviceFee: payload.serviceFee || 0,
      discountAmount: payload.discountAmount || 0,
      totalAmount,
      currency: payload.currency || "NPR",
      expiresAt,
    });

    for (const item of preparedItems) {
      await orderRepo.createOrderItem(client, { orderId: order.id, ...item });
      await orderRepo.updateTicketTypeSold(
        client,
        item.ticketTypeId,
        item.quantity,
      );
      await orderRepo.updateEventTicketsSold(
        client,
        item.eventId,
        item.quantity,
      );
    }

    await notificationRepo.createNotification(client, {
      userId,
      type: "order_created",
      title: "Order created",
      body: `Order ${orderNumber} is pending payment.`,
      data: { orderId: order.id, orderNumber },
    });

    await client.query("COMMIT");
    return orderRepo.findByIdWithItems(order.id);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

const listOrders = async (actor, query = {}) => {
  const {
    limit: safeLimit,
    offset,
    buildMeta,
  } = paginate(query.page, query.limit);
  const { where, params } = buildOrderWhere(actor, query);
  const result = await orderRepo.listOrders({
    where,
    params,
    limit: safeLimit,
    offset,
    orderBy: "o.created_at DESC",
  });
  const orders = await Promise.all(
    result.orders.map(async (order) => {
      const items = await orderRepo.findItemsByOrderId(order.id);
      return orderRepo.mapOrder({ ...order, items });
    }),
  );
  return { orders, pagination: buildMeta(result.total) };
};

const getOrder = async (actor, id) => {
  const order = await orderRepo.findByIdWithItems(id);
  if (!order) throw createAppError("Order not found", 404, "ORDER_NOT_FOUND");
  if (actor?.role === "user" && order.userId !== actor.id)
    throw createAppError("Forbidden", 403, "FORBIDDEN");
  return order;
};

const cancelOrder = async (actor, id) => {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const order = await orderRepo.findById(id);
    if (!order) throw createAppError("Order not found", 404, "ORDER_NOT_FOUND");
    if (actor?.role === "user" && order.user_id !== actor.id)
      throw createAppError("Forbidden", 403, "FORBIDDEN");
    if (order.status !== "pending")
      throw createAppError(
        "Only pending orders can be cancelled",
        409,
        "ORDER_NOT_CANCELLABLE",
      );

    const items = await orderRepo.findItemsByOrderId(id);
    for (const item of items) {
      await orderRepo.releaseTicketTypeSold(
        client,
        item.ticketTypeId,
        item.quantity,
      );
      await orderRepo.updateEventTicketsSold(
        client,
        item.eventId,
        -item.quantity,
      );
    }

    const updated = await orderRepo.updateOrderStatus(client, id, "cancelled");
    await notificationRepo.createNotification(client, {
      userId: order.user_id,
      type: "order_cancelled",
      title: "Order cancelled",
      body: `Order ${order.order_number} has been cancelled.`,
      data: { orderId: order.id },
    });
    await client.query("COMMIT");
    return updated;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

const updateOrderStatus = async (actor, id, status) => {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const order = await orderRepo.findById(id);
    if (!order) throw createAppError("Order not found", 404, "ORDER_NOT_FOUND");
    if (actor?.role === "user" && order.user_id !== actor.id)
      throw createAppError("Forbidden", 403, "FORBIDDEN");

    if (status === "cancelled" && order.status === "pending") {
      const items = await orderRepo.findItemsByOrderId(id);
      for (const item of items) {
        await orderRepo.releaseTicketTypeSold(
          client,
          item.ticketTypeId,
          item.quantity,
        );
        await orderRepo.updateEventTicketsSold(
          client,
          item.eventId,
          -item.quantity,
        );
      }
    }

    const updated = await orderRepo.updateOrderStatus(client, id, status);
    await client.query("COMMIT");
    return updated;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

const getDashboard = async () => {
  const stats = await orderRepo.getDashboardStats();
  const recentOrders = await orderRepo.findRecentOrders(5);
  const topEvents = await orderRepo.getTopEvents(5);
  return { stats, recentOrders, topEvents };
};

module.exports = {
  createOrder,
  listOrders,
  getOrder,
  cancelOrder,
  updateOrderStatus,
  getDashboard,
};
