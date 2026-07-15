"use strict";

const paymentService = require("../services/payment.service");
const response = require("../utils/response.util");

const mockPayment = async (req, res, next) => {
  try {
    const payment = await paymentService.mockPay(
      req.user,
      req.body.orderId,
      req.body.paymentMethod,
    );
    return response.created(res, { payment }, "Payment successful");
  } catch (err) {
    return next(err);
  }
};

const listMyPayments = async (req, res, next) => {
  try {
    const result = await paymentService.listPayments(
      { ...req.user, role: "user" },
      req.query,
    );
    return response.paginated(res, result.payments, result.pagination);
  } catch (err) {
    return next(err);
  }
};

const listPayments = async (req, res, next) => {
  try {
    const result = await paymentService.listPayments(req.user, req.query);
    return response.paginated(res, result.payments, result.pagination);
  } catch (err) {
    return next(err);
  }
};

const getPayment = async (req, res, next) => {
  try {
    const payment = await paymentService.getPayment(req.user, req.params.id);
    return response.success(res, { payment });
  } catch (err) {
    return next(err);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const payment = await paymentService.updatePaymentStatus(
      req.user,
      req.params.id,
      req.body.status,
    );
    return response.success(
      res,
      { payment },
      "Payment status updated successfully",
    );
  } catch (err) {
    return next(err);
  }
};

const refund = async (req, res, next) => {
  try {
    const payment = await paymentService.refundPayment(req.user, req.params.id);
    return response.success(res, { payment }, "Payment refunded successfully");
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  mockPayment,
  listMyPayments,
  listPayments,
  getPayment,
  updateStatus,
  refund,
};
