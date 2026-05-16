const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const pool = require('./database/db');
const userRoutes = require('./route/userRoute');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/users', userRoutes);

const PORT = process.env.PORT || 5000;

app.get('/api/data', async (req, res) => {
  console.log("Server is running");
  res.send("Hello from the server!");
});

app.get("/db-config", async (req, res) => {
  const result = await pool.query("SELECT * FROM students");
  res.json(result.rows);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

