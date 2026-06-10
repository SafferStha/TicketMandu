const { Pool } = require('pg');
// Ensure environment variables from .env are loaded when this module is required directly
require('dotenv').config();

// Support either a DATABASE_URL or individual env vars.
// If your DB requires SSL (e.g., managed providers), set DB_SSL=true in .env
const useDatabaseUrl = !!process.env.DATABASE_URL;

// Guard against common misconfiguration: someone accidentally set an HTTP(S) URL
if (process.env.DATABASE_URL && /^https?:\/\//i.test(process.env.DATABASE_URL)) {
  throw new Error(
    'Invalid DATABASE_URL: looks like an HTTP(S) URL. Use a Postgres URI (postgres://user:pass@host:port/db) or set DB_HOST/DB_USER/DB_PASSWORD/DB_NAME/DB_PORT in .env'
  );
}

// Catch common mistakes like DB_HOST being set to 'http', 'https', 'http://', or similar
if (
  !useDatabaseUrl &&
  process.env.DB_HOST &&
  /^https?(?::\/\/|:)?/i.test(process.env.DB_HOST)
) {
  throw new Error(
    'Invalid DB_HOST value: looks like an HTTP(S) scheme or URL. Set DB_HOST to the database hostname (e.g., localhost) or provide a proper DATABASE_URL (postgres://...).'
  );
}

const commonOptions = useDatabaseUrl
  ? { connectionString: process.env.DATABASE_URL }
  : {
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT,
    };

// Configure SSL only when explicitly enabled to avoid WRONG_VERSION_NUMBER
// errors when connecting to non-TLS endpoints.
const sslEnabled = String(process.env.DB_SSL || '').toLowerCase() === 'true';
const localHostPattern = /^(localhost|127\.0\.0\.1|::1)$/i;
const targetHost = useDatabaseUrl ? '' : String(process.env.DB_HOST || '');

if (sslEnabled) {
  if (targetHost && localHostPattern.test(targetHost)) {
    console.warn('DB_SSL=true was set for a local DB host; forcing non-SSL to prevent WRONG_VERSION_NUMBER.');
    commonOptions.ssl = false;
  } else {
    commonOptions.ssl = { rejectUnauthorized: false };
  }
} else {
  // Explicitly disable SSL for local/development connections, even if PGSSLMODE
  // is set globally in the shell environment.
  commonOptions.ssl = false;
}

if (process.env.DB_SSL && !['true', 'false'].includes(String(process.env.DB_SSL).toLowerCase())) {
  console.warn('Invalid DB_SSL value. Use DB_SSL=true or DB_SSL=false. Defaulting to DB_SSL=false.');
  commonOptions.ssl = false;
}

const pool = new Pool(commonOptions);

module.exports = pool;