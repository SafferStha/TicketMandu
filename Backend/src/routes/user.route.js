'use strict';

const express = require('express');
const router = express.Router();

const userController = require('../controllers/user.controller');
const dashboardController = require('../controllers/dashboard.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/rbac.middleware');
const { validate } = require('../middleware/validate.middleware');
const { upload } = require('../middleware/upload.middleware');
const { updateProfileSchema, adminUserSchema } = require('../validators/user.validator');

// GET /api/users/dashboard — get own customer dashboard
router.get('/dashboard', authenticate, dashboardController.user);

// GET /api/users/me — get own profile
router.get('/me', authenticate, userController.getMe);

// PUT /api/users/me — update own profile (with optional avatar upload)
router.put(
  '/me',
  authenticate,
  upload.single('image'),
  validate(updateProfileSchema),
  userController.updateMe
);

// Admin-only routes
// GET /api/users — list all users (admin)
router.get('/', authenticate, requireAdmin, userController.listUsers);

// POST /api/users — create user (admin)
router.post('/', authenticate, requireAdmin, validate(adminUserSchema), userController.createUser);

// PUT /api/users/:id — update user (admin)
router.put('/:id', authenticate, requireAdmin, validate(adminUserSchema.partial()), userController.updateUser);

// PATCH /api/users/:id — update user (admin)
router.patch('/:id', authenticate, requireAdmin, validate(adminUserSchema.partial()), userController.updateUser);

// PATCH /api/users/:id/status — activate/deactivate user (admin)
router.patch('/:id/status', authenticate, requireAdmin, userController.setUserStatus);

// DELETE /api/users/:id — delete user (admin)
router.delete('/:id', authenticate, requireAdmin, userController.deleteUser);

module.exports = router;
