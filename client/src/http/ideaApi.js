import { $authHost } from './index';

export const listIdeas = async (storyId) => {
  const { data } = await $authHost.get(`/idea/story/${storyId}`);
  return data;
};

export const createIdea = async (storyId, payload = {}, { opId } = {}) => {
  const { data } = await $authHost.post(
    `/idea/story/${storyId}`,
    payload,
    opId ? { headers: { 'x-op-id': opId } } : undefined
  );
  return data;
};

export const updateIdea = async (id, payload = {}, { opId } = {}) => {
  const { data } = await $authHost.patch(
    `/idea/${id}`,
    payload,
    opId ? { headers: { 'x-op-id': opId } } : undefined
  );
   return data;
 };

export const deleteIdea = async (id) => {
  const { data } = await $authHost.delete(`/idea/${id}`);
  return data;
};

export const reorderIdeas = async (storyId, order, { opId } = {}) => {
  const { data } = await $authHost.post(
    `/idea/reorder`,
    { storyId, order },
    opId ? { headers: { 'x-op-id': opId } } : undefined
  );
   return data;
 };
