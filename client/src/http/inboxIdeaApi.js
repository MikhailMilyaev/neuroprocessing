import { $authHost } from './index';

export const listInboxIdeas = async () => {
  const { data } = await $authHost.get('/fast-idea');
  return Array.isArray(data) ? data : [];
};

export const createInboxIdea = async ({ text }) => {
  const { data } = await $authHost.post('/fast-idea', { text });
  return data;
};

export const updateInboxIdea = async (id, payload) => {
  const { data } = await $authHost.patch(`/fast-idea/${id}`, payload);
  return data;
};

export const deleteInboxIdea = async (id) => {
  const { data } = await $authHost.delete(`/fast-idea/${id}`);
  return data;
};

export const moveInboxIdea = async (id, targetStoryId) => {
  const { data } = await $authHost.post(`/fast-idea/${id}/move`, { targetStoryId });
  return data;
};

export const createStoryFromInboxIdea = async (id) => {
  const { data } = await $authHost.post(`/fast-idea/${id}/create-story`);
  return data;
};
