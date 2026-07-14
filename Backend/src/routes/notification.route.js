'use strict';

const express = require('express');
const router = express.Router();
const controller = require('../controllers/notification.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/rbac.middleware');

router.use(authenticate);
router.get('/', requireAdmin, controller.listAll);
router.get('/my', controller.listMy);
router.patch('/:id/read', controller.markRead);
router.patch('/read-all', controller.markAllRead);
router.delete('/:id', controller.remove);

module.exports = router;