'use strict';

const userRepo = require('../repositories/user.repository');
const { hashPassword } = require('../utils/hash.util');
const { paginate } = require('../utils/paginate.util');
const ERRORS = require('../constants/errors');

const createAppError = (message, statusCode, code) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  err.code = code;
  return err;
};

const getMe = async (userId) => {
  const user = await userRepo.findById(userId);
  if (!user) throw createAppError(ERRORS.NOT_FOUND.message, 404, ERRORS.NOT_FOUND.code);
  return user;
};

const updateMe = async (userId, { name, email, password, image }) => {
  const updates = {};

  if (name) updates.name = name;

  if (email) {
    const existing = await userRepo.findByEmail(email);
    if (existing && existing.id !== userId) {
      throw createAppError(ERRORS.DUPLICATE_EMAIL.message, 409, ERRORS.DUPLICATE_EMAIL.code);
    }
    updates.email = email;
  }

  if (password) {
    updates.password = await hashPassword(password);
  }

  if (image !== undefined) {
    updates.image = image;
  }

  const updated = await userRepo.updateById(userId, updates);
  if (!updated) throw createAppError(ERRORS.NOT_FOUND.message, 404, ERRORS.NOT_FOUND.code);

  return updated;
};

const listUsers = async (query = {}) => {
  const { page, limit, q, role, status } = query;
  const { limit: safeLimit, offset, buildMeta } = paginate(page, limit);
  const { users, total } = await userRepo.findAll({ limit: safeLimit, offset, q, role, status });
  return { users, pagination: buildMeta(total) };
};

const createUser = async ({ name, email, password, role }) => {
  const existing = await userRepo.findByEmail(email);
  if (existing) {
    throw createAppError(ERRORS.DUPLICATE_EMAIL.message, 409, ERRORS.DUPLICATE_EMAIL.code);
  }

  const passwordHash = await hashPassword(password);
  return userRepo.create({ name, email, passwordHash, role });
};

const updateUser = async (userId, data) => {
  const user = await userRepo.findByIdForAdmin(userId);
  if (!user) throw createAppError(ERRORS.NOT_FOUND.message, 404, ERRORS.NOT_FOUND.code);

  const updates = {};
  if (data.name !== undefined) updates.name = data.name;
  if (data.email !== undefined) updates.email = data.email;
  if (data.phone !== undefined) updates.phone = data.phone;
  if (data.role !== undefined) updates.role = data.role;
  if (data.is_active !== undefined) updates.is_active = data.is_active;
  if (data.password) updates.password = await hashPassword(data.password);

  const updated = await userRepo.updateById(userId, updates);
  if (!updated) throw createAppError(ERRORS.NOT_FOUND.message, 404, ERRORS.NOT_FOUND.code);
  return updated;
};

const setStatus = async (userId, isActive) => {
  const updated = await userRepo.updateById(userId, { is_active: isActive });
  if (!updated) throw createAppError(ERRORS.NOT_FOUND.message, 404, ERRORS.NOT_FOUND.code);
  return updated;
};

const deleteUser = async (userId) => {
  const user = await userRepo.findById(userId);
  if (!user) throw createAppError(ERRORS.NOT_FOUND.message, 404, ERRORS.NOT_FOUND.code);
  await userRepo.deleteById(userId);
};

module.exports = { getMe, updateMe, listUsers, createUser, updateUser, setStatus, deleteUser };
