"use strict";

const { z } = require("zod");

const mockPaymentSchema = z.object({
  orderId: z.coerce.number().int().positive(),
  paymentMethod: z
    .enum(["mock", "cod", "esewa_placeholder", "khalti_placeholder"])
    .default("mock"),
});

const updatePaymentStatusSchema = z.object({
  status: z.enum(["pending", "paid", "failed", "refunded"]),
});

module.exports = { mockPaymentSchema, updatePaymentStatusSchema };
