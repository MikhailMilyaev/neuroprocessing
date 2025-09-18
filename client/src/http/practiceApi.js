import { $authHost } from './index';

export const listPractices = async () => {
  const { data } = await $authHost.get('/api/practice');
  return data; 
};

export const getProgress = async () => {
  const { data } = await $authHost.get('/api/practice/progress');
  return data; 
};

export const getTest = async (slug) => {
  const { data } = await $authHost.get(`/api/practice/${slug}/test`);
  return data; 
};

export const submitTest = async (slug, answers) => {
  const { data } = await $authHost.post(`/api/practice/${slug}/submit`, { answers });
  return data; 
};
