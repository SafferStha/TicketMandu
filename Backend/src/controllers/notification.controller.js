'use strict';

const notificationRepo = require('../repositories/notification.repository');
const response = require('../utils/response.util');
const { paginate } = require('../utils/paginate.util');


const listAll = async (req, res, next) => {
  try {
    const { limit, offset, buildMeta } = paginate(req.query.page, req.query.limit);
    const result = await notificationRepo.listAll({ limit, offset, q: req.query.q });
    return response.paginated(res, result.notifications, buildMeta(result.total));
  } catch (err) { return next(err); }
};

const listMy = async (req, res, next) => {
  try {
    const { limit, offset, buildMeta } = paginate(req.query.page, req.query.limit);
    const result = await notificationRepo.listMy(req.user.id, { limit, offset });
    return response.paginated(res, result.notifications, buildMeta(result.total));
  } catch (err) { return next(err); }
};

const markRead = async (req, res, next) => {
  try {
    const notification = await notificationRepo.markRead(req.user.id, req.params.id);
    return response.success(res, { notification }, 'Notification marked as read');
  } catch (err) { return next(err); }
};

const markAllRead = async (req, res, next) => {
  try {
    await notificationRepo.markAllRead(req.user.id);
    return response.success(res, null, 'Notifications marked as read');
  } catch (err) { return next(err); }
};

const remove = async (req, res, next) => {
  try {
    await notificationRepo.deleteById(req.user.id, req.params.id);
    return response.success(res, null, 'Notification deleted successfully');
  } catch (err) { return next(err); }
};

module.exports = { listAll, listMy, markRead, markAllRead, remove };