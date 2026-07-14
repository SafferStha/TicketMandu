import API from './client';
import { unwrapList, unwrapPagination, unwrapResource } from './normalizers';

const cleanParams = (params = {}) => Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''));

export const ordersAPI = {
  create: async (payload) => {
    const response = await API.post('/orders', payload);
    return unwrapResource(response, 'order');
  },
  getMy: async (params) => {
    const response = await API.get('/orders/my', { params: cleanParams(params) });
    return { orders: unwrapList(response), pagination: unwrapPagination(response) };
  },
  getAll: async (params) => {
    const response = await API.get('/orders', { params: cleanParams(params) });
    return { orders: unwrapList(response), pagination: unwrapPagination(response) };
  },
  getById: async (id) => {
    const response = await API.get(`/orders/${id}`);
    return unwrapResource(response, 'order');
  },
  cancel: async (id) => {
    const response = await API.patch(`/orders/${id}/cancel`);
    return unwrapResource(response, 'order');
  },
  updateStatus: async (id, status) => {
    const response = await API.patch(`/orders/${id}/status`, { status });
    return unwrapResource(response, 'order');
  },
};
