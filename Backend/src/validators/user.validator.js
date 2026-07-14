'use strict';

const { z } = require('zod');

const updateProfileSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters')
    .trim()
    .optional(),
  email: z
    .string()
    .email('Must be a valid email address')
    .toLowerCase()
    .trim()
    .optional(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .optional(),
});

const adminUserSchema = z.object({
  name: z.string().min(2).max(100).trim().optional(),
  email: z.string().email('Must be a valid email address').toLowerCase().trim().optional(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .optional(),
  phone: z.string().max(20).trim().optional(),
  role: z.enum(['user', 'organizer', 'admin']).optional(),
  is_active: z.coerce.boolean().optional(),
});

module.exports = { updateProfileSchema, adminUserSchema };
