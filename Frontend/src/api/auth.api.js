import API from './client';
import { unwrapMessage, unwrapResource } from './normalizers';

const normalizeAuthSession = (response) => ({
  user: unwrapResource(response, 'user'),
  accessToken: unwrapResource(response, 'accessToken'),
  refreshToken: unwrapResource(response, 'refreshToken'),
  message: unwrapMessage(response),
});

export const authAPI = {
  register: async (name, email, password) => {
    const response = await API.post('/auth/register', { name, email, password });
    return normalizeAuthSession(response);
  },

  login: async (email, password) => {
    const response = await API.post('/auth/login', { email, password });
    return normalizeAuthSession(response);
  },

  refresh: async (refreshToken) => {
    const response = await API.post('/auth/refresh', { refreshToken });
    return {
      accessToken: unwrapResource(response, 'accessToken'),
      refreshToken: unwrapResource(response, 'refreshToken'),
      message: unwrapMessage(response),
    };
  },

  logout: async (refreshToken) => {
    const response = await API.post('/auth/logout', { refreshToken });
    return { message: unwrapMessage(response) };
  },

  getProfile: async () => {
    const response = await API.get('/users/me');
    return unwrapResource(response, 'user');
  },

  updateProfile: async (data) => {
    const response = await API.put('/users/me', data);
    return unwrapResource(response, 'user');
  },
};
