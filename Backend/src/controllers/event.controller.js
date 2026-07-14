'use strict';

const eventService = require('../services/event.service');
const response = require('../utils/response.util');

const listEvents = async (req, res, next) => {
  try {
    const result = await eventService.listEvents(req.query, req.user || null);
    return response.paginated(res, result.events, result.pagination);
  } catch (err) {
    return next(err);
  }
};

const getFeatured = async (req, res, next) => {
  try {
    const events = await eventService.getFeaturedEvents();
    return response.success(res, { events });
  } catch (err) {
    return next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const event = await eventService.getEventById(req.params.id);
    return response.success(res, { event });
  } catch (err) {
    return next(err);
  }
};

const getTicketTypes = async (req, res, next) => {
  try {
    const ticketTypes = await eventService.getTicketTypes(req.params.id);
    return response.success(res, { ticketTypes });
  } catch (err) {
    return next(err);
  }
};

const search = async (req, res, next) => {
  try {
    const result = await eventService.searchEvents(req.validatedQuery || req.query);
    return response.paginated(res, result.events, result.pagination);
  } catch (err) {
    return next(err);
  }
};

const createEvent = async (req, res, next) => {
  try {
    const event = await eventService.createEvent(req.body, req.user || null);
    return response.created(res, { event }, 'Event created successfully');
  } catch (err) {
    return next(err);
  }
};

const updateEvent = async (req, res, next) => {
  try {
    const event = await eventService.updateEvent(req.params.id, req.body, req.user || null);
    return response.success(res, { event }, 'Event updated successfully');
  } catch (err) {
    return next(err);
  }
};

const deleteEvent = async (req, res, next) => {
  try {
    await eventService.deleteEvent(req.params.id, req.user || null);
    return response.success(res, null, 'Event deleted successfully');
  } catch (err) {
    return next(err);
  }
};

module.exports = { listEvents, getFeatured, getById, getTicketTypes, search, createEvent, updateEvent, deleteEvent };
