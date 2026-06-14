'use strict';

const express = require('express');
const router = express.Router();

const eventController = require('../controllers/event.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireOrganizer, requireAdmin } = require('../middleware/rbac.middleware');
const { validate, validateQuery } = require('../middleware/validate.middleware');
const { searchSchema, createEventSchema, updateEventSchema } = require('../validators/event.validator');

// Public routes — no auth required
// GET /api/events
router.get('/', eventController.listEvents);

// GET /api/events/featured — must come before /:id
router.get('/featured', eventController.getFeatured);

// GET /api/events/search
router.get('/search', validateQuery(searchSchema), eventController.search);

// GET /api/events/:id
router.get('/:id', eventController.getById);

// Organizer/Admin routes — auth required
// POST /api/events
router.post('/', authenticate, requireOrganizer, validate(createEventSchema), eventController.createEvent);

// PUT /api/events/:id
router.put('/:id', authenticate, requireOrganizer, validate(updateEventSchema), eventController.updateEvent);

// DELETE /api/events/:id
router.delete('/:id', authenticate, requireAdmin, eventController.deleteEvent);

module.exports = router;
