'use strict';

const eventService = require('../services/event.service');
const response = require('../utils/response.util');

const listEvents = async (req, res, next) => {
  try {
    const result = await eventService.listEvents(req.query);
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
    const event = await eventService.createEvent(req.body);
    return response.created(res, { event }, 'Event created successfully');
  } catch (err) {
    return next(err);
  }
};

const updateEvent = async (req, res, next) => {
  try {
    const event = await eventService.updateEvent(req.params.id, req.body);
    return response.success(res, { event }, 'Event updated successfully');
  } catch (err) {
    return next(err);
  }
};

const deleteEvent = async (req, res, next) => {
  try {
    await eventService.deleteEvent(req.params.id);
    return response.noContent(res);
  } catch (err) {
    return next(err);
  }
};

module.exports = { listEvents, getFeatured, getById, search, createEvent, updateEvent, deleteEvent };
