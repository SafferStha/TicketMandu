'use strict';

const express = require('express');
const controller = require('../controllers/crud.controller');
const { authenticate } = require('../middleware/auth.middleware');

const createCrudRouter = (resourceName) => {
  const router = express.Router();
  router.use((req, _res, next) => { req.resourceName = resourceName; next(); });
  router.use(authenticate);
  router.get('/', controller.list);
  router.get('/:id', controller.get);
  router.post('/', controller.create);
  router.put('/:id', controller.update);
  router.patch('/:id', controller.update);
  router.delete('/:id', controller.remove);
  return router;
};

module.exports = { createCrudRouter };
