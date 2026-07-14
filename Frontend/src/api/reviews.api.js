import API from './client';
import { unwrapResource } from './normalizers';

export const reviewsAPI = {
  create: async (payload) => {
    const response = await API.post('/reviews', payload);
    return unwrapResource(response, 'review');
  },
  getByEvent: async (eventId) => {
    const response = await API.get(`/events/${eventId}/reviews`);
    return unwrapResource(response);
  },
  update: async (id, payload) => {
    const response = await API.patch(`/reviews/${id}`, payload);
    return unwrapResource(response, 'review');
  },
  remove: async (id) => {
    const response = await API.delete(`/reviews/${id}`);
    return unwrapResource(response);
  },
  setStatus: async (id, is_visible) => {
    const response = await API.patch(`/reviews/${id}/status`, { is_visible });
    return unwrapResource(response, 'review');
  },
};
