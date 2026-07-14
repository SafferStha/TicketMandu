import API from './client';
import { unwrapResource } from './normalizers';

export const favoritesAPI = {
  add: async (eventId) => {
    const response = await API.post(`/favorites/${eventId}`);
    return unwrapResource(response);
  },
  remove: async (eventId) => {
    const response = await API.delete(`/favorites/${eventId}`);
    return unwrapResource(response);
  },
  getMy: async () => {
    const response = await API.get('/favorites/my');
    return unwrapResource(response, 'favorites') || [];
  },
};
