'use strict';

const reviewService = require('../services/review.service');
const response = require('../utils/response.util');


const list = async (req, res, next) => {
  try {
    const result = await reviewService.listReviews(req.user, req.query);
    return response.paginated(res, result.reviews, result.pagination);
  } catch (err) { return next(err); }
};

const create = async (req, res, next) => {
  try {
    const review = await reviewService.createReview(req.user.id, req.body);
    return response.created(res, { review }, 'Review submitted successfully');
  } catch (err) { return next(err); }
};

const listByEvent = async (req, res, next) => {
  try {
    const data = await reviewService.listEventReviews(req.params.eventId || req.params.id);
    return response.success(res, data);
  } catch (err) { return next(err); }
};

const update = async (req, res, next) => {
  try {
    const review = await reviewService.updateReview(req.user.id, req.params.id, req.body, req.user.role === 'admin');
    return response.success(res, { review }, 'Review updated successfully');
  } catch (err) { return next(err); }
};

const remove = async (req, res, next) => {
  try {
    await reviewService.deleteReview(req.user.id, req.params.id, req.user.role === 'admin');
    return response.success(res, null, 'Review deleted successfully');
  } catch (err) { return next(err); }
};

const status = async (req, res, next) => {
  try {
    const review = await reviewService.setStatus(req.params.id, req.body.is_visible);
    return response.success(res, { review }, 'Review visibility updated');
  } catch (err) { return next(err); }
};

module.exports = { list, create, listByEvent, update, remove, status };