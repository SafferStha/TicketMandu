"use strict";

const crypto = require("crypto");
const db = require("../config/db");
const paymentRepo = require("../repositories/payment.repository");
const orderRepo = require("../repositories/order.repository");
const ticketService = require("./ticket.service");
const notificationRepo = require("../repositories/notification.repository");
const { paginate } = require("../utils/paginate.util");

const createAppError = (message, statusCode, code) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  err.code = code;
  return err;
};

const mockPay = async (actor, orderId) => {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const order = await orderRepo.findByIdWithItems(orderId);
    if (!order) throw createAppError("Order not found", 404, "ORDER_NOT_FOUND");
    if (actor?.role === "user" && order.userId !== actor.id)
      throw createAppError("Forbidden", 403, "FORBIDDEN");
    if (["cancelled", "expired", "refunded"].includes(order.status)) {
      throw createAppError(
        `Cannot pay a ${order.status} order`,
        409,
        "ORDER_NOT_PAYABLE",
      );
    }

    const existing = await paymentRepo.findByOrderId(orderId);
    if (existing && existing.status === "paid") {
      await client.query("COMMIT");
      return existing;
    }
    if (["confirmed", "paid"].includes(order.status)) {
      throw createAppError(
        "Payment already completed",
        409,
        "PAYMENT_ALREADY_COMPLETED",
      );
    }

    const payment = await paymentRepo.createPayment(client, {
      orderId: order.id,
      userId: order.userId,
      paymentMethod: "mock",
      status: "paid",
      amount: order.totalAmount,
      currency: order.currency,
      gatewayReference: `MOCK-${crypto.randomBytes(6).toString("hex").toUpperCase()}`,
      gatewayPayload: { provider: "mock", paidAt: new Date().toISOString() },
    });

    await orderRepo.updateOrderStatus(client, order.id, "confirmed");
    await ticketService.generateTicketsForOrder(client, order, payment.id);
    await notificationRepo.createNotification(client, {
      userId: order.userId,
      type: "payment_success",
      title: "Payment successful",
      body: `Payment for order ${order.orderNumber} was successful.`,
      data: { orderId: order.id, paymentId: payment.id },
    });

    await client.query("COMMIT");
    return payment;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

const listPayments = async (actor, query = {}) => {
  const {
    limit: safeLimit,
    offset,
    buildMeta,
  } = paginate(query.page, query.limit);
  const where = ["1=1"];
  const params = [];
  let idx = 1;
  if (actor?.role === "user") {
    where.push(`p.user_id = $${idx}`);
    params.push(actor.id);
    idx += 1;
  } else if (actor?.role === "organizer") {
    where.push(`e.organizer_id = $${idx}`);
    params.push(actor.id);
    idx += 1;
  }
  if (query.status) {
    where.push(`p.status = $${idx}`);
    params.push(query.status);
    idx += 1;
  }
  const result = await paymentRepo.listPayments({
    where: where.join(" AND "),
    params,
    limit: safeLimit,
    offset,
    orderBy: "p.created_at DESC",
  });
  return { payments: result.payments, pagination: buildMeta(result.total) };
};

const getPayment = async (actor, id) => {
  const payment = await paymentRepo.findById(id);
  if (!payment)
    throw createAppError("Payment not found", 404, "PAYMENT_NOT_FOUND");
  if (actor?.role === "user" && payment.user_id !== actor.id)
    throw createAppError("Forbidden", 403, "FORBIDDEN");
  return payment;
};

const updatePaymentStatus = async (actor, id, status) => {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const payment = await paymentRepo.findById(id);
    if (!payment)
      throw createAppError("Payment not found", 404, "PAYMENT_NOT_FOUND");
    if (actor?.role === "user" && payment.user_id !== actor.id)
      throw createAppError("Forbidden", 403, "FORBIDDEN");
    const updated = await paymentRepo.updateStatus(client, id, status, {});
    if (status === "paid") {
      const order = await orderRepo.findByIdWithItems(payment.order_id);
      await orderRepo.updateOrderStatus(client, payment.order_id, "confirmed");
      await ticketService.generateTicketsForOrder(client, order, payment.id);
    }
    if (status === "refunded") {
      await orderRepo.updateOrderStatus(client, payment.order_id, "refunded");
    }
    await client.query("COMMIT");
    return updated;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

const refundPayment = async (actor, id) =>
  updatePaymentStatus(actor, id, "refunded");

module.exports = {
  mockPay,
  listPayments,
  getPayment,
  updatePaymentStatus,
  refundPayment,
};
