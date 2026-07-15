"use strict";

const { z } = require("zod");

const usernameSchema = z
  .string()
  .min(3, "Username must be at least 3 characters")
  .max(30, "Username must be at most 30 characters")
  .regex(
    /^[a-zA-Z0-9_]+$/,
    "Username may only contain letters, numbers, and underscores",
  )
  .trim()
  .transform((value) => value.toLowerCase());

const phoneSchema = z
  .string()
  .max(20, "Phone must be at most 20 characters")
  .trim()
  .optional()
  .or(z.literal(""));

const updateProfileSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be at most 100 characters")
    .trim()
    .optional(),
  username: usernameSchema.optional(),
  email: z
    .string()
    .email("Must be a valid email address")
    .toLowerCase()
    .trim()
    .optional(),
  phone: phoneSchema,
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "New password must be at least 8 characters")
    .regex(/[A-Z]/, "New password must contain at least one uppercase letter")
    .regex(/[0-9]/, "New password must contain at least one number"),
});

const preferencesSchema = z.object({
  email_notifications: z.coerce.boolean().optional(),
  booking_notifications: z.coerce.boolean().optional(),
  payment_notifications: z.coerce.boolean().optional(),
  ticket_notifications: z.coerce.boolean().optional(),
  event_reminders: z.coerce.boolean().optional(),
  promotional_notifications: z.coerce.boolean().optional(),
  in_app_toasts: z.coerce.boolean().optional(),
  theme: z.enum(["light", "dark", "system"]).optional(),
});

const locationSchema = z.object({
  label: z.string().min(2).max(80).trim(),
  city: z.string().min(2).max(100).trim(),
  area: z.string().max(120).trim().optional().or(z.literal("")),
  address: z.string().min(3).max(255).trim(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  is_default: z.coerce.boolean().optional(),
});

const paymentMethodSchema = z.object({
  method_type: z.enum([
    "mock",
    "cod",
    "esewa_placeholder",
    "khalti_placeholder",
  ]),
  provider: z.string().max(80).trim().optional().or(z.literal("")),
  label: z.string().min(2).max(100).trim(),
  last4: z
    .string()
    .regex(/^\d{4}$/, "Last 4 must be exactly 4 digits")
    .optional()
    .or(z.literal("")),
  is_default: z.coerce.boolean().optional(),
});

const adminUserSchema = z.object({
  name: z.string().min(2).max(100).trim().optional(),
  username: usernameSchema.optional(),
  email: z
    .string()
    .email("Must be a valid email address")
    .toLowerCase()
    .trim()
    .optional(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .optional(),
  phone: z.string().max(20).trim().optional(),
  role: z.enum(["user", "organizer", "admin"]).optional(),
  is_active: z.coerce.boolean().optional(),
});

module.exports = {
  updateProfileSchema,
  passwordSchema,
  preferencesSchema,
  locationSchema,
  paymentMethodSchema,
  adminUserSchema,
};
