"use strict";

/**
 * @fileoverview Database bootstrap orchestrator.
 * Applies schema (tables, migrations, indexes) then seed data.
 * Called once during server startup.
 */

const applySchema = require("./schema");
const applySeedData = require("./seeds");
const logger = require("../utils/logger.util");

/**
 * Bootstrap the database: create/migrate schema, then seed data.
 * All operations are idempotent and safe to run on every startup.
 */
const bootstrapDatabase = async () => {
  await applySchema();
  await applySeedData();
  logger.info("[db] Database bootstrap complete");
};

module.exports = bootstrapDatabase;
