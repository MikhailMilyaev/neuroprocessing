import { $authHost } from './index';

export const listInboxIdeas = async () => {
  const { data } = await $authHost.get('/fast-idea');
  return Array.isArray(data) ? data : [];
};

export const createInboxIdea = async ({ text }, { opId } = {}) => {
  const { data } = await $authHost.post('/fast-idea', { text }, {
    headers: opId ? { 'x-op-id': opId } : undefined,
  });
  return data;
};

export const updateInboxIdea = async (id, payload, { opId } = {}) => {
  const { data } = await $authHost.patch(`/fast-idea/${id}`, payload, {
    headers: opId ? { 'x-op-id': opId } : undefined,
  });
  return data;
};

export const deleteInboxIdea = async (id, { opId } = {}) => {
  const { data } = await $authHost.delete(`/fast-idea/${id}`, {
    headers: opId ? { 'x-op-id': opId } : undefined,
  });
  return data;
};

export const moveInboxIdea = async (id, targetStoryId, { opId } = {}) => {
  const { data } = await $authHost.post(`/fast-idea/${id}/move`, { targetStoryId }, {
    headers: opId ? { 'x-op-id': opId } : undefined,
  });
  return data;
};

export const createStoryFromInboxIdea = async (id, payload = {}, { opId } = {}) => {
  const { data } = await $authHost.post(`/fast-idea/${id}/create-story`, payload, {
    headers: opId ? { 'x-op-id': opId } : undefined,
  });
  return data;
};
