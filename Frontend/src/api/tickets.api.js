import API from './client';
import { unwrapList, unwrapPagination, unwrapResource } from './normalizers';

const cleanParams = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '')
  );

export const ticketsAPI = {
  getMyTickets: async (params) => {
    const response = await API.get('/tickets/my', { params: cleanParams(params) });
    return {
      tickets: unwrapList(response),
      pagination: unwrapPagination(response),
    };
  },

  getAll: async (params) => {
    const response = await API.get('/tickets', { params: cleanParams(params) });
    return {
      tickets: unwrapList(response),
      pagination: unwrapPagination(response),
    };
  },

  getById: async (id) => {
    const ticketId = Number(id);
    if (!Number.isInteger(ticketId) || ticketId <= 0) {
      throw new Error('Invalid ticket ID');
    }

    const response = await API.get(`/tickets/${ticketId}`);
    return unwrapResource(response, 'ticket');
  },

  cancel: async (id) => {
    const response = await API.patch(`/tickets/${id}/cancel`);
    return unwrapResource(response, 'ticket');
  },

  checkIn: async (ticketNumber) => {
    const response = await API.patch('/tickets/check-in', { ticketNumber });
    return unwrapResource(response, 'ticket');
  },

  getStats: async () => {
    const response = await API.get('/tickets/stats');
    return unwrapResource(response, 'stats');
  },
};
