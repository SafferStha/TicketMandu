import API from "./client";
import { unwrapList, unwrapPagination, unwrapResource } from "./normalizers";

const cleanParams = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== null && value !== "",
    ),
  );

export const paymentsAPI = {
  mockPay: async (orderId, paymentMethod = "mock") => {
    const response = await API.post("/payments/mock", {
      orderId,
      paymentMethod,
    });
    return unwrapResource(response, "payment");
  },
  getMy: async (params) => {
    const response = await API.get("/payments/my", {
      params: cleanParams(params),
    });
    return {
      payments: unwrapList(response),
      pagination: unwrapPagination(response),
    };
  },
  getAll: async (params) => {
    const response = await API.get("/payments", {
      params: cleanParams(params),
    });
    return {
      payments: unwrapList(response),
      pagination: unwrapPagination(response),
    };
  },
  getById: async (id) => {
    const response = await API.get(`/payments/${id}`);
    return unwrapResource(response, "payment");
  },
  updateStatus: async (id, status) => {
    const response = await API.patch(`/payments/${id}/status`, { status });
    return unwrapResource(response, "payment");
  },
  refund: async (id) => {
    const response = await API.patch(`/payments/${id}/refund`);
    return unwrapResource(response, "payment");
  },
};
