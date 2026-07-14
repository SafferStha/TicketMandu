'use strict';

const { z } = require('zod');

const searchSchema = z.object({
  q: z.string().trim().optional(),
  category: z.string().trim().optional(),
  status: z.enum(['draft', 'published', 'cancelled', 'completed']).optional(),
  featured: z.union([z.string(), z.boolean()]).optional(),
  scope: z.enum(['public', 'all']).optional(),
  dateFrom: z.string().trim().optional(),
  dateTo: z.string().trim().optional(),
  page: z
    .string()
    .regex(/^\d+$/, 'page must be a number')
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 1)),
  limit: z
    .string()
    .regex(/^\d+$/, 'limit must be a number')
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 20)),
  sort: z.enum(['date', 'price', 'name', 'created_at']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
  minPrice: z
    .string()
    .regex(/^\d+(\.\d+)?$/, 'minPrice must be a number')
    .optional()
    .transform((v) => (v ? parseFloat(v) : undefined)),
  maxPrice: z
    .string()
    .regex(/^\d+(\.\d+)?$/, 'maxPrice must be a number')
    .optional()
    .transform((v) => (v ? parseFloat(v) : undefined)),
});

const createEventSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(300).trim(),
  date: z.string().trim(),
  time: z.string().trim(),
  venue: z.string().min(2).max(255).trim(),
  price: z.number().min(0, 'Price must be non-negative'),
  category: z.enum(['Music', 'Sports', 'Arts', 'Comedy', 'Family', 'Theater']),
  icon: z.string().max(10).optional(),
  featured: z.boolean().optional().default(false),
  description: z.string().max(5000).optional(),
  cover_image_url: z.string().url().optional().or(z.literal('')),
  starts_at: z.string().trim().optional(),
  ends_at: z.string().trim().optional(),
  status: z.enum(['draft', 'published', 'cancelled', 'completed']).optional(),
  organizer_id: z.coerce.number().int().positive().optional(),
  venue_id: z.coerce.number().int().positive().optional(),
  total_capacity: z.coerce.number().int().positive().optional(),
});

const updateEventSchema = createEventSchema.partial();

module.exports = { searchSchema, createEventSchema, updateEventSchema };
