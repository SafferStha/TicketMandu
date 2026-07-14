import API from './client';
import { unwrapList, unwrapPagination, unwrapResource, unwrapData } from './normalizers';

const cleanParams = (params = {}) =>
  Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''));

export const resourcesAPI = {
  list: async (endpoint, params) => {
    const response = await API.get(endpoint, { params: cleanParams(params) });
    return { rows: unwrapList(response), pagination: unwrapPagination(response) };
  },
  get: async (endpoint, id) => {
    const response = await API.get(`${endpoint}/${id}`);
    return unwrapResource(response, 'item') || unwrapResource(response);
  },
  create: async (endpoint, payload) => {
    const response = await API.post(endpoint, payload);
    return unwrapResource(response, 'item') || unwrapResource(response);
  },
  update: async (endpoint, id, payload) => {
    const response = await API.patch(`${endpoint}/${id}`, payload);
    return unwrapResource(response, 'item') || unwrapResource(response);
  },
  remove: async (endpoint, id) => {
    const response = await API.delete(`${endpoint}/${id}`);
    return unwrapResource(response, 'item') || unwrapResource(response);
  },
  dashboard: async (role = 'user') => {
    const path = role === 'admin' ? '/admin/dashboard' : role === 'organizer' ? '/organizer/dashboard' : '/users/dashboard';
    const response = await API.get(path);
    return unwrapData(response);
  },
};
