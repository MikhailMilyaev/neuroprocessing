import { $authHost } from './index';

export const createStory = async (payload = {}) => {
  const { data } = await $authHost.post('/api/story', payload);
  return data;
};

export const fetchStories = async (params = {}) => {
  const { data } = await $authHost.get('/api/story', { params });
  return data;
};

export const fetchStoryBySlug = async (slug) => {
  const { data } = await $authHost.get(`/api/story/slug/${encodeURIComponent(slug)}`);
  return data;
};

export const fetchStory = async (id) => {
  const { data } = await $authHost.get(`/api/story/${id}`);
  return data;
};

export const fetchStoryFull = async (id) => {
  const { data } = await $authHost.get(`/api/story/${id}/full`);
  return data;
};

export const removeStory = async (id) => {
  const { data } = await $authHost.delete(`/api/story/${id}`);
  return data;
};

export const updateStory = async (id, story) => {
  const { data } = await $authHost.put(`/api/story/${id}`, story);
  return data;
};

export const setStoryStop = async (id, stopContentY) => {
  const { data } = await $authHost.put(`/api/story/${id}/stop`, { stopContentY });
  return data;
};

export const clearStoryStop = async (id) => {
  const { data } = await $authHost.delete(`/api/story/${id}/stop`);
  return data;
};

export const reevaluateStory = async (id) => {
  const { data } = await $authHost.post(`/api/story/${id}/reevaluate`);
  return data;
};

export const beginRereview = async (id) => {
  const { data } = await $authHost.post(`/api/story/${id}/rereview-start`);
  return data;
};
