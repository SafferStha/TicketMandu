'use strict';

const express = require('express');
const router = express.Router();
const controller = require('../controllers/order.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireAdmin, requireOrganizer } = require('../middleware/rbac.middleware');
const { validate } = require('../middleware/validate.middleware');
const { createOrderSchema, updateOrderStatusSchema } = require('../validators/order.validator');

router.use(authenticate);
router.post('/', validate(createOrderSchema), controller.createOrder);
router.get('/my', controller.listMyOrders);
router.get('/', controller.listOrders);
router.get('/:id', controller.getOrder);
router.patch('/:id/cancel', controller.cancelOrder);
router.patch('/:id/status', requireAdmin, validate(updateOrderStatusSchema), controller.updateStatus);

module.exports = router;