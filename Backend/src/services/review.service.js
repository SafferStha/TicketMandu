'use strict';

const reviewRepo = require('../repositories/review.repository');
const orderRepo = require('../repositories/order.repository');
const { paginate } = require('../utils/paginate.util');

const createAppError = (message, statusCode, code) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  err.code = code;
  return err;
};

const canReviewEvent = async (userId, eventId) => {
  const result = await orderRepo.listOrders({
    where: `o.user_id = $1 AND e.id = $2 AND o.status IN ('confirmed', 'paid')`,
    params: [userId, eventId],
    limit: 1,
    offset: 0,
  });
  return result.total > 0;
};

const listReviews = async (actor, query = {}) => {
  const { limit, offset, buildMeta } = paginate(query.page, query.limit);
  const where = [];
  const params = [];
  let idx = 1;

  if (actor?.role === 'organizer') {
    where.push(`e.organizer_id = $${idx}`);
    params.push(actor.id);
    idx += 1;
  }

  if (query.q) {
    where.push(`(LOWER(COALESCE(r.body, '')) LIKE $${idx} OR LOWER(e.name) LIKE $${idx})`);
    params.push(`%${String(query.q).toLowerCase()}%`);
    idx += 1;
  }

  if (query.eventId) {
    where.push(`r.event_id = $${idx}`);
    params.push(query.eventId);
  }

  const result = await reviewRepo.listAll({ where: where.length ? where.join(' AND ') : '1=1', params, limit, offset });
  return { reviews: result.reviews, pagination: buildMeta(result.total) };
};

const createReview = async (userId, data) => {
  const eligible = await canReviewEvent(userId, data.eventId);
  if (!eligible) throw createAppError('You can only review events you booked', 403, 'NOT_ELIGIBLE');
  return reviewRepo.create({ userId, ...data });
};

const listEventReviews = async (eventId) => ({
  reviews: await reviewRepo.findByEvent(eventId),
  summary: await reviewRepo.getSummary(eventId),
});

const updateReview = async (userId, id, data, isAdmin = false) => reviewRepo.update(id, userId, data, isAdmin);
const deleteReview = async (userId, id, isAdmin = false) => reviewRepo.remove(id, userId, isAdmin);
const setStatus = async (id, visible) => reviewRepo.hide(id, visible);

module.exports = { listReviews, createReview, listEventReviews, updateReview, deleteReview, setStatus };
