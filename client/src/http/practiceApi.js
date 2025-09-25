import { $authHost } from './index';

export const listPractices = async () => {
  const { data } = await $authHost.get('practice');
  return data;
};

export const getProgress = async () => {
  const { data } = await $authHost.get('practice/progress');
  return data;
};

export const getTest = async (slug) => {
  const { data } = await $authHost.get(`practice/${slug}/test`);
  return data;
};

export const submitTest = async (slug, answers) => {
  const { data } = await $authHost.post(`practice/${slug}/submit`, { answers });
  return data;
};
