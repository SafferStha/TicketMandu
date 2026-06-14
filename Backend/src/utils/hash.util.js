'use strict';

/**
 * @fileoverview Password hashing and token generation utilities.
 *
 * Wraps bcrypt for secure password storage and the `uuid` package for
 * generating cryptographically random tokens (e.g. password-reset links).
 */

const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

/** bcrypt work factor. 10 rounds provides a good security/performance balance. */
const SALT_ROUNDS = 10;

// ─── Password hashing ─────────────────────────────────────────────────────────

/**
 * Hash a plain-text password with bcrypt.
 *
 * @param {string} password - The plain-text password to hash.
 * @returns {Promise<string>} The bcrypt hash string (includes salt).
 * @throws {Error} If the password argument is not a non-empty string.
 *
 * @example
 * const hashed = await hashPassword('mySecret123');
 */
const hashPassword = async (password) => {
  if (!password || typeof password !== 'string') {
    throw new Error('[hash] hashPassword: password must be a non-empty string');
  }
  return bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * Compare a plain-text password against a stored bcrypt hash.
 *
 * @param {string} plain - The candidate plain-text password.
 * @param {string} hashed - The stored bcrypt hash.
 * @returns {Promise<boolean>} `true` if the password matches the hash.
 * @throws {Error} If either argument is missing or not a string.
 *
 * @example
 * const isValid = await comparePassword('mySecret123', storedHash);
 */
const comparePassword = async (plain, hashed) => {
  if (!plain || typeof plain !== 'string') {
    throw new Error('[hash] comparePassword: plain password must be a non-empty string');
  }
  if (!hashed || typeof hashed !== 'string') {
    throw new Error('[hash] comparePassword: hashed password must be a non-empty string');
  }
  return bcrypt.compare(plain, hashed);
};

// ─── Token generation ─────────────────────────────────────────────────────────

/**
 * Generate a cryptographically random UUID v4 token.
 * Suitable for password-reset links, email verification tokens, etc.
 *
 * @returns {string} A UUID v4 string (e.g. "110e8400-e29b-41d4-a716-446655440000").
 *
 * @example
 * const token = generateToken();
 * // Store token in DB, send to user via email
 */
const generateToken = () => uuidv4();

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
};
