'use strict';

/**
 * @fileoverview Standardised API response helpers for TicketMandu.
 *
 * All responses follow the shape:
 *   { success: boolean, message: string, data: any, [meta]: any, [code]: string, [errors]: any[] }
 *
 * Import and use these in every controller — never call res.json() directly.
 */

/**
 * Send a successful 2xx response.
 *
 * @param {import('express').Response} res - Express response object.
 * @param {*} [data=null] - Payload to include in the `data` field.
 * @param {string} [message='Success'] - Human-readable success message.
 * @param {number} [statusCode=200] - HTTP status code.
 * @param {*} [meta=null] - Optional pagination or extra metadata.
 * @returns {import('express').Response}
 */
const success = (res, data = null, message = 'Success', statusCode = 200, meta = null) => {
  const payload = { success: true, message, data };
  if (meta !== null && meta !== undefined) payload.meta = meta;
  return res.status(statusCode).json(payload);
};

/**
 * Send a 201 Created response.
 *
 * @param {import('express').Response} res - Express response object.
 * @param {*} data - The newly created resource.
 * @param {string} [message='Created successfully'] - Human-readable message.
 * @returns {import('express').Response}
 */
const created = (res, data, message = 'Created successfully') =>
  success(res, data, message, 201);

/**
 * Send an error response.
 *
 * @param {import('express').Response} res - Express response object.
 * @param {string} [message='Internal server error'] - Human-readable error description.
 * @param {number} [statusCode=500] - HTTP status code.
 * @param {string|null} [code=null] - Machine-readable error code (from constants/errors.js).
 * @param {Array<{field: string, message: string}>|null} [errors=null] - Validation error details.
 * @returns {import('express').Response}
 */
const error = (
  res,
  message = 'Internal server error',
  statusCode = 500,
  code = null,
  errors = null
) => {
  const payload = { success: false, message };
  if (code) payload.code = code;
  if (errors) payload.errors = errors;
  return res.status(statusCode).json(payload);
};

/**
 * Send a paginated list response.
 * The `pagination` object should be built with `paginate.util.js#buildMeta`.
 *
 * @param {import('express').Response} res - Express response object.
 * @param {Array<*>} data - The current page of results.
 * @param {object} pagination - Pagination metadata (page, limit, total, etc.).
 * @param {string} [message='Success'] - Human-readable message.
 * @returns {import('express').Response}
 */
const paginated = (res, data, pagination, message = 'Success') =>
  res.status(200).json({ success: true, message, data, pagination });

/**
 * Send a 204 No Content response (no body).
 *
 * @param {import('express').Response} res - Express response object.
 * @returns {import('express').Response}
 */
const noContent = (res) => res.status(204).send();

module.exports = { success, created, error, paginated, noContent };
