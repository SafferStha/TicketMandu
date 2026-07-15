"use strict";

const rateLimit = require("express-rate-limit");

const isDevelopment = process.env.NODE_ENV !== "production";
const WINDOW_MS = 15 * 60 * 1000;
const noopLimiter = (_req, _res, next) => next();

const buildMessage = (detail) => ({
  success: false,
  message: detail,
  code: "RATE_LIMIT_EXCEEDED",
});

const makeLimiter = ({ max, message, skipSuccessfulRequests = false }) => {
  if (isDevelopment) return noopLimiter;
  return rateLimit({
    windowMs: WINDOW_MS,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests,
    message: buildMessage(message),
    handler: (_req, res) => res.status(429).json(buildMessage(message)),
  });
};

// High enough for normal production browsing; not applied globally in development.
const generalLimiter = makeLimiter({
  max: 2000,
  message: "Too many requests. Please slow down and try again shortly.",
});

// Auth stays protected in production but successful logins/registers do not count.
const authLimiter = makeLimiter({
  max: 25,
  message: "Too many authentication attempts. Please try again later.",
  skipSuccessfulRequests: true,
});

const strictLimiter = makeLimiter({
  max: 10,
  message: "Too many sensitive requests. Please try again later.",
});

module.exports = { generalLimiter, authLimiter, strictLimiter };
