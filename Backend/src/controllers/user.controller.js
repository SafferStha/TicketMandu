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
    const { page, limit } = req.query;
    const result = await userService.listUsers(page, limit);
    return response.paginated(res, result.users, result.pagination);
  } catch (err) {
    return next(err);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    await userService.deleteUser(req.params.id);
    return response.noContent(res);
  } catch (err) {
    return next(err);
  }
};

module.exports = { getMe, updateMe, listUsers, deleteUser };
