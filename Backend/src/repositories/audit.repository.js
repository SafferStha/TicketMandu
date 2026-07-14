'use strict';

const db = require('../config/db');

const log = async ({ actorId = null, actorIp = null, action, resourceType = null, resourceId = null, oldValues = null, newValues = null }, client = db) => {
  try {
    await client.query(
      `INSERT INTO audit_logs (actor_id, actor_ip, action, resource_type, resource_id, old_values, new_values)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [actorId, actorIp, action, resourceType, resourceId, oldValues, newValues]
    );
  } catch {
    // Audit logging should never break the business flow.
  }
};

module.exports = { log };
