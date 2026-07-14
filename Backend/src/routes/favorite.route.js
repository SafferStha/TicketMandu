'use strict';

const express = require('express');
const router = express.Router();
const controller = require('../controllers/favorite.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);
router.post('/:eventId', controller.add);
router.delete('/:eventId', controller.remove);
router.get('/my', controller.listMy);

module.exports = router;