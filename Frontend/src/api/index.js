import axios from 'axios';

const API = axios.create({
  baseURL: '/api',
});

// ── Request interceptor: attach access token ──────────────────────────────────
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Token refresh state ───────────────────────────────────────────────────────
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

// ── Response interceptor: auto-refresh on 401 TOKEN_EXPIRED ──────────────────
API.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (!original) return Promise.reject(error);

    const code = error.response?.data?.code;

    if (error.response?.status === 401 && code === 'TOKEN_EXPIRED' && !original._retry && !original.url?.includes('/auth/refresh')) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return API(original);
        });
      }

      original._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        isRefreshing = false;
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post('/api/auth/refresh', { refreshToken });
        const { accessToken, refreshToken: newRefresh } = data.data;

        localStorage.setItem('token', accessToken);
        if (newRefresh) localStorage.setItem('refreshToken', newRefresh);

        API.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
        processQueue(null, accessToken);

        original.headers.Authorization = `Bearer ${accessToken}`;
        return API(original);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ── Auth endpoints ────────────────────────────────────────────────────────────
export const authAPI = {
  register: (name, email, password) =>
    API.post('/auth/register', { name, email, password }),
  login: (email, password) =>
    API.post('/auth/login', { email, password }),
  refresh: (refreshToken) =>
    API.post('/auth/refresh', { refreshToken }),
  logout: (refreshToken) =>
    API.post('/auth/logout', { refreshToken }),
  getProfile: () =>
    API.get('/users/me'),
  updateProfile: (data) =>
    API.put('/users/me', data),
};

// ── Events endpoints ──────────────────────────────────────────────────────────
export const eventsAPI = {
  getAll: (params) => API.get('/events', { params }),
  getFeatured: () => API.get('/events/featured'),
  getById: (id) => API.get(`/events/${id}`),
  search: (q, category, params) =>
    API.get('/events/search', { params: { q, category, ...params } }),
};

// ── Tickets endpoints ─────────────────────────────────────────────────────────
export const ticketsAPI = {
  getMyTickets: (params) => API.get('/tickets', { params }),
  bookTicket: (eventId, seat) => API.post('/tickets', { eventId, seat }),
  getStats: () => API.get('/tickets/stats'),
};

export default API;
