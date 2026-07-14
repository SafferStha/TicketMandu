'use strict';

const favoriteService = require('../services/favorite.service');
const response = require('../utils/response.util');

const add = async (req, res, next) => {
  try {
    await favoriteService.addFavorite(req.user.id, req.params.eventId);
    return response.success(res, null, 'Event added to favorites');
  } catch (err) { return next(err); }
};

const remove = async (req, res, next) => {
  try {
    await favoriteService.removeFavorite(req.user.id, req.params.eventId);
    return response.success(res, null, 'Event removed from favorites');
  } catch (err) { return next(err); }
};

const listMy = async (req, res, next) => {
  try {
    const favorites = await favoriteService.listMyFavorites(req.user.id);
    return response.success(res, { favorites });
  } catch (err) { return next(err); }
};

module.exports = { add, remove, listMy };