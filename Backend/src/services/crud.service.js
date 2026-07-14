'use strict';

const { getResource } = require('../config/crudResources');
const repo = require('../repositories/crud.repository');
const audit = require('../repositories/audit.repository');
const { paginate } = require('../utils/paginate.util');
const { slugify } = require('../utils/slug.util');

const createAppError = (message, statusCode = 400, code = 'BAD_REQUEST') => {
  const err = new Error(message);
  err.statusCode = statusCode;
  err.code = code;
  return err;
};

const requireConfig = (resource) => {
  const config = getResource(resource);
  if (!config) throw createAppError('Unknown resource', 404, 'RESOURCE_NOT_FOUND');
  return config;
};

const assertRole = (config, actor) => {
  if (!actor || !config.roles.includes(actor.role)) throw createAppError('Forbidden', 403, 'FORBIDDEN');
};

const preparePayload = (config, payload = {}, actor = null, creating = true) => {
  const data = { ...payload };

  if (config.columns.includes('slug') && creating && !data.slug) {
    data.slug = slugify(data.name || data.organization_name || data.code || config.label);
  }

  if (config.table === 'coupons') {
    data.code = data.code ? String(data.code).trim().toUpperCase() : data.code;
    if (creating && data.created_by === undefined) data.created_by = actor?.id || null;
  }

  if (config.table === 'organizers' && actor?.role === 'organizer') {
    data.user_id = actor.id;
  }

  if (config.table === 'event_categories' && data.is_active === undefined && creating) {
    data.is_active = true;
  }

  return data;
};

const list = async (resource, query, actor) => {
  const config = requireConfig(resource);
  assertRole(config, actor);
  const { limit, offset, buildMeta } = paginate(query.page, query.limit);
  const result = await repo.list(config, query, actor, { limit, offset });
  return { rows: result.rows, pagination: buildMeta(result.total), label: config.label };
};

const get = async (resource, id, actor) => {
  const config = requireConfig(resource);
  assertRole(config, actor);
  const row = await repo.findById(config, id, actor);
  if (!row) throw createAppError(`${config.label} not found`, 404, 'NOT_FOUND');
  return row;
};

const create = async (resource, payload, actor, req = null) => {
  const config = requireConfig(resource);
  assertRole(config, actor);
  if (config.readOnly) throw createAppError(`${config.label} is read only`, 405, 'READ_ONLY');
  const row = await repo.create(config, preparePayload(config, payload, actor, true));
  await audit.log({ actorId: actor?.id, actorIp: req?.ip, action: `${resource}.create`, resourceType: resource, resourceId: row.id, newValues: row });
  return row;
};

const update = async (resource, id, payload, actor, req = null) => {
  const config = requireConfig(resource);
  assertRole(config, actor);
  if (config.readOnly) throw createAppError(`${config.label} is read only`, 405, 'READ_ONLY');
  const oldRow = await repo.findById(config, id, actor);
  if (!oldRow) throw createAppError(`${config.label} not found`, 404, 'NOT_FOUND');
  const row = await repo.update(config, id, preparePayload(config, payload, actor, false), actor);
  await audit.log({ actorId: actor?.id, actorIp: req?.ip, action: `${resource}.update`, resourceType: resource, resourceId: row.id, oldValues: oldRow, newValues: row });
  return row;
};

const remove = async (resource, id, actor, req = null) => {
  const config = requireConfig(resource);
  assertRole(config, actor);
  if (config.readOnly) throw createAppError(`${config.label} is read only`, 405, 'READ_ONLY');
  const row = await repo.remove(config, id, actor);
  if (!row) throw createAppError(`${config.label} not found`, 404, 'NOT_FOUND');
  await audit.log({ actorId: actor?.id, actorIp: req?.ip, action: `${resource}.delete`, resourceType: resource, resourceId: Number(id), oldValues: row });
  return row;
};

module.exports = { list, get, create, update, remove };
