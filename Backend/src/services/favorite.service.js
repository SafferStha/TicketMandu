'use strict';

const favoriteRepo = require('../repositories/favorite.repository');
const eventRepo = require('../repositories/event.repository');

const createAppError = (message, statusCode, code) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  err.code = code;
  return err;
};

const addFavorite = async (userId, eventId) => {
  const event = await eventRepo.findById(eventId);
  if (!event) throw createAppError('Event not found', 404, 'EVENT_NOT_FOUND');
  await favoriteRepo.add(userId, eventId);
};

const removeFavorite = async (userId, eventId) => favoriteRepo.remove(userId, eventId);
const listMyFavorites = async (userId) => favoriteRepo.listMy(userId);

module.exports = { addFavorite, removeFavorite, listMyFavorites };