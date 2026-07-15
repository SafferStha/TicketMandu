"use strict";

const crypto = require("crypto");
const db = require("../config/db");
const ticketRepo = require("../repositories/ticket.repository");
const notificationRepo = require("../repositories/notification.repository");
const { paginate } = require("../utils/paginate.util");

const createAppError = (message, statusCode, code) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  err.code = code;
  return err;
};

const generateTicketNumber = () =>
  `TKT-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

const generateTicketsForOrder = async (client, order, paymentId) => {
  const existing = await ticketRepo.countByOrderId(order.id, client);
  if (existing > 0) return existing;

  const items = order.items || [];
  for (const item of items) {
    for (let i = 0; i < item.quantity; i += 1) {
      await ticketRepo.create(client, {
        userId: order.userId,
        eventId: item.eventId,
        orderId: order.id,
        ticketTypeId: item.ticketTypeId,
        ticketNumber: generateTicketNumber(),
        qrCodeValue: `TM-${order.orderNumber}-${item.ticketTypeId}-${i + 1}`,
        status: "active",
      });
    }
  }

  await notificationRepo.createNotification(client, {
    userId: order.userId,
    type: "ticket_generated",
    title: "Tickets generated",
    body: `Tickets for order ${order.orderNumber} are ready.`,
    data: { orderId: order.id, paymentId },
  });
};

const getMyTickets = async (userId, query = {}) => {
  const {
    limit: safeLimit,
    offset,
    buildMeta,
  } = paginate(query.page, query.limit);
  const result = await ticketRepo.list({
    where: "t.user_id = $1",
    params: [userId],
    limit: safeLimit,
    offset,
  });
  return { tickets: result.tickets, pagination: buildMeta(result.total) };
};

const listTickets = async (actor, query = {}) => {
  const {
    limit: safeLimit,
    offset,
    buildMeta,
  } = paginate(query.page, query.limit);
  let where = "1=1";
  let params = [];
  if (actor?.role === "user") {
    where = "t.user_id = $1";
    params = [actor.id];
  } else if (actor?.role === "organizer") {
    where =
      "e.organizer_id IN (SELECT id FROM organizers WHERE user_id = $1 AND deleted_at IS NULL)";
    params = [actor.id];
  }
  const result = await ticketRepo.list({
    where,
    params,
    limit: safeLimit,
    offset,
  });
  return { tickets: result.tickets, pagination: buildMeta(result.total) };
};

const getTicket = async (actor, id) => {
  const ticket = await ticketRepo.findById(id);
  if (!ticket)
    throw createAppError("Ticket not found", 404, "TICKET_NOT_FOUND");
  if (actor?.role === "user" && ticket.user_id !== actor.id)
    throw createAppError("Forbidden", 403, "FORBIDDEN");
  return ticket;
};

const checkIn = async (actor, ticketNumber) => {
  if (!["admin", "organizer"].includes(actor?.role)) {
    throw createAppError(
      "Only admins and organizers can check in tickets",
      403,
      "FORBIDDEN",
    );
  }
  const ticket = await ticketRepo.findByTicketNumber(ticketNumber);
  if (!ticket)
    throw createAppError("Ticket not found", 404, "TICKET_NOT_FOUND");
  if (actor?.role === "organizer" && ticket.organizer_id !== actor.id)
    throw createAppError("Forbidden", 403, "FORBIDDEN");
  if (ticket.checked_in_at)
    throw createAppError(
      "Ticket has already been checked in",
      409,
      "TICKET_ALREADY_USED",
    );
  if (ticket.status !== "active")
    throw createAppError(
      "Ticket cannot be checked in",
      409,
      "INVALID_TICKET_STATUS",
    );
  return ticketRepo.markCheckedIn(ticket.id);
};

const cancelTicket = async (actor, id) => {
  const ticket = await ticketRepo.findById(id);
  if (!ticket)
    throw createAppError("Ticket not found", 404, "TICKET_NOT_FOUND");
  if (actor?.role === "user" && ticket.user_id !== actor.id)
    throw createAppError("Forbidden", 403, "FORBIDDEN");
  return ticketRepo.updateStatus(id, "cancelled");
};

const getStats = async (actor) => ticketRepo.getStats(actor);

module.exports = {
  generateTicketsForOrder,
  getMyTickets,
  listTickets,
  getTicket,
  checkIn,
  cancelTicket,
  getStats,
};
