"use strict";

const userRepo = require("../repositories/user.repository");
const { hashPassword, comparePassword } = require("../utils/hash.util");
const { paginate } = require("../utils/paginate.util");
const ERRORS = require("../constants/errors");

const createAppError = (message, statusCode, code) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  err.code = code;
  return err;
};

const ensureUniqueUsername = async (username, userId) => {
  if (!username) return;
  const existing = await userRepo.findByUsername(username);
  if (existing && existing.id !== Number(userId)) {
    throw createAppError(
      "Username is already taken",
      409,
      "DUPLICATE_USERNAME",
    );
  }
};

const getMe = async (userId) => {
  const user = await userRepo.findById(userId);
  if (!user)
    throw createAppError(ERRORS.NOT_FOUND.message, 404, ERRORS.NOT_FOUND.code);
  return user;
};

const getStats = async (userId) => {
  const stats = await userRepo.getStats(userId);
  return {
    totalOrders: Number(stats.total_orders || 0),
    totalTickets: Number(stats.total_tickets || 0),
    upcomingTickets: Number(stats.upcoming_tickets || 0),
    usedCompletedTickets: Number(stats.used_completed_tickets || 0),
    favoriteEvents: Number(stats.favorite_events || 0),
    reviewsWritten: Number(stats.reviews_written || 0),
    unreadNotifications: Number(stats.unread_notifications || 0),
    totalAmountSpent: Number(stats.total_amount_spent || 0),
    pendingOrders: Number(stats.pending_orders || 0),
    cancelledOrders: Number(stats.cancelled_orders || 0),
  };
};

const updateMe = async (userId, { name, username, email, phone, image }) => {
  const updates = {};
  if (name !== undefined) updates.name = name;
  if (username !== undefined) {
    await ensureUniqueUsername(username, userId);
    updates.username = username;
  }
  if (email) {
    const existing = await userRepo.findByEmail(email);
    if (existing && existing.id !== userId) {
      throw createAppError(
        ERRORS.DUPLICATE_EMAIL.message,
        409,
        ERRORS.DUPLICATE_EMAIL.code,
      );
    }
    updates.email = email;
  }
  if (phone !== undefined) updates.phone = phone || null;
  if (image !== undefined) updates.image = image;

  const updated = await userRepo.updateById(userId, updates);
  if (!updated)
    throw createAppError(ERRORS.NOT_FOUND.message, 404, ERRORS.NOT_FOUND.code);
  return updated;
};

const changePassword = async (userId, { currentPassword, newPassword }) => {
  const user = await userRepo.findPasswordById(userId);
  if (!user)
    throw createAppError(ERRORS.NOT_FOUND.message, 404, ERRORS.NOT_FOUND.code);
  const matches = await comparePassword(currentPassword, user.password);
  if (!matches)
    throw createAppError(
      "Current password is incorrect",
      400,
      "INVALID_CURRENT_PASSWORD",
    );
  if (currentPassword === newPassword)
    throw createAppError(
      "New password must be different from current password",
      400,
      "PASSWORD_UNCHANGED",
    );
  await userRepo.updateById(userId, {
    password: await hashPassword(newPassword),
  });
  return true;
};

const listUsers = async (query = {}) => {
  const { page, limit, q, role, status } = query;
  const { limit: safeLimit, offset, buildMeta } = paginate(page, limit);
  const { users, total } = await userRepo.findAll({
    limit: safeLimit,
    offset,
    q,
    role,
    status,
  });
  return { users, pagination: buildMeta(total) };
};

const createUser = async ({ name, username, email, password, role }) => {
  const existing = await userRepo.findByEmail(email);
  if (existing)
    throw createAppError(
      ERRORS.DUPLICATE_EMAIL.message,
      409,
      ERRORS.DUPLICATE_EMAIL.code,
    );
  await ensureUniqueUsername(username);
  const passwordHash = await hashPassword(password);
  return userRepo.create({ name, username, email, passwordHash, role });
};

