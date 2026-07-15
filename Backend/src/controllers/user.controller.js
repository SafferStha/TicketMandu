"use strict";

const userService = require("../services/user.service");
const response = require("../utils/response.util");

const getMe = async (req, res, next) => {
  try {
    const user = await userService.getMe(req.user.id);
    return response.success(res, { user });
  } catch (err) {
    return next(err);
  }
};

const getStats = async (req, res, next) => {
  try {
    const stats = await userService.getStats(req.user.id);
    return response.success(res, { stats });
  } catch (err) {
    return next(err);
  }
};

const updateMe = async (req, res, next) => {
  try {
    const image = req.file ? req.file.filename : undefined;
    const user = await userService.updateMe(req.user.id, {
      ...req.body,
      image,
    });
    return response.success(res, { user }, "Profile updated successfully");
  } catch (err) {
    return next(err);
  }
};

const changePassword = async (req, res, next) => {
  try {
    await userService.changePassword(req.user.id, req.body);
    return response.success(res, null, "Password changed successfully");
  } catch (err) {
    return next(err);
  }
};

const getPreferences = async (req, res, next) => {
  try {
    const preferences = await userService.getPreferences(req.user.id);
    return response.success(res, { preferences });
  } catch (err) {
    return next(err);
  }
};

const updatePreferences = async (req, res, next) => {
  try {
    const preferences = await userService.updatePreferences(
      req.user.id,
      req.body,
    );
    return response.success(
      res,
      { preferences },
      "Preferences updated successfully",
    );
  } catch (err) {
    return next(err);
  }
};

const listLocations = async (req, res, next) => {
  try {
    const locations = await userService.listLocations(req.user.id);
    return response.success(res, { locations });
  } catch (err) {
    return next(err);
  }
};

const createLocation = async (req, res, next) => {
  try {
    const location = await userService.createLocation(req.user.id, req.body);
    return response.created(res, { location }, "Location saved successfully");
  } catch (err) {
    return next(err);
  }
};

const updateLocation = async (req, res, next) => {
  try {
    const location = await userService.updateLocation(
      req.user.id,
      req.params.id,
      req.body,
    );
    return response.success(res, { location }, "Location updated successfully");
  } catch (err) {
    return next(err);
  }
};

const deleteLocation = async (req, res, next) => {
  try {
    await userService.deleteLocation(req.user.id, req.params.id);
    return response.success(res, null, "Location deleted successfully");
  } catch (err) {
    return next(err);
  }
};

const setDefaultLocation = async (req, res, next) => {
  try {
    const location = await userService.setDefaultLocation(
      req.user.id,
      req.params.id,
    );
    return response.success(
      res,
      { location },
      "Default location updated successfully",
    );
  } catch (err) {
    return next(err);
  }
};

const listPaymentMethods = async (req, res, next) => {
  try {
    const paymentMethods = await userService.listPaymentMethods(req.user.id);
    return response.success(res, { paymentMethods });
  } catch (err) {
    return next(err);
  }
};

const createPaymentMethod = async (req, res, next) => {
  try {
    const paymentMethod = await userService.createPaymentMethod(
      req.user.id,
      req.body,
    );
    return response.created(
      res,
      { paymentMethod },
      "Payment method saved successfully",
    );
  } catch (err) {
    return next(err);
  }
};

const updatePaymentMethod = async (req, res, next) => {
  try {
    const paymentMethod = await userService.updatePaymentMethod(
      req.user.id,
      req.params.id,
      req.body,
    );
    return response.success(
      res,
      { paymentMethod },
      "Payment method updated successfully",
    );
  } catch (err) {
    return next(err);
  }
};

const deletePaymentMethod = async (req, res, next) => {
  try {
    await userService.deletePaymentMethod(req.user.id, req.params.id);
    return response.success(res, null, "Payment method deleted successfully");
  } catch (err) {
    return next(err);
  }
};

const setDefaultPaymentMethod = async (req, res, next) => {
  try {
    const paymentMethod = await userService.setDefaultPaymentMethod(
      req.user.id,
      req.params.id,
    );
    return response.success(
      res,
      { paymentMethod },
      "Default payment method updated successfully",
    );
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
    return response.created(res, { user }, "User created successfully");
  } catch (err) {
    return next(err);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const user = await userService.updateUser(req.params.id, req.body);
    return response.success(res, { user }, "User updated successfully");
  } catch (err) {
    return next(err);
  }
};

const setUserStatus = async (req, res, next) => {
  try {
    const user = await userService.setStatus(req.params.id, req.body.is_active);
    return response.success(res, { user }, "User status updated successfully");
  } catch (err) {
    return next(err);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    await userService.deleteUser(req.params.id);
    return response.success(res, null, "User deleted successfully");
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  getMe,
  getStats,
  updateMe,
  changePassword,
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
  listUsers,
  createUser,
  updateUser,
  setUserStatus,
  deleteUser,
};
