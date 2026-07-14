'use strict';

const userService = require('../services/user.service');
const response = require('../utils/response.util');

const getMe = async (req, res, next) => {
  try {
    const user = await userService.getMe(req.user.id);
    return response.success(res, { user });
  } catch (err) {
    return next(err);
  }
};

const updateMe = async (req, res, next) => {
  try {
    const image = req.file ? req.file.filename : undefined;
    const user = await userService.updateMe(req.user.id, { ...req.body, image });
    return response.success(res, { user }, 'Profile updated successfully');
  } catch (err) {
    return next(err);
  }
};

const listUsers = async (req, res, next) => {
  try {
    const result = await userService.listUsers(req.query);
    return response.paginated(res, result.users, result.pagination);
  } catch (err) {
    return next(err);
  }
};

const createUser = async (req, res, next) => {
  try {
    const user = await userService.createUser(req.body);
    return response.created(res, { user }, 'User created successfully');
  } catch (err) {
    return next(err);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const user = await userService.updateUser(req.params.id, req.body);
    return response.success(res, { user }, 'User updated successfully');
  } catch (err) {
    return next(err);
  }
};

const setUserStatus = async (req, res, next) => {
  try {
    const user = await userService.setStatus(req.params.id, req.body.is_active);
    return response.success(res, { user }, 'User status updated successfully');
  } catch (err) {
    return next(err);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    await userService.deleteUser(req.params.id);
    return response.success(res, null, 'User deleted successfully');
  } catch (err) {
    return next(err);
  }
};

module.exports = { getMe, updateMe, listUsers, createUser, updateUser, setUserStatus, deleteUser };
