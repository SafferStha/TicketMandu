'use strict';

const express = require('express');
const router = express.Router();

const ticketController = require('../controllers/ticket.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const { bookTicketSchema } = require('../validators/ticket.validator');

// All ticket routes require authentication
router.use(authenticate);

// GET /api/tickets/stats — must come before /:id
router.get('/stats', ticketController.getStats);

// GET /api/tickets — get user's tickets
router.get('/', ticketController.getMyTickets);

// POST /api/tickets — book a ticket
router.post('/', validate(bookTicketSchema), ticketController.bookTicket);

module.exports = router;
