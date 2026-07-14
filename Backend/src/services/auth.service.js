'use strict';

const crypto = require('crypto');
const userRepo = require('../repositories/user.repository');
const { hashPassword, comparePassword } = require('../utils/hash.util');
const { signAccessToken } = require('../utils/jwt.util');
const ERRORS = require('../constants/errors');

const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const createAppError = (message, statusCode, code) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  err.code = code;
  return err;
};

const hashToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

const issueTokenPair = async (user, ipAddress) => {
  const payload = { id: user.id, email: user.email, role: user.role || 'user' };
  const accessToken = signAccessToken(payload);

  const rawRefresh = crypto.randomBytes(40).toString('hex');
  const tokenHash = hashToken(rawRefresh);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

  try {
    await userRepo.storeRefreshToken(user.id, tokenHash, expiresAt, ipAddress);
  } catch {
    // refresh_tokens table may not exist yet — tokens still work but can't be revoked
  }

  return { accessToken, refreshToken: rawRefresh };
};

const register = async ({ name, email, password }, ipAddress) => {
  const existing = await userRepo.findByEmail(email);
  if (existing) {
    throw createAppError(ERRORS.DUPLICATE_EMAIL.message, 409, ERRORS.DUPLICATE_EMAIL.code);
  }

  const passwordHash = await hashPassword(password);
  const user = await userRepo.create({ name, email, passwordHash });

  const tokens = await issueTokenPair(user, ipAddress);

  return { user, ...tokens };
};

const login = async ({ email, password }, ipAddress) => {
  const user = await userRepo.findByEmail(email);
  if (!user) {
    throw createAppError(ERRORS.INVALID_CREDENTIALS.message, 401, ERRORS.INVALID_CREDENTIALS.code);
  }

  if (user.deleted_at || user.is_active === false) {
    throw createAppError('Account is inactive', 403, 'ACCOUNT_INACTIVE');
  }

  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) {
    throw createAppError(ERRORS.INVALID_CREDENTIALS.message, 401, ERRORS.INVALID_CREDENTIALS.code);
  }

  try {
    await userRepo.updateLastLogin(user.id);
  } catch { /* column may not exist */ }

  const { password: _pw, ...safeUser } = user;
  const tokens = await issueTokenPair(safeUser, ipAddress);

  return { user: safeUser, ...tokens };
};

const refresh = async (rawRefreshToken, ipAddress) => {
  if (!rawRefreshToken) {
    throw createAppError(ERRORS.TOKEN_INVALID.message, 401, ERRORS.TOKEN_INVALID.code);
  }

  const tokenHash = hashToken(rawRefreshToken);

  let stored;
  try {
    stored = await userRepo.findRefreshToken(tokenHash);
  } catch {
    throw createAppError(ERRORS.TOKEN_INVALID.message, 401, ERRORS.TOKEN_INVALID.code);
  }

  if (!stored) {
    let revoked;
    try {
      revoked = await userRepo.findRefreshTokenByHash(tokenHash);
    } catch {
      revoked = null;
    }

    if (revoked?.is_revoked) {
      try {
        await userRepo.revokeAllUserTokens(revoked.user_id);
      } catch { /* ignore */ }
      throw createAppError('Refresh token reuse detected', 401, 'TOKEN_REUSE');
    }

    throw createAppError(ERRORS.TOKEN_INVALID.message, 401, ERRORS.TOKEN_INVALID.code);
  }

  await userRepo.revokeRefreshToken(tokenHash);

  const user = await userRepo.findById(stored.user_id);
  if (!user) {
    throw createAppError(ERRORS.NOT_FOUND.message, 404, ERRORS.NOT_FOUND.code);
  }

  return issueTokenPair(user, ipAddress);
};

const logout = async (rawRefreshToken) => {
  if (!rawRefreshToken) return;
  const tokenHash = hashToken(rawRefreshToken);
  try {
    await userRepo.revokeRefreshToken(tokenHash);
  } catch { /* ignore */ }
};

module.exports = { register, login, refresh, logout };
