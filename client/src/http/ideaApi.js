import { $authHost } from './index';

export const listIdeas = async (storyId) => {
  const { data } = await $authHost.get(`idea/story/${storyId}`);
  return data;
};

export const createIdea = async (storyId, payload = {}) => {
  const { data } = await $authHost.post(`idea/story/${storyId}`, payload);
  return data;
};

export const updateIdea = async (id, payload = {}) => {
  const { data } = await $authHost.patch(`idea/${id}`, payload);
  return data;
};

export const deleteIdea = async (id) => {
  const { data } = await $authHost.delete(`idea/${id}`);
  return data;
};

export const reorderIdeas = async (storyId, order) => {
  const { data } = await $authHost.post(`idea/reorder`, { storyId, order });
  return data;
};
