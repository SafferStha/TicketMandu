import axios from 'axios';

const API = axios.create({
  baseURL: '/api',
});

// Attach JWT token to every request when available
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  register: (name, email, password) =>
    API.post('/users/create', { name, email, password }),
  login: (email, password) =>
    API.post('/users/login', { email, password }),
  getProfile: (id) =>
    API.get(`/users/getById/${id}`),
  updateProfile: (id, data) =>
    API.put(`/users/updateById/${id}`, data),
};

export const eventsAPI = {
  getAll: () => API.get('/events'),
  getFeatured: () => API.get('/events/featured'),
  getById: (id) => API.get(`/events/${id}`),
  search: (q, category) =>
    API.get('/events/search', { params: { q, category } }),
};

export const ticketsAPI = {
  getMyTickets: () => API.get('/tickets'),
  bookTicket: (eventId, seat) => API.post('/tickets', { eventId, seat }),
  getStats: () => API.get('/tickets/stats'),
};

export default API;
