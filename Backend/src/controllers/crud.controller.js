'use strict';

const service = require('../services/crud.service');
const response = require('../utils/response.util');

const getResourceName = (req) => req.resourceName || req.params.resource;

const list = async (req, res, next) => {
  try {
    const result = await service.list(getResourceName(req), req.query, req.user);
    return response.paginated(res, result.rows, result.pagination, `${result.label} list loaded`);
  } catch (err) { return next(err); }
};

const get = async (req, res, next) => {
  try {
    const row = await service.get(getResourceName(req), req.params.id, req.user);
    return response.success(res, { item: row });
  } catch (err) { return next(err); }
};

const create = async (req, res, next) => {
  try {
    const row = await service.create(getResourceName(req), req.body, req.user, req);
    return response.created(res, { item: row }, 'Created successfully');
  } catch (err) { return next(err); }
};

const update = async (req, res, next) => {
  try {
    const row = await service.update(getResourceName(req), req.params.id, req.body, req.user, req);
    return response.success(res, { item: row }, 'Updated successfully');
  } catch (err) { return next(err); }
};

const remove = async (req, res, next) => {
  try {
    const row = await service.remove(getResourceName(req), req.params.id, req.user, req);
    return response.success(res, { item: row }, 'Deleted successfully');
  } catch (err) { return next(err); }
};

module.exports = { list, get, create, update, remove };
