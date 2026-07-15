import API from './client';
import { unwrapResource } from './normalizers';

export const usersAPI = {
  getStats: async () => {
    const response = await API.get('/users/me/stats');
    return unwrapResource(response, 'stats');
  },
  getPreferences: async () => {
    const response = await API.get('/users/me/preferences');
    return unwrapResource(response, 'preferences');
  },
  updatePreferences: async (data) => {
    const response = await API.patch('/users/me/preferences', data);
    return unwrapResource(response, 'preferences');
  },
  changePassword: async (payload) => {
    const response = await API.patch('/users/me/password', payload);
    return response.data;
  },
  getLocations: async () => {
    const response = await API.get('/users/me/locations');
    return unwrapResource(response, 'locations') || [];
  },
  createLocation: async (payload) => {
    const response = await API.post('/users/me/locations', payload);
    return unwrapResource(response, 'location');
  },
  updateLocation: async (id, payload) => {
    const response = await API.patch(`/users/me/locations/${id}`, payload);
    return unwrapResource(response, 'location');
  },
  deleteLocation: async (id) => API.delete(`/users/me/locations/${id}`),
  setDefaultLocation: async (id) => {
    const response = await API.patch(`/users/me/locations/${id}/default`);
    return unwrapResource(response, 'location');
  },
  getPaymentMethods: async () => {
    const response = await API.get('/users/me/payment-methods');
    return unwrapResource(response, 'paymentMethods') || [];
  },
  createPaymentMethod: async (payload) => {
    const response = await API.post('/users/me/payment-methods', payload);
    return unwrapResource(response, 'paymentMethod');
  },
  updatePaymentMethod: async (id, payload) => {
    const response = await API.patch(`/users/me/payment-methods/${id}`, payload);
    return unwrapResource(response, 'paymentMethod');
  },
  deletePaymentMethod: async (id) => API.delete(`/users/me/payment-methods/${id}`),
  setDefaultPaymentMethod: async (id) => {
    const response = await API.patch(`/users/me/payment-methods/${id}/default`);
    return unwrapResource(response, 'paymentMethod');
  },
};
