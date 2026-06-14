'use strict';

const ticketService = require('../services/ticket.service');
const response = require('../utils/response.util');

const getMyTickets = async (req, res, next) => {
  try {
    const result = await ticketService.getMyTickets(req.user.id, req.query);
    return response.paginated(res, result.tickets, result.pagination);
  } catch (err) {
    return next(err);
  }
};

const bookTicket = async (req, res, next) => {
  try {
    const ticket = await ticketService.bookTicket(req.user.id, req.body);
    return response.created(res, { ticket }, 'Ticket booked successfully');
  } catch (err) {
    return next(err);
  }
};

const getStats = async (req, res, next) => {
  try {
    const stats = await ticketService.getStats(req.user.id);
    return response.success(res, { stats });
  } catch (err) {
    return next(err);
  }
};

module.exports = { getMyTickets, bookTicket, getStats };
