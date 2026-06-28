'use strict';

const { ZodError } = require('zod');
const ERRORS = require('../constants/errors');

/**
 * Zod validation middleware factory.
 * @param {import('zod').ZodSchema} schema - Zod schema to validate req.body against.
 * @returns {import('express').RequestHandler}
 */
const validate = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    return next();
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(422).json({
        success: false,
        message: ERRORS.VALIDATION_ERROR.message,
        code: ERRORS.VALIDATION_ERROR.code,
        errors: (err.issues || err.errors || []).map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }
    return next(err);
  }
};

/**
 * Validate query parameters instead of body.
 */
const validateQuery = (schema) => (req, res, next) => {
  try {
    req.validatedQuery = schema.parse(req.query);
    return next();
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(422).json({
        success: false,
        message: ERRORS.VALIDATION_ERROR.message,
        code: ERRORS.VALIDATION_ERROR.code,
        errors: (err.issues || err.errors || []).map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }
    return next(err);
  }
};

module.exports = { validate, validateQuery };
