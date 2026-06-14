'use strict';

const express = require('express');
const router = express.Router();

const userController = require('../controllers/user.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/rbac.middleware');
const { validate } = require('../middleware/validate.middleware');
const { upload } = require('../middleware/upload.middleware');
const { updateProfileSchema } = require('../validators/user.validator');

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

// DELETE /api/users/:id — delete user (admin)
router.delete('/:id', authenticate, requireAdmin, userController.deleteUser);

module.exports = router;
