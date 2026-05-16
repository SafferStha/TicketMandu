const pool = require('../database/db');

const createUser = async ({ username, email, password }) => {
    const query = 'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING *';
    const values = [username, email, password];
    const { rows } = await pool.query(query, values);
    return rows[0];
};

const getUserByEmail = async (email) => {
    const query = 'SELECT * FROM users WHERE email = $1 LIMIT 1';
    const { rows } = await pool.query(query, [email]);
    return rows[0] || null;
};

module.exports = {
    createUser,
    getUserByEmail
};