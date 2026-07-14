'use strict';

const express = require('express');
const router = express.Router();
const controller = require('../controllers/payment.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/rbac.middleware');
const { validate } = require('../middleware/validate.middleware');
const { mockPaymentSchema, updatePaymentStatusSchema } = require('../validators/payment.validator');

router.use(authenticate);
router.post('/mock', validate(mockPaymentSchema), controller.mockPayment);
router.get('/my', controller.listMyPayments);
router.get('/', controller.listPayments);
router.get('/:id', controller.getPayment);
router.patch('/:id/status', requireAdmin, validate(updatePaymentStatusSchema), controller.updateStatus);
router.patch('/:id/refund', requireAdmin, controller.refund);

module.exports = router;