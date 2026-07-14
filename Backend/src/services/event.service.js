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

const listEvents = async (query = {}, actor = null) => {
  const { limit: safeLimit, offset, buildMeta } = paginate(query.page, query.limit);
  const { events, total } = await eventRepo.findAll({
    limit: safeLimit,
    offset,
    sort: query.sort,
    order: query.order,
    q: query.q,
    category: query.category,
    status: query.status,
    featured: query.featured,
    minPrice: query.minPrice,
    maxPrice: query.maxPrice,
    dateFrom: query.dateFrom,
    dateTo: query.dateTo,
    scope: actor?.role ? query.scope || 'public' : 'public',
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

const getTicketTypes = async (id) => {
  const event = await eventRepo.findById(id);
  if (!event) throw createAppError(ERRORS.EVENT_NOT_FOUND.message, 404, ERRORS.EVENT_NOT_FOUND.code);
  return eventRepo.findTicketTypesByEventId(id);
};

const searchEvents = async (query = {}) => listEvents({ ...query, scope: 'all' });

const createEvent = async (data, actor = null) => {
  return eventRepo.create({
    ...data,
    organizer_id: actor?.role === 'organizer' ? actor.id : data.organizer_id,
    status: data.status || 'draft',
  });
};

const updateEvent = async (id, data, actor = null) => {
  const existing = await eventRepo.findById(id);
  if (!existing) throw createAppError(ERRORS.EVENT_NOT_FOUND.message, 404, ERRORS.EVENT_NOT_FOUND.code);

  if (actor?.role === 'organizer' && existing.organizerId && existing.organizerId !== actor.id) {
    throw createAppError(ERRORS.FORBIDDEN.message, 403, ERRORS.FORBIDDEN.code);
  }

  return eventRepo.updateById(id, data);
};

const deleteEvent = async (id, actor = null) => {
  const existing = await eventRepo.findById(id);
  if (!existing) throw createAppError(ERRORS.EVENT_NOT_FOUND.message, 404, ERRORS.EVENT_NOT_FOUND.code);

  if (actor?.role === 'organizer' && existing.organizerId && existing.organizerId !== actor.id) {
    throw createAppError(ERRORS.FORBIDDEN.message, 403, ERRORS.FORBIDDEN.code);
  }

  await eventRepo.deleteById(id);
};

module.exports = { listEvents, getFeaturedEvents, getEventById, getTicketTypes, searchEvents, createEvent, updateEvent, deleteEvent };
