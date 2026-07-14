import API from './client';
import { unwrapList, unwrapPagination, unwrapResource } from './normalizers';

export const notificationsAPI = {
  getMy: async (params) => {
    const response = await API.get('/notifications/my', { params });
    return { notifications: unwrapList(response), pagination: unwrapPagination(response) };
  },
  markRead: async (id) => {
    const response = await API.patch(`/notifications/${id}/read`);
    return unwrapResource(response, 'notification');
  },
  markAllRead: async () => {
    const response = await API.patch('/notifications/read-all');
    return unwrapResource(response);
  },
  remove: async (id) => {
    const response = await API.delete(`/notifications/${id}`);
    return unwrapResource(response);
  },
};
