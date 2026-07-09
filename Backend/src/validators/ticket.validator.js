"use strict";

const { z } = require("zod");

const bookTicketSchema = z.object({
  eventId: z.coerce
    .number({
      required_error: "eventId is required",
      invalid_type_error: "eventId must be a number",
    })
    .int("eventId must be an integer")
    .positive("eventId must be positive"),
  seat: z
    .string()
    .max(255, "Seat designation too long")
    .trim()
    .optional()
    .default("General Admission"),
});

module.exports = { bookTicketSchema };
