'use strict';

const db = require('../config/db');

const safeOrder = (sort, allowed, fallback = 'created_at') => (allowed.includes(sort) ? sort : fallback);
const safeDir = (order) => (String(order).toLowerCase() === 'asc' ? 'ASC' : 'DESC');

const buildWhere = (config, query = {}, actor = null) => {
  const conditions = [];
  const params = [];
  let idx = 1;

  if (config.softDelete) conditions.push('r.deleted_at IS NULL');

  if (actor?.role === 'organizer' && config.organizerCondition) {
    conditions.push(config.organizerCondition(idx));
    params.push(actor.id);
    idx += 1;
  }

  if (query.q && config.searchable?.length) {
    const search = config.searchable.map((col) => `LOWER(CAST(r.${col} AS TEXT)) LIKE $${idx}`).join(' OR ');
    conditions.push(`(${search})`);
    params.push(`%${String(query.q).toLowerCase()}%`);
    idx += 1;
  }

  for (const col of config.columns || []) {
    if (query[col] !== undefined && query[col] !== null && query[col] !== '') {
      conditions.push(`r.${col} = $${idx}`);
      params.push(query[col]);
      idx += 1;
    }
  }

  if (query.status && config.columns?.includes('status')) {
    conditions.push(`r.status = $${idx}`);
    params.push(query.status);
    idx += 1;
  }

  if (query.is_active !== undefined && config.columns?.includes('is_active')) {
    conditions.push(`r.is_active = $${idx}`);
    params.push(query.is_active === true || query.is_active === 'true');
    idx += 1;
  }

  return { where: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '', params };
};

const list = async (config, query = {}, actor = null, { limit = 20, offset = 0 } = {}) => {
  const { where, params } = buildWhere(config, query, actor);
  const allowedSort = ['id', 'created_at', 'updated_at', ...(config.columns || [])];
  const sort = safeOrder(query.sort || config.defaultSort || 'created_at', allowedSort, config.defaultSort || 'created_at');
  const dir = safeDir(query.order);
  const { rows } = await db.query(
    `SELECT r.* FROM ${config.table} r ${where} ORDER BY r.${sort} ${dir} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  );
  const { rows: countRows } = await db.query(`SELECT COUNT(*)::int AS count FROM ${config.table} r ${where}`, params);
  return { rows, total: Number(countRows[0]?.count || 0) };
};

const findById = async (config, id, actor = null) => {
  const { where, params } = buildWhere(config, {}, actor);
  const wherePrefix = where ? `${where} AND` : 'WHERE';
  const { rows } = await db.query(`SELECT r.* FROM ${config.table} r ${wherePrefix} r.id = $${params.length + 1} LIMIT 1`, [...params, id]);
  return rows[0] || null;
};

const create = async (config, payload) => {
  const entries = Object.entries(payload).filter(([key, value]) => config.columns.includes(key) && value !== undefined);
  if (entries.length === 0) throw new Error('No valid fields supplied');
  const cols = entries.map(([key]) => key);
  const values = entries.map(([, value]) => value);
  const placeholders = values.map((_, i) => `$${i + 1}`);
  const { rows } = await db.query(
    `INSERT INTO ${config.table} (${cols.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`,
    values
  );
  return rows[0];
};

const update = async (config, id, payload, actor = null) => {
  const existing = await findById(config, id, actor);
  if (!existing) return null;
  const entries = Object.entries(payload).filter(([key, value]) => config.columns.includes(key) && value !== undefined);
  if (entries.length === 0) return existing;
  const setClauses = entries.map(([key], i) => `${key} = $${i + 2}`);
  const values = entries.map(([, value]) => value);
  const updatedAt = config.columns.includes('updated_at') || 'updated_at' in existing ? ', updated_at = NOW()' : '';
  const { rows } = await db.query(
    `UPDATE ${config.table} r SET ${setClauses.join(', ')}${updatedAt} WHERE r.id = $1 RETURNING *`,
    [id, ...values]
  );
  return rows[0] || null;
};

const remove = async (config, id, actor = null) => {
  const existing = await findById(config, id, actor);
  if (!existing) return null;
  if (config.softDelete) {
    const { rows } = await db.query(`UPDATE ${config.table} SET deleted_at = NOW(), updated_at = COALESCE(updated_at, NOW()) WHERE id = $1 RETURNING *`, [id]);
    return rows[0] || existing;
  }
  await db.query(`DELETE FROM ${config.table} WHERE id = $1`, [id]);
  return existing;
};

module.exports = { list, findById, create, update, remove };
