'use strict';

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { requireOrganizer } = require('../middleware/rbac.middleware');
const dashboardController = require('../controllers/dashboard.controller');

router.get('/dashboard', authenticate, requireOrganizer, dashboardController.organizer);

module.exports = router;
