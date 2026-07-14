'use strict';

const { z } = require('zod');

const mockPaymentSchema = z.object({
  orderId: z.coerce.number().int().positive(),
});

const updatePaymentStatusSchema = z.object({
  status: z.enum(['pending', 'paid', 'failed', 'refunded']),
});

module.exports = { mockPaymentSchema, updatePaymentStatusSchema };