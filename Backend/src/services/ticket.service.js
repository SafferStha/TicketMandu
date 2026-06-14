'use strict';

const ticketRepo = require('../repositories/ticket.repository');
const eventRepo = require('../repositories/event.repository');
const { paginate } = require('../utils/paginate.util');
const ERRORS = require('../constants/errors');

const createAppError = (message, statusCode, code) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  err.code = code;
  return err;
};

const getMyTickets = async (userId, query = {}) => {
  const { limit: safeLimit, offset, buildMeta } = paginate(query.page, query.limit);
  const { tickets, total } = await ticketRepo.findByUserId(userId, { limit: safeLimit, offset });
  return { tickets, pagination: buildMeta(total) };
};

const bookTicket = async (userId, { eventId, seat }) => {
  const event = await eventRepo.findById(eventId);
  if (!event) {
    throw createAppError(ERRORS.EVENT_NOT_FOUND.message, 404, ERRORS.EVENT_NOT_FOUND.code);
  }

  const alreadyBooked = await ticketRepo.countByUserAndEvent(userId, eventId);
  if (alreadyBooked > 0) {
    throw createAppError('You have already booked this event', 409, 'ALREADY_BOOKED');
  }

  const ticket = await ticketRepo.create(userId, eventId, seat);
  return ticket;
};

const getStats = async (userId) => {
  let stats;
  try {
    stats = await ticketRepo.getStatsByUser(userId);
  } catch {
    const total = await ticketRepo.countByUser(userId);
    stats = { upcomingCount: total, pastCount: 0, totalCount: total };
  }
  return {
    ticketsCount: stats.totalCount,
    eventsCount: stats.totalCount,
    favoritesCount: 0,
    upcomingCount: stats.upcomingCount,
    pastCount: stats.pastCount,
  };
};

module.exports = { getMyTickets, bookTicket, getStats };
