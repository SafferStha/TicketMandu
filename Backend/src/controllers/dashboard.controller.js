'use strict';

const repo = require('../repositories/dashboard.repository');
const response = require('../utils/response.util');

const admin = async (_req, res, next) => {
  try { return response.success(res, await repo.adminDashboard(), 'Admin dashboard loaded'); }
  catch (err) { return next(err); }
};

const organizer = async (req, res, next) => {
  try { return response.success(res, await repo.organizerDashboard(req.user.id), 'Organizer dashboard loaded'); }
  catch (err) { return next(err); }
};

const user = async (req, res, next) => {
  try { return response.success(res, await repo.userDashboard(req.user.id), 'User dashboard loaded'); }
  catch (err) { return next(err); }
};

module.exports = { admin, organizer, user };
