'use strict';

const eventRepo = require('../repositories/event.repository');
const { paginate } = require('../utils/paginate.util');
const ERRORS = require('../constants/errors');

const createAppError = (message, statusCode, code) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  err.code = code;
  return err;
};

const listEvents = async (query = {}) => {
  const { limit: safeLimit, offset, buildMeta } = paginate(query.page, query.limit);
  const { events, total } = await eventRepo.findAll({
    limit: safeLimit,
    offset,
    sort: query.sort,
    order: query.order,
  });
  return { events, pagination: buildMeta(total) };
};

const getFeaturedEvents = async () => {
  return eventRepo.findFeatured(10);
};

const getEventById = async (id) => {
  const event = await eventRepo.findById(id);
  if (!event) throw createAppError(ERRORS.EVENT_NOT_FOUND.message, 404, ERRORS.EVENT_NOT_FOUND.code);
  return event;
};

const searchEvents = async (query = {}) => {
  const { limit: safeLimit, offset, buildMeta } = paginate(query.page, query.limit);
  const { events, total } = await eventRepo.search({
    q: query.q,
    category: query.category,
    minPrice: query.minPrice,
    maxPrice: query.maxPrice,
    limit: safeLimit,
    offset,
    sort: query.sort,
    order: query.order,
  });
  return { events, pagination: buildMeta(total) };
};

const createEvent = async (data) => {
  return eventRepo.create(data);
};

const updateEvent = async (id, data) => {
  const existing = await eventRepo.findById(id);
  if (!existing) throw createAppError(ERRORS.EVENT_NOT_FOUND.message, 404, ERRORS.EVENT_NOT_FOUND.code);
  return eventRepo.updateById(id, data);
};

const deleteEvent = async (id) => {
  const existing = await eventRepo.findById(id);
  if (!existing) throw createAppError(ERRORS.EVENT_NOT_FOUND.message, 404, ERRORS.EVENT_NOT_FOUND.code);
  await eventRepo.deleteById(id);
};

module.exports = { listEvents, getFeaturedEvents, getEventById, searchEvents, createEvent, updateEvent, deleteEvent };
