const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const pool = require("./database/db");
const userRoute = require("./route/userRoute");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const PORT = process.env.PORT || 8000;

const bootstrapDatabase = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      image VARCHAR(255)
    )
  `);
};

app.get("/", (req, res) => {
  console.log("Server is running");
  res.send("The backend is running");
});

app.get("/db-config", async (req, res) => {
  const result = await pool.query("Select * from students");
  res.json(result.rows);
});
app.use("/api", userRoute);

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      message: "Invalid JSON payload",
      hint: "Use double quotes for keys/strings and valid JSON syntax.",
      example: {
        name: "Test User",
        email: "test@example.com",
        password: "pass123",
      },
    });
  }

  return next(err);
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
});

const startServer = async () => {
  try {
    await bootstrapDatabase();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to initialize database:", error.message);
    process.exit(1);
  }
};

startServer();