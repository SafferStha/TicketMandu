'use strict';

const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.route');
const userRoutes = require('./user.route');
const eventRoutes = require('./event.route');
const ticketRoutes = require('./ticket.route');

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/events', eventRoutes);
router.use('/tickets', ticketRoutes);

// Health check
router.get('/health', (_req, res) => {
  res.json({ success: true, message: 'TicketMandu API is running', timestamp: new Date().toISOString() });
});

module.exports = router;
