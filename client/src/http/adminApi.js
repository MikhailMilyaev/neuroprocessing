import { $authHost } from './index';

export const adminListUsers = async ({ query = '', limit = 50, offset = 0 } = {}) => {
  const { data } = await $authHost.get('/admin/users', { params: { query, limit, offset } });
  return data; 
};

export const adminGrant = async (userId, days = 30) => {
  const { data } = await $authHost.post(`/admin/users/${userId}/grant`, { days });
  return data; 
};
