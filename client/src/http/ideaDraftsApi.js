import { $authHost } from './index';

export const listIdeaDrafts = async () => {
  const { data } = await $authHost.get('/idea-drafts');
  return Array.isArray(data) ? data : [];
};

export const createIdeaDraft = async ({ text }, { opId } = {}) => {
  const { data } = await $authHost.post(
    '/idea-drafts',
    { text },
    { headers: opId ? { 'x-op-id': opId } : undefined }
  );
  return data;
};

export const updateIdeaDraft = async (id, payload, { opId } = {}) => {
  const { data } = await $authHost.patch(
    `/idea-drafts/${id}`,
    payload,
    { headers: opId ? { 'x-op-id': opId } : undefined }
  );
  return data;
};

export const deleteIdeaDraft = async (id, { opId } = {}) => {
  const { data } = await $authHost.delete(
    `/idea-drafts/${id}`,
    { headers: opId ? { 'x-op-id': opId } : undefined }
  );
  return data;
};

export const moveIdeaDraft = async (id, targetStoryId, { opId } = {}) => {
  const { data } = await $authHost.post(
    `/idea-drafts/${id}/move`,
    { targetStoryId },
    { headers: opId ? { 'x-op-id': opId } : undefined }
  );
  return data;
};

export const createStoryFromIdeaDraft = async (id, payload = {}, { opId } = {}) => {
  const { data } = await $authHost.post(
    `/idea-drafts/${id}/create-story`,
    payload,
    { headers: opId ? { 'x-op-id': opId } : undefined }
  );
  return data;
};
