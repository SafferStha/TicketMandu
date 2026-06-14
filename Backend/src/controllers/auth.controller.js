'use strict';

const authService = require('../services/auth.service');
const response = require('../utils/response.util');

const register = async (req, res, next) => {
  try {
    const { user, accessToken, refreshToken } = await authService.register(
      req.body,
      req.ip
    );
    return response.created(res, { user, accessToken, refreshToken }, 'Account created successfully');
  } catch (err) {
    return next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { user, accessToken, refreshToken } = await authService.login(
      req.body,
      req.ip
    );
    return response.success(res, { user, accessToken, refreshToken }, 'Login successful');
  } catch (err) {
    return next(err);
  }
};

const refresh = async (req, res, next) => {
  try {
    const { refreshToken: rawToken } = req.body;
    const tokens = await authService.refresh(rawToken, req.ip);
    return response.success(res, tokens, 'Tokens refreshed');
  } catch (err) {
    return next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    await authService.logout(refreshToken);
    return response.success(res, null, 'Logged out successfully');
  } catch (err) {
    return next(err);
  }
};

module.exports = { register, login, refresh, logout };
