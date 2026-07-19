const request = require("supertest");
const jwt = require("jsonwebtoken");

process.env.DOTENV_CONFIG_QUIET = "true";
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "jest-test-secret";
process.env.JWT_REFRESH_SECRET = "jest-refresh-secret";
process.env.JWT_EXPIRES_IN = "1h";
process.env.DB_USER = "test";
process.env.DB_PASSWORD = "test";
process.env.DB_NAME = "test";
process.env.DB_HOST = "localhost";
process.env.DB_PORT = "5432";

jest.mock("../src/config/db", () => ({
  query: jest.fn(),
  connect: jest.fn(),
  end: jest.fn(),
  checkConnection: jest.fn(),
}));

jest.mock("../src/repositories/user.repository", () => ({
  findByEmail: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  updateLastLogin: jest.fn(),
  storeRefreshToken: jest.fn(),
}));

jest.mock("../src/utils/hash.util", () => ({
  hashPassword: jest.fn(),
  comparePassword: jest.fn(),
}));

const userRepo = require("../src/repositories/user.repository");
const { hashPassword, comparePassword } = require("../src/utils/hash.util");

const app = require("../server");

const baseUser = {
  id: 1,
  name: "Test User",
  email: "test@example.com",
  password: "hashed-password",
  username: null,
  image: null,
  phone: null,
  role: "user",
  is_active: true,
  deleted_at: null,
  created_at: new Date("2026-01-01T00:00:00.000Z"),
  updated_at: new Date("2026-01-01T00:00:00.000Z"),
};

const safeUser = {
  id: baseUser.id,
  name: baseUser.name,
  email: baseUser.email,
  username: baseUser.username,
  image: baseUser.image,
  phone: baseUser.phone,
  role: baseUser.role,
  is_active: baseUser.is_active,
  deleted_at: baseUser.deleted_at,
  created_at: baseUser.created_at,
  updated_at: baseUser.updated_at,
};

