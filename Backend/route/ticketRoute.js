const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const { getMyTickets, bookTicket, getStats } = require('../controller/ticketController');

router.get('/stats', authenticate, getStats);
router.get('/', authenticate, getMyTickets);
router.post('/', authenticate, bookTicket);

module.exports = router;
