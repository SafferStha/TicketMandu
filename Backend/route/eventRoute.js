const express = require('express');
const router = express.Router();
const { getAll, getFeatured, getById, search } = require('../controller/eventController');

// Order matters: literal routes must come before /:id
router.get('/', getAll);
router.get('/featured', getFeatured);
router.get('/search', search);
router.get('/:id', getById);

module.exports = router;