describe("TicketMandu Authentication API", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    hashPassword.mockResolvedValue("hashed-password");
    comparePassword.mockResolvedValue(true);

    userRepo.updateLastLogin.mockResolvedValue();
    userRepo.storeRefreshToken.mockResolvedValue();
  });

  test("health endpoint returns success", async () => {
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);

    expect(response.body).toMatchObject({
      success: true,
      message: "TicketMandu API is running",
    });
  });

  test("user registration succeeds with valid data", async () => {
    userRepo.findByEmail.mockResolvedValue(null);
    userRepo.create.mockResolvedValue(safeUser);

    const response = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Test User",
        email: "test@example.com",
        password: "Password123",
      });

    expect(response.status).toBe(201);

    expect(response.body.success).toBe(true);

    expect(response.body.data.user).toMatchObject({
      id: safeUser.id,
      name: safeUser.name,
      email: safeUser.email,
    });

    expect(response.body.data.accessToken).toEqual(
      expect.any(String),
    );

    expect(response.body.data.refreshToken).toEqual(
      expect.any(String),
    );

    expect(hashPassword).toHaveBeenCalledWith("Password123");

    expect(userRepo.create).toHaveBeenCalledWith({
      name: "Test User",
      email: "test@example.com",
      passwordHash: "hashed-password",
    });
  });

  test("duplicate email registration is rejected", async () => {
    userRepo.findByEmail.mockResolvedValue(baseUser);

    const response = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Another User",
        email: "test@example.com",
        password: "Password123",
      });

    expect(response.status).toBe(409);

    expect(response.body.message).toMatch(
      /email already registered/i,
    );

    expect(userRepo.create).not.toHaveBeenCalled();
  });

  test("registration fails when name is missing", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({
        email: "test@example.com",
        password: "Password123",
      });

    expect(response.status).toBe(422);

    expect(response.body.success).toBe(false);

    expect(response.body.message).toMatch(
      /validation failed/i,
    );

    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "name",
        }),
      ]),
    );

    expect(userRepo.findByEmail).not.toHaveBeenCalled();
    expect(hashPassword).not.toHaveBeenCalled();
  });

  test("registration fails when email is missing", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Test User",
        password: "Password123",
      });

    expect(response.status).toBe(422);

    expect(response.body.message).toMatch(
      /validation failed/i,
    );

    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "email",
        }),
      ]),
    );

    expect(userRepo.findByEmail).not.toHaveBeenCalled();
    expect(hashPassword).not.toHaveBeenCalled();
  });

  test("registration fails when password is missing", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Test User",
        email: "test@example.com",
      });

    expect(response.status).toBe(422);

    expect(response.body.message).toMatch(
      /validation failed/i,
    );

    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "password",
        }),
      ]),
    );

    expect(userRepo.findByEmail).not.toHaveBeenCalled();
    expect(hashPassword).not.toHaveBeenCalled();
  });

  test("registration fails with a weak password", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Test User",
        email: "test@example.com",
        password: "password",
      });

    expect(response.status).toBe(422);

    expect(response.body.message).toMatch(
      /validation failed/i,
    );

    expect(hashPassword).not.toHaveBeenCalled();
    expect(userRepo.create).not.toHaveBeenCalled();
  });

  test("login succeeds with valid credentials", async () => {
    userRepo.findByEmail.mockResolvedValue(baseUser);
    comparePassword.mockResolvedValue(true);

    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: "test@example.com",
        password: "Password123",
      });

    expect(response.status).toBe(200);

    expect(response.body.success).toBe(true);

    expect(response.body.data.accessToken).toEqual(
      expect.any(String),
    );

    expect(response.body.data.user).toMatchObject({
      id: baseUser.id,
      name: baseUser.name,
      email: baseUser.email,
      role: baseUser.role,
    });

    expect(comparePassword).toHaveBeenCalledWith(
      "Password123",
      baseUser.password,
    );

    expect(userRepo.updateLastLogin).toHaveBeenCalledWith(
      baseUser.id,
    );
  });

  test("login fails with invalid credentials", async () => {
    userRepo.findByEmail.mockResolvedValue(baseUser);
    comparePassword.mockResolvedValue(false);

    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: "test@example.com",
        password: "WrongPassword123",
      });

    expect(response.status).toBe(401);

    expect(response.body.message).toMatch(
      /invalid email or password/i,
    );
  });

  test("login fails when email does not exist", async () => {
    userRepo.findByEmail.mockResolvedValue(null);

    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: "unknown@example.com",
        password: "Password123",
      });

    expect(response.status).toBe(401);

    expect(response.body.message).toMatch(
      /invalid email or password/i,
    );

    expect(comparePassword).not.toHaveBeenCalled();
  });

  test("protected route rejects requests without token", async () => {
    const response = await request(app)
      .get("/api/users/me");

    expect(response.status).toBe(401);

    expect(response.body).toMatchObject({
      success: false,
      message: "Authentication required",
      code: "UNAUTHORIZED",
    });

    expect(userRepo.findById).not.toHaveBeenCalled();
  });

  test("protected users/me route accepts a valid token", async () => {
    userRepo.findById.mockResolvedValue(safeUser);

    const token = jwt.sign(
      {
        id: safeUser.id,
        email: safeUser.email,
        role: safeUser.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
        issuer: "ticketmandu",
        audience: "ticketmandu-client",
      },
    );

    const response = await request(app)
      .get("/api/users/me")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);

    expect(response.body.success).toBe(true);

    expect(response.body.data.user).toMatchObject({
      id: safeUser.id,
      name: safeUser.name,
      email: safeUser.email,
      role: safeUser.role,
    });

    expect(userRepo.findById).toHaveBeenCalledWith(
      safeUser.id,
    );
  });

  test("protected route rejects an invalid token", async () => {
    const response = await request(app)
      .get("/api/users/me")
      .set("Authorization", "Bearer invalid-token");

    expect(response.status).toBe(401);

    expect(response.body.message).toMatch(
      /invalid token/i,
    );

    expect(userRepo.findById).not.toHaveBeenCalled();
  });
});