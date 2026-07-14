'use strict';

const { z } = require('zod');

const orderItemSchema = z.object({
  eventId: z.coerce.number().int().positive(),
  ticketTypeId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().int().positive(),
});

const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1, 'At least one order item is required'),
  serviceFee: z.coerce.number().min(0).optional().default(0),
  discountAmount: z.coerce.number().min(0).optional().default(0),
  currency: z.string().trim().max(3).optional().default('NPR'),
});

const updateOrderStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'cancelled', 'expired', 'refunded']),
});

module.exports = { createOrderSchema, updateOrderStatusSchema };