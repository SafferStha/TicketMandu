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

const listTickets = async (req, res, next) => {
  try {
    const result = await ticketService.listTickets(req.user, req.query);
    return response.paginated(res, result.tickets, result.pagination);
  } catch (err) {
    return next(err);
  }
};

const getTicket = async (req, res, next) => {
  try {
    const ticket = await ticketService.getTicket(req.user, req.params.id);
    return response.success(res, { ticket });
  } catch (err) {
    return next(err);
  }
};

const checkIn = async (req, res, next) => {
  try {
    const ticket = await ticketService.checkIn(req.user, req.body.ticketNumber);
    return response.success(res, { ticket }, 'Ticket checked in successfully');
  } catch (err) {
    return next(err);
  }
};

const cancelTicket = async (req, res, next) => {
  try {
    const ticket = await ticketService.cancelTicket(req.user, req.params.id);
    return response.success(res, { ticket }, 'Ticket cancelled successfully');
  } catch (err) {
    return next(err);
  }
};

const getStats = async (req, res, next) => {
  try {
    const stats = await ticketService.getStats(req.user);
    return response.success(res, { stats });
  } catch (err) {
    return next(err);
  }
};

module.exports = { getMyTickets, listTickets, getTicket, checkIn, cancelTicket, getStats };
