'use strict';

const express = require('express');
const router = express.Router();
const controller = require('../controllers/review.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.get('/events/:eventId/reviews', controller.listByEvent);
router.use(authenticate);
router.get('/', controller.list);
router.post('/', controller.create);
router.patch('/:id', controller.update);
router.delete('/:id', controller.remove);
router.patch('/:id/status', controller.status);

module.exports = router;