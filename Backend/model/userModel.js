const pool = require("../database/db");

const createUser = async (name, email, password, image) => {
  const { rows } = await pool.query(
    "INSERT INTO users (name, email, password, image) VALUES ($1, $2, $3, $4) RETURNING *",
    [name, email, password, image],
  );
  return rows[0];
};

const existingUser = async (email) => {
  const { rows } = await pool.query("SELECT * FROM users WHERE email = $1", [
    email,
  ]);
  return rows[0];
};

const getAllUser = async () => {
  const { rows } = await pool.query("SELECT * FROM users");
  return rows;
};

const getUserById = async (id) => {
  const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
  return rows[0];
};

const deleteUserById = async (id) => {
  await pool.query("DELETE FROM users WHERE id = $1", [id]);
};

const updateById = async (id, name, email, password, image) => {
  const { rows } = await pool.query(
    "UPDATE users SET name = $1, email = $2, password = $3, image = $4 WHERE id = $5 RETURNING *",
    [name, email, password, image, id],
  );
  return rows[0];
};

module.exports = {
  createUser,
  updateById,
  existingUser,
  deleteUserById,
  getAllUser,
  getUserById,
};
