import { $authHost } from './index';

export const createStory = async (payload = {}) => {
  const { data } = await $authHost.post('/story', payload);
  return data;
};

export const fetchStories = async (params = {}) => {
  const { data } = await $authHost.get('/story', { params });
  return data;
};

export const fetchStoryBySlug = async (slug) => {
  const { data } = await $authHost.get(`/story/slug/${encodeURIComponent(slug)}`);
  return data;
};

export const fetchStory = async (id) => {
  const { data } = await $authHost.get(`/story/${id}`);
  return data;
};

export const fetchStoryFull = async (id) => {
  const { data } = await $authHost.get(`/story/${id}/full`);
  return data;
};

export const removeStory = async (id) => {
  const { data } = await $authHost.delete(`/story/${id}`);
  return data;
};

export const updateStory = async (id, story) => {
  const { data } = await $authHost.put(`/story/${id}`, story);
  return data;
};

export const setStoryStop = async (id, stopContentY) => {
  const { data } = await $authHost.put(`/story/${id}/stop`, { stopContentY });
  return data;
};

export const clearStoryStop = async (id) => {
  const { data } = await $authHost.delete(`/story/${id}/stop`);
  return data;
};

export const reevaluateStory = async (id) => {
  const { data } = await $authHost.post(`/story/${id}/reevaluate`);
  return data;
};

export const beginRereview = async (id) => {
  const { data } = await $authHost.post(`/story/${id}/rereview-start`);
  return data;
};
