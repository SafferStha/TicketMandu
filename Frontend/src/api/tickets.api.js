import API from './client';
import { unwrapList, unwrapPagination, unwrapResource } from './normalizers';

const cleanParams = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '')
  );

const normalizeEventId = (eventId) => {
  const numericId = Number(eventId);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    throw new Error('Invalid event ID');
  }
  return numericId;
};

export const ticketsAPI = {
  getMyTickets: async (params) => {
    const response = await API.get('/tickets', { params: cleanParams(params) });
    return {
      tickets: unwrapList(response),
      pagination: unwrapPagination(response),
    };
  },

  bookTicket: async (eventId, seat) => {
    const payload = { eventId: normalizeEventId(eventId) };
    if (seat?.trim()) payload.seat = seat.trim();

    const response = await API.post('/tickets', payload);
    return unwrapResource(response, 'ticket');
  },

  getStats: async () => {
    const response = await API.get('/tickets/stats');
    return unwrapResource(response, 'stats');
  },
};
