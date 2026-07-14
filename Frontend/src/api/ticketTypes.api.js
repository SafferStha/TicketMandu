import API from './client';
import { unwrapList } from './normalizers';

export const ticketTypesAPI = {
  getByEvent: async (eventId) => {
    const response = await API.get(`/events/${eventId}/ticket-types`);
    const data = response?.data?.data?.ticketTypes || response?.data?.ticketTypes || [];
    return Array.isArray(data) ? data : unwrapList(response);
  },
};
