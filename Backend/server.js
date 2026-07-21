"use strict";

// ── Environment & Logging must load first ─────────────────────────────────────
const fs = require("fs");
const path = require("path");

// Ensure logs directory exists before Winston tries to write to it
const logsDir = path.join(__dirname, "logs");
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

// Load env config (throws if required vars are missing)
let env;
try {
  env = require("./src/config/env");
} catch (envErr) {
  console.error("[startup] Environment configuration error:", envErr.message);
  process.exit(1);
}

const logger = require("./src/utils/logger.util");
const { morganMiddleware } = require("./src/utils/logger.util");

// ── Express & Security Middleware ─────────────────────────────────────────────
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const { generalLimiter } = require("./src/middleware/rateLimit.middleware");
const errorHandler = require("./src/middleware/errorHandler.middleware");
const apiRoutes = require("./src/routes/index");

const app = express();

// Security headers
app.use(
  helmet({
    crossOriginEmbedderPolicy: false, // allow image embeds from CDN
  }),
);

// CORS — restrict to known frontend origin
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// HTTP request logging (Morgan → Winston)
app.use(morganMiddleware);

// Body parsers
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

// Serve uploaded files
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use("/uploads", express.static(uploadsDir));

// No global API limiter: normal CRUD/profile/booking/dashboard usage should not
// lock users out. Auth/security-sensitive routes attach dedicated limiters.

// ── Routes ────────────────────────────────────────────────────────────────────
// New clean-architecture routes under /api
app.use("/api", apiRoutes);

// Root health check
app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "TicketMandu API v2.0",
    docs: "/api/health",
    timestamp: new Date().toISOString(),
  });
});

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res
    .status(404)
    .json({ success: false, message: "Route not found", code: "NOT_FOUND" });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use(errorHandler);

// ── Database bootstrap ────────────────────────────────────────────────────────
const db = require("./src/config/db");
const bootstrapDatabase = require("./src/config/bootstrap");

// ── Graceful shutdown ─────────────────────────────────────────────────────────
const shutdown = async (signal) => {
  logger.info(`[server] Received ${signal}, shutting down gracefully`);
  try {
    await db.end();
  } catch {
    /* ignore pool shutdown errors */
  }
  process.exit(0);
};
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

process.on("unhandledRejection", (reason) => {
  logger.error("[server] Unhandled promise rejection", {
    reason: String(reason),
  });
});

process.on("uncaughtException", (err) => {
  logger.error("[server] Uncaught exception", {
    message: err.message,
    stack: err.stack,
  });
  process.exit(1);
});

// ── Start ─────────────────────────────────────────────────────────────────────
const startServer = async () => {
  try {
    await db.checkConnection();
    await bootstrapDatabase();

    const PORT = env.PORT || 8000;
    app.listen(PORT, () => {
      logger.info(
        `[server] TicketMandu API running on http://localhost:${PORT}`,
      );
      logger.info(`[server] Environment: ${env.NODE_ENV}`);
    });
  } catch (err) {
    logger.error("[server] Failed to start", { message: err.message });
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = app;