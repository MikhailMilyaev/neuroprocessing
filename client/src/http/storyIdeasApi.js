import { $authHost } from './index';

export const listStoryIdeas = async (storyId) => {
  const { data } = await $authHost.get(`/story-ideas/story/${storyId}`);
  return data;
};

export const createStoryIdea = async (storyId, payload = {}, { opId } = {}) => {
  const { data } = await $authHost.post(
    `/story-ideas/story/${storyId}`,
    payload,
    opId ? { headers: { 'x-op-id': opId } } : undefined
  );
  return data;
};

export const updateStoryIdea = async (id, payload = {}, { opId } = {}) => {
  const { data } = await $authHost.patch(
    `/story-ideas/${id}`,
    payload,
    opId ? { headers: { 'x-op-id': opId } } : undefined
  );
  return data;
};

export const deleteStoryIdea = async (id, { opId } = {}) => {
  const { data } = await $authHost.delete(
    `/story-ideas/${id}`,
    opId ? { headers: { 'x-op-id': opId } } : undefined
  );
  return data;
};

export const reorderStoryIdeas = async (storyId, order, { opId } = {}) => {
  const { data } = await $authHost.post(
    `/story-ideas/reorder`,
    { storyId, order },
    opId ? { headers: { 'x-op-id': opId } } : undefined
  );
  return data;
};
