'use strict';

const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.route');
const userRoutes = require('./user.route');
const eventRoutes = require('./event.route');
const ticketRoutes = require('./ticket.route');
const orderRoutes = require('./order.route');
const paymentRoutes = require('./payment.route');
const notificationRoutes = require('./notification.route');
const favoriteRoutes = require('./favorite.route');
const reviewRoutes = require('./review.route');
const adminRoutes = require('./admin.route');
const organizerRoutes = require('./organizer.route');
const { createCrudRouter } = require('./crudResource.route');

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/events', eventRoutes);
router.use('/tickets', ticketRoutes);
router.use('/orders', orderRoutes);
router.use('/payments', paymentRoutes);
router.use('/notifications', notificationRoutes);
router.use('/favorites', favoriteRoutes);
router.use('/reviews', reviewRoutes);
router.use('/admin', adminRoutes);
router.use('/organizer', organizerRoutes);

router.use('/venues', createCrudRouter('venues'));
router.use('/categories', createCrudRouter('categories'));
router.use('/event-categories', createCrudRouter('categories'));
router.use('/organizers', createCrudRouter('organizers'));
router.use('/event-images', createCrudRouter('event-images'));
router.use('/ticket-types', createCrudRouter('ticket-types'));
router.use('/coupons', createCrudRouter('coupons'));
router.use('/seat-maps', createCrudRouter('seat-maps'));
router.use('/seats', createCrudRouter('seats'));
router.use('/audit-logs', createCrudRouter('audit-logs'));


// Health check
router.get('/health', (_req, res) => {
  res.json({ success: true, message: 'TicketMandu API is running', timestamp: new Date().toISOString() });
});

module.exports = router;
