import { $authHost } from './index';

export const createStory = async (payload = {}) => {
  const { data } = await $authHost.post('/story', payload);
  return data;
};

export const fetchStories = async (params = {}) => {
  const { data } = await $authHost.get('/story', { params });
  return data;
};

export const fetchAllStories = async (baseParams = {}) => {
  const rows = [];
  let cursor = baseParams.cursor ?? null;
  for (let i = 0; i < 50; i++) {
    const page = await fetchStories({ ...baseParams, cursor });
    if (Array.isArray(page?.rows)) rows.push(...page.rows);
    if (!page?.meta?.hasMore || !page?.meta?.nextCursor) break;
    cursor = page.meta.nextCursor;
  }
  return rows;
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

export const updateStory = async (id, patch, { opId } = {}) => {
  const { data } = await $authHost.put(
    `/story/${id}`,
    patch,
    opId ? { headers: { 'x-op-id': opId } } : undefined
  );
  return data;
};

export const reevaluateStory = async (id, { opId } = {}) => {
  const { data } = await $authHost.post(
    `/story/${id}/reevaluate`,
    undefined,
    opId ? { headers: { 'x-op-id': opId } } : undefined
  );
  return data;
};

export const beginRereview = async (id) => {
  const { data } = await $authHost.post(`/story/${id}/rereview-start`);
  return data;
};
