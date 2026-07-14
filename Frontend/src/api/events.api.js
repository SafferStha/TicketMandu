import API from './client';
import { unwrapList, unwrapPagination, unwrapResource } from './normalizers';

const cleanParams = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '')
  );

export const eventsAPI = {
  getAll: async (params) => {
    const response = await API.get('/events', { params: cleanParams(params) });
    return {
      events: unwrapList(response),
      pagination: unwrapPagination(response),
    };
  },

  getFeatured: async (params) => {
    const response = await API.get('/events/featured', { params: cleanParams(params) });
    return unwrapResource(response, 'events') || [];
  },

  getById: async (id) => {
    const eventId = Number(id);
    if (!Number.isInteger(eventId) || eventId <= 0) {
      throw new Error('Invalid event ID');
    }

    const response = await API.get(`/events/${eventId}`);
    return unwrapResource(response, 'event');
  },

  getTicketTypes: async (id) => {
    const eventId = Number(id);
    if (!Number.isInteger(eventId) || eventId <= 0) {
      throw new Error('Invalid event ID');
    }

    const response = await API.get(`/events/${eventId}/ticket-types`);
    return unwrapResource(response, 'ticketTypes') || [];
  },

  search: async ({ q, category, ...params } = {}) => {
    const response = await API.get('/events/search', {
      params: cleanParams({ q, category: category === 'all' ? undefined : category, ...params }),
    });
    return {
      events: unwrapList(response),
      pagination: unwrapPagination(response),
    };
  },
};
