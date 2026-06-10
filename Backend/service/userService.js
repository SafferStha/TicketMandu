const pool = require('../database/db');
const bcrypt = require('bcrypt');

// If no DB environment is configured, use a simple in-memory store for dev/testing
const useInMemory = !(process.env.DATABASE_URL || process.env.DB_HOST);
let runtimeUseInMemory = useInMemory;
const _inMemoryUsers = [];

if (useInMemory) {
  console.warn('Running without DB: using in-memory user store (dev only)');
}

const shouldFallbackToMemory = (error) => {
    if (!error) return false;
    const transientCodes = new Set(['42P01', '3D000', 'ECONNREFUSED', 'ENOTFOUND']);
    return transientCodes.has(error.code);
};

const ensureHashedPassword = async (password) => {
    if (!password) return password;
    const looksHashed = /^\$2[abxy]\$\d{2}\$/.test(password);
    if (looksHashed) return password;
    return bcrypt.hash(password, 10);
};

const createUser = async ({ username, email, password }) => {
    const safePassword = await ensureHashedPassword(password);

    if (runtimeUseInMemory) {
        const id = _inMemoryUsers.length + 1;
        const user = { id, username, email, password: safePassword };
        _inMemoryUsers.push(user);
        return user;
    }

    try {
        const query = 'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING *';
        const values = [username, email, safePassword];
        const { rows } = await pool.query(query, values);
        return rows[0];
    } catch (error) {
        if (shouldFallbackToMemory(error)) {
            runtimeUseInMemory = true;
            console.warn('DB unavailable for createUser; switched to in-memory store (dev only):', error.message);
            const id = _inMemoryUsers.length + 1;
            const user = { id, username, email, password: safePassword };
            _inMemoryUsers.push(user);
            return user;
    }
        throw error;
    }
};

const getUserByEmail = async (email) => {
    if (runtimeUseInMemory) {
        return _inMemoryUsers.find((u) => u.email === email) || null;
    }

    try {
        const query = 'SELECT * FROM users WHERE email = $1 LIMIT 1';
        const { rows } = await pool.query(query, [email]);
        return rows[0] || null;
    } catch (error) {
        if (shouldFallbackToMemory(error)) {
            runtimeUseInMemory = true;
            console.warn('DB unavailable for getUserByEmail; switched to in-memory store (dev only):', error.message);
            return _inMemoryUsers.find((u) => u.email === email) || null;
    }
        throw error;
    }
};

// Compare plain password with hashed password
const isMatched = async (plainPassword, hashedPassword) => {
  if (!plainPassword || !hashedPassword) return false;
  return bcrypt.compare(plainPassword, hashedPassword);
};

// Return user when email exists and password matches, otherwise null
const existingUser = async (email, password) => {
  const user = await getUserByEmail(email);
  if (!user) return null;
  const match = await isMatched(password, user.password);
  return match ? user : null;
};

module.exports = {
  createUser,
  getUserByEmail,
  isMatched,
  existingUser,
};