const updateUser = async (userId, data) => {
  const user = await userRepo.findByIdForAdmin(userId);
  if (!user)
    throw createAppError(ERRORS.NOT_FOUND.message, 404, ERRORS.NOT_FOUND.code);
  const updates = {};
  if (data.name !== undefined) updates.name = data.name;
  if (data.username !== undefined) {
    await ensureUniqueUsername(data.username, userId);
    updates.username = data.username;
  }
  if (data.email !== undefined) updates.email = data.email;
  if (data.phone !== undefined) updates.phone = data.phone;
  if (data.role !== undefined) updates.role = data.role;
  if (data.is_active !== undefined) updates.is_active = data.is_active;
  if (data.password) updates.password = await hashPassword(data.password);

  const updated = await userRepo.updateById(userId, updates);
  if (!updated)
    throw createAppError(ERRORS.NOT_FOUND.message, 404, ERRORS.NOT_FOUND.code);
  return updated;
};

const setStatus = async (userId, isActive) => {
  const updated = await userRepo.updateById(userId, { is_active: isActive });
  if (!updated)
    throw createAppError(ERRORS.NOT_FOUND.message, 404, ERRORS.NOT_FOUND.code);
  return updated;
};

const deleteUser = async (userId) => {
  const user = await userRepo.findById(userId);
  if (!user)
    throw createAppError(ERRORS.NOT_FOUND.message, 404, ERRORS.NOT_FOUND.code);
  await userRepo.deleteById(userId);
};

const getPreferences = (userId) => userRepo.getPreferences(userId);
const updatePreferences = (userId, data) =>
  userRepo.updatePreferences(userId, data);

const listLocations = (userId) => userRepo.listLocations(userId);
const createLocation = (userId, data) => userRepo.createLocation(userId, data);
const updateLocation = async (userId, id, data) => {
  const location = await userRepo.updateLocation(userId, id, data);
  if (!location)
    throw createAppError("Location not found", 404, "LOCATION_NOT_FOUND");
  return location;
};
const deleteLocation = async (userId, id) => {
  const deleted = await userRepo.deleteLocation(userId, id);
  if (!deleted)
    throw createAppError("Location not found", 404, "LOCATION_NOT_FOUND");
};
const setDefaultLocation = async (userId, id) => {
  const location = await userRepo.setDefaultLocation(userId, id);
  if (!location)
    throw createAppError("Location not found", 404, "LOCATION_NOT_FOUND");
  return location;
};

const listPaymentMethods = (userId) => userRepo.listPaymentMethods(userId);
const createPaymentMethod = (userId, data) =>
  userRepo.createPaymentMethod(userId, data);
const updatePaymentMethod = async (userId, id, data) => {
  const method = await userRepo.updatePaymentMethod(userId, id, data);
  if (!method)
    throw createAppError(
      "Payment method not found",
      404,
      "PAYMENT_METHOD_NOT_FOUND",
    );
  return method;
};
const deletePaymentMethod = async (userId, id) => {
  const deleted = await userRepo.deletePaymentMethod(userId, id);
  if (!deleted)
    throw createAppError(
      "Payment method not found",
      404,
      "PAYMENT_METHOD_NOT_FOUND",
    );
};
const setDefaultPaymentMethod = async (userId, id) => {
  const method = await userRepo.setDefaultPaymentMethod(userId, id);
  if (!method)
    throw createAppError(
      "Payment method not found",
      404,
      "PAYMENT_METHOD_NOT_FOUND",
    );
  return method;
};

module.exports = {
  getMe,
  getStats,
  updateMe,
  changePassword,
  listUsers,
  createUser,
  updateUser,
  setStatus,
  deleteUser,
  getPreferences,
  updatePreferences,
  listLocations,
  createLocation,
  updateLocation,
  deleteLocation,
  setDefaultLocation,
  listPaymentMethods,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
  setDefaultPaymentMethod,
};
