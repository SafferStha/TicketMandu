import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
});

const clearSession = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
};

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

API.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (!original) return Promise.reject(error);

    const isRefreshRequest = original.url?.includes('/auth/refresh');
    const isAuthRequest = original.url?.includes('/auth/login') || original.url?.includes('/auth/register');

    if (error.response?.status === 401 && !original._retry && !isRefreshRequest && !isAuthRequest) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return API(original);
        });
      }

      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        clearSession();
        return Promise.reject(error);
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(`${API.defaults.baseURL}/auth/refresh`, { refreshToken });
        const { accessToken, refreshToken: newRefreshToken } = data.data || {};

        if (!accessToken) throw new Error('Refresh response did not include an access token');

        localStorage.setItem('token', accessToken);
        if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken);

        API.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
        processQueue(null, accessToken);

        original.headers.Authorization = `Bearer ${accessToken}`;
        return API(original);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        clearSession();
        if (window.location.pathname !== '/login') window.location.href = '/login';
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export { clearSession };
export default API;
