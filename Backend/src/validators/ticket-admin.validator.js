'use strict';

const { z } = require('zod');

const checkInSchema = z.object({
  ticketNumber: z.string().min(1),
});

module.exports = { checkInSchema };