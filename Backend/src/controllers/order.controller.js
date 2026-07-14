'use strict';

const orderService = require('../services/order.service');
const response = require('../utils/response.util');

const createOrder = async (req, res, next) => {
  try {
    const order = await orderService.createOrder(req.user.id, req.body, req.user);
    return response.created(res, { order }, 'Order created successfully');
  } catch (err) { return next(err); }
};

const listMyOrders = async (req, res, next) => {
  try {
    const result = await orderService.listOrders({ ...req.user, role: 'user' }, req.query);
    return response.paginated(res, result.orders, result.pagination);
  } catch (err) { return next(err); }
};

const listOrders = async (req, res, next) => {
  try {
    const result = await orderService.listOrders(req.user, req.query);
    return response.paginated(res, result.orders, result.pagination);
  } catch (err) { return next(err); }
};

const getOrder = async (req, res, next) => {
  try {
    const order = await orderService.getOrder(req.user, req.params.id);
    return response.success(res, { order });
  } catch (err) { return next(err); }
};

const cancelOrder = async (req, res, next) => {
  try {
    const order = await orderService.cancelOrder(req.user, req.params.id);
    return response.success(res, { order }, 'Order cancelled successfully');
  } catch (err) { return next(err); }
};

const updateStatus = async (req, res, next) => {
  try {
    const order = await orderService.updateOrderStatus(req.user, req.params.id, req.body.status);
    return response.success(res, { order }, 'Order status updated successfully');
  } catch (err) { return next(err); }
};

const dashboard = async (_req, res, next) => {
  try {
    const data = await orderService.getDashboard();
    return response.success(res, data);
  } catch (err) { return next(err); }
};

module.exports = { createOrder, listMyOrders, listOrders, getOrder, cancelOrder, updateStatus, dashboard };