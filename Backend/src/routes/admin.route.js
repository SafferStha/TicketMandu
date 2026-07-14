'use strict';

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/rbac.middleware');
const dashboardController = require('../controllers/dashboard.controller');

router.get('/dashboard', authenticate, requireAdmin, dashboardController.admin);

module.exports = router;
