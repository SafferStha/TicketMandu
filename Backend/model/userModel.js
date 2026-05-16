const pool = require('../database/db');

const createUser = async (username, email, password) => {
  const query = 'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING *';
    const values = [username, email, password];
    const { rows } = await pool.query(query, values);
    return rows[0];
};

module.exports = {
    createUser
};